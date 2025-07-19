/// University Attendance Closed Loop Token (CLT)
/// Students earn tokens for verified attendance, restricted to university members only
module clt_tutorial::attendance_token {
    use iota::coin::{Self, TreasuryCap};
    use iota::token::{Self, TokenPolicy, TokenPolicyCap, Token, ActionRequest};
    use iota::tx_context::{Self, TxContext};
    use clt_tutorial::university_rule;

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EInvalidAmount: u64 = 3;

    /// The University Attendance Token - One Time Witness
    public struct ATTENDANCE_TOKEN has drop {}

    /// Attendance record event (emitted when tokens are minted)
    public struct AttendanceRecorded has copy, drop {
        student: address,
        tokens_earned: u64,
        timestamp: u64,
        course_id: vector<u8>, // Optional course identifier
    }

    /// Penalty event (emitted when tokens are slashed)
    public struct PenaltyApplied has copy, drop {
        student: address,
        tokens_slashed: u64,
        reason: vector<u8>,
        timestamp: u64,
    }

    /// Initialize the attendance token system
    fun init(otw: ATTENDANCE_TOKEN, ctx: &mut TxContext) {
        // Create the attendance token currency
        let (treasury_cap, coin_metadata) = coin::create_currency(
            otw,
            0, // No decimal places - whole tokens only
            b"CLT",
            b"Attendance Token", 
            b"Closed-loop attendance token for university students",
            std::option::none(),
            ctx
        );

        // Create token policy with university rule
        let (mut policy, policy_cap) = token::new_policy(&treasury_cap, ctx);

        // Add university rule for transfers - only university members can participate
        token::add_rule_for_action<ATTENDANCE_TOKEN, university_rule::UniversityRule>(
            &mut policy,
            &policy_cap,
            token::transfer_action(),
            ctx
        );

        // Add university rule for spending
        token::add_rule_for_action<ATTENDANCE_TOKEN, university_rule::UniversityRule>(
            &mut policy,
            &policy_cap,
            token::spend_action(),
            ctx
        );

        // Share the policy so others can read it
        token::share_policy(policy);

        // Transfer capabilities to the deployer (university admin)
        transfer::public_transfer(policy_cap, tx_context::sender(ctx));
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(coin_metadata);
    }

    /// Add university members (students, staff, admin) to the token system
    public fun add_university_members(
        policy: &mut TokenPolicy<ATTENDANCE_TOKEN>,
        policy_cap: &TokenPolicyCap<ATTENDANCE_TOKEN>,
        members: vector<address>,
        roles: vector<university_rule::Role>,
        ctx: &mut TxContext
    ) {
        university_rule::add_university_members(policy, policy_cap, members, roles, ctx);
    }

    /// Remove university member (admin only)
    public fun remove_university_member(
        policy: &mut TokenPolicy<ATTENDANCE_TOKEN>,
        policy_cap: &TokenPolicyCap<ATTENDANCE_TOKEN>,
        member: address,
        ctx: &mut TxContext
    ) {
        university_rule::remove_university_member(policy, policy_cap, member, ctx);
    }

    /// Mint attendance tokens (only for backend contract with treasury cap)
    /// This function should only be called by the attendance system backend
    public fun mint_attendance_tokens(
        treasury_cap: &mut TreasuryCap<ATTENDANCE_TOKEN>,
        amount: u64,
        student: address,
        course_id: vector<u8>,
        ctx: &mut TxContext
    ): Token<ATTENDANCE_TOKEN> {
        assert!(amount > 0, EInvalidAmount);
        
        // Mint the tokens
        let token = token::mint(treasury_cap, amount, ctx);
        
        // Emit attendance recorded event
        iota::event::emit(AttendanceRecorded {
            student,
            tokens_earned: amount,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            course_id,
        });
        
        token
    }

    /// Issue tokens directly to student (used by attendance system)
    public fun issue_attendance_tokens(
        treasury_cap: &mut TreasuryCap<ATTENDANCE_TOKEN>,
        amount: u64,
        student: address,
        course_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        let token = mint_attendance_tokens(treasury_cap, amount, student, course_id, ctx);
        
        // Create transfer request to send to student
        let request = token::transfer(token, student, ctx);
        
        // Confirm with treasury cap (bypasses rules for initial distribution)
        token::confirm_with_treasury_cap(treasury_cap, request, ctx);
    }

    /// Transfer tokens between university members
    public fun transfer_tokens(
        token: Token<ATTENDANCE_TOKEN>,
        recipient: address,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        ctx: &mut TxContext
    ): ActionRequest<ATTENDANCE_TOKEN> {
        // Create transfer request
        let mut request = token::transfer(token, recipient, ctx);
        
        // Verify with university rule (ensures both sender and recipient are university members)
        university_rule::verify(policy, &mut request, ctx);
        
        request
    }

    /// Burn tokens as penalty/slash (admin function via treasury cap)
    public fun slash_tokens(
        treasury_cap: &mut TreasuryCap<ATTENDANCE_TOKEN>,
        token: Token<ATTENDANCE_TOKEN>,
        reason: vector<u8>,
        student: address,
        ctx: &mut TxContext
    ) {
        let amount = token::value(&token);
        
        // Create spend request to burn the tokens
        let request = token::spend(token, ctx);
        
        // Confirm with treasury cap (admin can always burn tokens)
        token::confirm_with_treasury_cap(treasury_cap, request, ctx);
        
        // Emit penalty event
        iota::event::emit(PenaltyApplied {
            student,
            tokens_slashed: amount,
            reason,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Split token for partial transfers/payments
    public fun split_token(
        token: &mut Token<ATTENDANCE_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ): Token<ATTENDANCE_TOKEN> {
        assert!(token::value(token) >= amount, EInsufficientBalance);
        token::split(token, amount, ctx)
    }

    /// Join tokens together
    public fun join_tokens(
        token1: &mut Token<ATTENDANCE_TOKEN>,
        token2: Token<ATTENDANCE_TOKEN>
    ) {
        token::join(token1, token2);
    }

    /// Get token value/balance
    public fun token_value(token: &Token<ATTENDANCE_TOKEN>): u64 {
        token::value(token)
    }

    /// Check if address is a university member
    public fun is_university_member(
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        addr: address
    ): bool {
        university_rule::is_university_member(policy, addr)
    }

    /// Check if address is a student
    public fun is_student(
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        addr: address
    ): bool {
        university_rule::is_student(policy, addr)
    }

    /// Check if address is staff
    public fun is_staff(
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        addr: address
    ): bool {
        university_rule::is_staff(policy, addr)
    }

    /// Check if address is admin
    public fun is_admin(
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        addr: address
    ): bool {
        university_rule::is_admin(policy, addr)
    }

    /// Get university statistics (students, staff counts)
    public fun get_university_stats(
        policy: &TokenPolicy<ATTENDANCE_TOKEN>
    ): (u64, u64) {
        university_rule::get_university_stats(policy)
    }

    /// Create student role helper
    public fun create_student_role(): university_rule::Role {
        university_rule::create_student_role()
    }

    /// Create staff role helper
    public fun create_staff_role(): university_rule::Role {
        university_rule::create_staff_role()
    }

    /// Create admin role helper
    public fun create_admin_role(): university_rule::Role {
        university_rule::create_admin_role()
    }
} 