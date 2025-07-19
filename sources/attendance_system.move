/// University Attendance System Backend
/// Processes verified attendance events (NFC + Face Recognition) and manages token issuance
/// Only this contract can mint tokens - students cannot mint directly
module clt_tutorial::attendance_system {
    use iota::coin::TreasuryCap;
    use iota::token::{TokenPolicy, TokenPolicyCap, Token};
    use iota::tx_context::{Self, TxContext};
    use iota::object::{Self, UID};
    use clt_tutorial::attendance_token::{Self, ATTENDANCE_TOKEN};
    use clt_tutorial::university_rule;

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInvalidAttendance: u64 = 2;
    const EAlreadyRecorded: u64 = 3;
    const EInsufficientTokens: u64 = 4;
    const ESystemPaused: u64 = 5;

    /// Attendance verification data
    public struct AttendanceProof has store, drop, copy {
        student_id: address,
        nfc_hash: vector<u8>,      // Hash of NFC scan data
        face_hash: vector<u8>,     // Hash of facial recognition data
        location: vector<u8>,      // Campus/classroom location
        timestamp: u64,
        course_id: vector<u8>,
    }

    /// System configuration and state
    public struct AttendanceSystem has key {
        id: UID,
        /// Treasury capability for minting tokens
        treasury_cap: TreasuryCap<ATTENDANCE_TOKEN>,
        /// Policy capability for managing university members
        policy_cap: TokenPolicyCap<ATTENDANCE_TOKEN>,
        /// System admin (university IT department)
        admin: address,
        /// Authorized verifiers (backend services that can process attendance)
        authorized_verifiers: vector<address>,
        /// Daily attendance tracking (student -> timestamp of last attendance)
        daily_attendance: iota::table::Table<address, u64>,
        /// System settings
        tokens_per_attendance: u64,
        max_tokens_per_day: u64,
        system_paused: bool,
        /// Statistics
        total_attendances_recorded: u64,
        total_tokens_issued: u64,
    }

    /// Attendance verification request (from external systems)
    public struct AttendanceRequest has drop {
        proof: AttendanceProof,
        verification_signature: vector<u8>, // Signature from verification system
    }

    /// Event emitted when attendance is successfully processed
    public struct AttendanceProcessed has copy, drop {
        student: address,
        tokens_earned: u64,
        course_id: vector<u8>,
        timestamp: u64,
        verification_method: vector<u8>, // "NFC+Face" or other methods
    }

    /// Initialize the attendance system (called once during deployment)
    fun init(ctx: &mut TxContext) {
        // Note: This will be called automatically when the attendance_token module is published
        // The actual system setup requires admin to call setup_system after deployment
    }

    /// Setup the attendance system with treasury and policy capabilities
    /// Must be called by admin after token deployment
    public fun setup_system(
        treasury_cap: TreasuryCap<ATTENDANCE_TOKEN>,
        policy_cap: TokenPolicyCap<ATTENDANCE_TOKEN>,
        admin: address,
        initial_verifiers: vector<address>,
        ctx: &mut TxContext
    ) {
        let system = AttendanceSystem {
            id: object::new(ctx),
            treasury_cap,
            policy_cap,
            admin,
            authorized_verifiers: initial_verifiers,
            daily_attendance: iota::table::new(ctx),
            tokens_per_attendance: 1, // Default: 1 token per attendance
            max_tokens_per_day: 5,    // Default: max 5 tokens per day
            system_paused: false,
            total_attendances_recorded: 0,
            total_tokens_issued: 0,
        };

        // Transfer system to admin
        transfer::transfer(system, admin);
    }

    /// Add university members (admin function)
    public fun add_university_members(
        system: &mut AttendanceSystem,
        policy: &mut TokenPolicy<ATTENDANCE_TOKEN>,
        members: vector<address>,
        roles: vector<university_rule::Role>,
        ctx: &mut TxContext
    ) {
        // Only admin can add members
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        attendance_token::add_university_members(
            policy, 
            &system.policy_cap, 
            members, 
            roles, 
            ctx
        );
    }

    /// Process verified attendance (called by authorized verifiers only)
    /// This is the main function that external verification systems call
    public fun process_verified_attendance(
        system: &mut AttendanceSystem,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        request: AttendanceRequest,
        ctx: &mut TxContext
    ) {
        // Check system is not paused
        assert!(!system.system_paused, ESystemPaused);
        
        // Verify caller is authorized
        assert!(
            vector::contains(&system.authorized_verifiers, &tx_context::sender(ctx)),
            ENotAuthorized
        );

        let proof = request.proof;
        let student = proof.student_id;
        
        // Verify student is registered in university
        assert!(
            attendance_token::is_student(policy, student),
            ENotAuthorized
        );

        // Check daily limits
        let current_day = get_current_day(ctx);
        let can_earn_today = check_daily_limit(system, student, current_day);
        assert!(can_earn_today, EAlreadyRecorded);

        // Record attendance for today
        if (iota::table::contains(&system.daily_attendance, student)) {
            *iota::table::borrow_mut(&mut system.daily_attendance, student) = current_day;
        } else {
            iota::table::add(&mut system.daily_attendance, student, current_day);
        };

        // Issue attendance tokens
        let tokens_to_issue = system.tokens_per_attendance;
        attendance_token::issue_attendance_tokens(
            &mut system.treasury_cap,
            tokens_to_issue,
            student,
            proof.course_id,
            ctx
        );

        // Update statistics
        system.total_attendances_recorded = system.total_attendances_recorded + 1;
        system.total_tokens_issued = system.total_tokens_issued + tokens_to_issue;

        // Emit event
        iota::event::emit(AttendanceProcessed {
            student,
            tokens_earned: tokens_to_issue,
            course_id: proof.course_id,
            timestamp: proof.timestamp,
            verification_method: b"NFC+Face",
        });
    }

    /// Manual attendance entry (admin function for special cases)
    public fun manual_attendance_entry(
        system: &mut AttendanceSystem,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        student: address,
        course_id: vector<u8>,
        reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can manually add attendance
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        // Verify student is registered (or admin for demo purposes)
        assert!(
            attendance_token::is_student(policy, student) || student == system.admin,
            ENotAuthorized
        );

        // Issue tokens
        attendance_token::issue_attendance_tokens(
            &mut system.treasury_cap,
            system.tokens_per_attendance,
            student,
            course_id,
            ctx
        );

        // Update statistics
        system.total_attendances_recorded = system.total_attendances_recorded + 1;
        system.total_tokens_issued = system.total_tokens_issued + system.tokens_per_attendance;
    }

    /// Apply penalty/slash tokens (admin function)
    public fun apply_penalty(
        system: &mut AttendanceSystem,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        student: address,
        penalty_tokens: Token<ATTENDANCE_TOKEN>,
        reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can apply penalties
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        // Slash the tokens
        attendance_token::slash_tokens(
            &mut system.treasury_cap,
            penalty_tokens,
            reason,
            student,
            ctx
        );
    }

    /// Bulk penalty application (for academic misconduct, etc.)
    public fun bulk_penalty(
        system: &mut AttendanceSystem,
        _policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        mut students: vector<address>,
        mut penalty_tokens: vector<Token<ATTENDANCE_TOKEN>>,
        reason: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can apply bulk penalties
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        assert!(vector::length(&students) == vector::length(&penalty_tokens), EInvalidAttendance);

        // Apply penalties to each student
        while (!vector::is_empty(&students)) {
            let student = vector::pop_back(&mut students);
            let tokens = vector::pop_back(&mut penalty_tokens);
            
            attendance_token::slash_tokens(
                &mut system.treasury_cap,
                tokens,
                reason,
                student,
                ctx
            );
        };
        
        // Ensure vectors are fully consumed
        vector::destroy_empty(students);
        vector::destroy_empty(penalty_tokens);
    }

    /// Add authorized verifier (admin function)
    public fun add_verifier(
        system: &mut AttendanceSystem,
        verifier: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        if (!vector::contains(&system.authorized_verifiers, &verifier)) {
            vector::push_back(&mut system.authorized_verifiers, verifier);
        };
    }

    /// Remove authorized verifier (admin function)
    public fun remove_verifier(
        system: &mut AttendanceSystem,
        verifier: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        let (found, index) = vector::index_of(&system.authorized_verifiers, &verifier);
        if (found) {
            vector::remove(&mut system.authorized_verifiers, index);
        };
    }

    /// Update system settings (admin function)
    public fun update_settings(
        system: &mut AttendanceSystem,
        tokens_per_attendance: u64,
        max_tokens_per_day: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        
        system.tokens_per_attendance = tokens_per_attendance;
        system.max_tokens_per_day = max_tokens_per_day;
    }

    /// Pause/unpause system (admin function)
    public fun set_system_pause(
        system: &mut AttendanceSystem,
        paused: bool,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == system.admin, ENotAuthorized);
        system.system_paused = paused;
    }

    /// Create attendance proof (helper for external systems)
    public fun create_attendance_proof(
        student_id: address,
        nfc_hash: vector<u8>,
        face_hash: vector<u8>,
        location: vector<u8>,
        course_id: vector<u8>,
        ctx: &TxContext
    ): AttendanceProof {
        AttendanceProof {
            student_id,
            nfc_hash,
            face_hash,
            location,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            course_id,
        }
    }

    /// Create attendance request (helper for external systems)
    public fun create_attendance_request(
        proof: AttendanceProof,
        verification_signature: vector<u8>
    ): AttendanceRequest {
        AttendanceRequest {
            proof,
            verification_signature,
        }
    }

    // === View Functions ===

    /// Get system statistics
    public fun get_system_stats(system: &AttendanceSystem): (u64, u64, bool) {
        (system.total_attendances_recorded, system.total_tokens_issued, system.system_paused)
    }

    /// Check if address is authorized verifier
    public fun is_authorized_verifier(system: &AttendanceSystem, addr: address): bool {
        vector::contains(&system.authorized_verifiers, &addr)
    }

    /// Get system settings
    public fun get_settings(system: &AttendanceSystem): (u64, u64) {
        (system.tokens_per_attendance, system.max_tokens_per_day)
    }

    /// Get current day (for daily limits)
    fun get_current_day(ctx: &TxContext): u64 {
        tx_context::epoch_timestamp_ms(ctx) / (24 * 60 * 60 * 1000) // Convert to days
    }

    /// Check if student can earn tokens today
    fun check_daily_limit(
        system: &AttendanceSystem,
        student: address,
        current_day: u64
    ): bool {
        if (!iota::table::contains(&system.daily_attendance, student)) {
            return true // First time
        };
        
        let last_attendance_day = *iota::table::borrow(&system.daily_attendance, student);
        last_attendance_day < current_day // Can only earn once per day
    }
} 