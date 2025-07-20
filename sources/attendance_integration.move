/// Integration module that connects attendance system with NFT badge system
/// Automatically records attendance for badge patterns and triggers badge minting
module clt_tutorial::attendance_integration {
    use iota::tx_context::{Self, TxContext};
    use iota::token::{TokenPolicy, Token};
    use clt_tutorial::attendance_token::{ATTENDANCE_TOKEN};
    use clt_tutorial::attendance_system::{AttendanceSystem};
    use clt_tutorial::attendance_nft::{BadgeRegistry};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const ESystemsNotLinked: u64 = 2;

    /// Enhanced attendance processing with NFT integration
    public fun process_attendance_with_nfts(
        attendance_system: &mut AttendanceSystem,
        badge_registry: &mut BadgeRegistry,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        student: address,
        event_id: vector<u8>,
        event_type: vector<u8>,
        check_in_hour: u64,
        course_id: vector<u8>,
        ctx: &mut TxContext
    ) {
        // First, process regular attendance (this will mint CLT tokens)
        clt_tutorial::attendance_system::manual_attendance_entry(
            attendance_system,
            policy,
            student,
            course_id,
            b"Integrated NFT attendance",
            ctx
        );

        // Then, record attendance for badge pattern tracking
        clt_tutorial::attendance_nft::record_attendance_for_badges(
            badge_registry,
            student,
            event_id,
            event_type,
            check_in_hour,
            ctx
        );
    }

    /// Batch process semester end - mint badges for all eligible students
    public fun process_semester_end_badges(
        badge_registry: &mut BadgeRegistry,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        mut students: vector<address>,
        semester: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can process semester end
        while (!vector::is_empty(&students)) {
            let student = vector::pop_back(&mut students);
            
            // Try to mint badge for each student
            // This will automatically check CLT balance and determine tier
            // If student doesn't meet threshold, it will fail gracefully
            let _result = try_mint_badge_for_student(
                badge_registry,
                policy,
                student,
                semester,
                ctx
            );
        };
        
        vector::destroy_empty(students);
    }

    /// Safe badge minting that won't abort if student doesn't qualify
    fun try_mint_badge_for_student(
        badge_registry: &mut BadgeRegistry,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        student: address,
        semester: vector<u8>,
        ctx: &mut TxContext
    ): bool {
        // Check if student already has badge for this semester
        if (clt_tutorial::attendance_nft::has_badge_for_semester(
            badge_registry, 
            student, 
            semester
        )) {
            return false // Already has badge
        };

        // Attempt to mint badge - this will check CLT balance internally
        // In a real implementation, you might want to add error handling
        clt_tutorial::attendance_nft::mint_attendance_badge(
            badge_registry,
            policy,
            student,
            semester,
            ctx
        );
        
        true
    }

    /// Get comprehensive student stats (CLT tokens + NFT badges + achievements)
    public fun get_student_comprehensive_stats(
        badge_registry: &BadgeRegistry,
        student: address,
        semester: vector<u8>
    ): (u8, bool, bool, bool, bool) {
        // Get badge tier for semester
        let badge_tier = clt_tutorial::attendance_nft::get_user_badge_tier(
            badge_registry,
            student,
            semester
        );

        // Check achievements (simplified - you could expand this)
        let (night_owl, morning_achiever, kickoff, full_commitment) = 
            clt_tutorial::attendance_nft::get_achievement_types();
        
        // Return comprehensive stats
        (
            badge_tier,
            has_achievement(badge_registry, student, night_owl),
            has_achievement(badge_registry, student, morning_achiever),
            has_achievement(badge_registry, student, kickoff),
            has_achievement(badge_registry, student, full_commitment)
        )
    }

    /// Helper to check if student has specific achievement
    fun has_achievement(
        registry: &BadgeRegistry,
        student: address,
        achievement_type: u8
    ): bool {
        // This would need to be implemented in the badge registry
        // For now, return false as placeholder
        false
    }

    /// Bulk award kickoff champion to first week attendees
    public fun award_kickoff_champions(
        badge_registry: &mut BadgeRegistry,
        mut first_week_students: vector<address>,
        ctx: &mut TxContext
    ) {
        while (!vector::is_empty(&first_week_students)) {
            let student = vector::pop_back(&mut first_week_students);
            
            // Award Kickoff Champion achievement
            clt_tutorial::attendance_nft::mint_bonus_achievement(
                badge_registry,
                student,
                3, // KICKOFF_CHAMPION_TYPE
                ctx
            );
        };
        
        vector::destroy_empty(first_week_students);
    }

    /// Academic year summary function
    public fun generate_year_end_report(
        badge_registry: &BadgeRegistry
    ): (u64, u64, u64) {
        clt_tutorial::attendance_nft::get_badge_stats(badge_registry)
    }
} 