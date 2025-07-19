/// University Attendance NFT Badge System
/// Automatically assigns tiered badges based on CLT balance and bonus achievement NFTs based on attendance patterns
module clt_tutorial::attendance_nft {
    use iota::object::{Self, UID};
    use iota::tx_context::{Self, TxContext};
    use iota::table::{Self, Table};
    use iota::token::{TokenPolicy, Token};
    use iota::transfer;
    use iota::event;
    use iota::address;
    use clt_tutorial::attendance_token::{Self, ATTENDANCE_TOKEN};
    use clt_tutorial::attendance_system::{AttendanceSystem};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const EInvalidTier: u64 = 2;
    const EBadgeAlreadyAwarded: u64 = 3;
    const EAchievementAlreadyAwarded: u64 = 4;
    const EInsufficientCLT: u64 = 5;
    const EInvalidAttendancePattern: u64 = 6;

    // Badge tier constants
    const BRONZE_THRESHOLD: u64 = 50;
    const SILVER_THRESHOLD: u64 = 100;
    const GOLD_THRESHOLD: u64 = 150;

    // Achievement type constants
    const NIGHT_OWL_TYPE: u8 = 1;
    const MORNING_ACHIEVER_TYPE: u8 = 2;
    const KICKOFF_CHAMPION_TYPE: u8 = 3;
    const FULL_COMMITMENT_TYPE: u8 = 4;

    /// Badge tiers
    public struct BadgeTier has store, copy, drop {
        tier: u8, // 1=Bronze, 2=Silver, 3=Gold
        name: vector<u8>,
        min_clt: u64,
    }

    /// Tiered Attendance Badge NFT (non-transferrable)
    public struct AttendanceBadge has key {
        id: UID,
        user_did: address,
        semester: vector<u8>,
        tier: BadgeTier,
        final_clt: u64,
        date_awarded: u64,
        issuer: address,
    }

    /// Bonus Achievement NFT (non-transferrable)
    public struct BonusAchievement has key {
        id: UID,
        user_did: address,
        achievement_type: u8,
        achievement_name: vector<u8>,
        description: vector<u8>,
        date_awarded: u64,
        qualifying_events: u64,
        issuer: address,
    }

    /// Attendance record for tracking patterns
    public struct AttendanceRecord has store, copy, drop {
        user_did: address,
        event_id: vector<u8>,
        event_type: vector<u8>,
        check_in_time: u64, // Hour of day (0-23)
        timestamp: u64,
        week_number: u64,
    }

    /// NFT Badge Registry (tracks issued badges and achievements)
    public struct BadgeRegistry has key {
        id: UID,
        /// Tracks issued badges by semester and user: (user_address, semester) -> badge_tier
        issued_badges: Table<vector<u8>, u8>,
        /// Tracks issued achievements by user: (user_address, achievement_type) -> true
        issued_achievements: Table<vector<u8>, bool>,
        /// Attendance records for pattern analysis
        attendance_records: vector<AttendanceRecord>,
        /// System admin
        admin: address,
        /// Statistics
        total_badges_issued: u64,
        total_achievements_issued: u64,
    }

    /// Badge awarded event
    public struct BadgeAwarded has copy, drop {
        user_did: address,
        badge_tier: u8,
        semester: vector<u8>,
        final_clt: u64,
        timestamp: u64,
    }

    /// Achievement awarded event
    public struct AchievementAwarded has copy, drop {
        user_did: address,
        achievement_type: u8,
        achievement_name: vector<u8>,
        qualifying_events: u64,
        timestamp: u64,
    }

    /// Initialize the badge system
    fun init(ctx: &mut TxContext) {
        let registry = BadgeRegistry {
            id: object::new(ctx),
            issued_badges: table::new(ctx),
            issued_achievements: table::new(ctx),
            attendance_records: vector::empty(),
            admin: tx_context::sender(ctx),
            total_badges_issued: 0,
            total_achievements_issued: 0,
        };

        transfer::share_object(registry);
    }

    /// Setup badge system with admin (called after deployment)
    public fun setup_badge_system(admin: address, ctx: &mut TxContext) {
        let registry = BadgeRegistry {
            id: object::new(ctx),
            issued_badges: table::new(ctx),
            issued_achievements: table::new(ctx),
            attendance_records: vector::empty(),
            admin,
            total_badges_issued: 0,
            total_achievements_issued: 0,
        };

        transfer::share_object(registry);
    }

    /// Record attendance for pattern tracking (called by attendance system)
    public fun record_attendance_for_badges(
        registry: &mut BadgeRegistry,
        user_did: address,
        event_id: vector<u8>,
        event_type: vector<u8>,
        check_in_time: u64, // Hour of day (0-23)
        ctx: &mut TxContext
    ) {
        // Only admin or attendance system can record attendance
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        let timestamp = tx_context::epoch_timestamp_ms(ctx);
        let week_number = calculate_week_number(timestamp);

        let record = AttendanceRecord {
            user_did,
            event_id,
            event_type,
            check_in_time,
            timestamp,
            week_number,
        };

        vector::push_back(&mut registry.attendance_records, record);

        // Auto-check for bonus achievements after recording attendance
        check_and_mint_bonus_achievements(registry, user_did, ctx);
    }

    /// Auto-mint attendance badge based on CLT balance
    public fun mint_attendance_badge(
        registry: &mut BadgeRegistry,
        policy: &TokenPolicy<ATTENDANCE_TOKEN>,
        user_did: address,
        semester: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can mint badges
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        // Calculate total CLT balance for user
        let total_clt = calculate_user_clt_balance(user_did, ctx);
        
        // Determine badge tier
        let tier = determine_badge_tier(total_clt);
        assert!(tier > 0, EInsufficientCLT);

        // Check for duplicate badge assignment
        let badge_key = create_badge_key(user_did, semester);
        assert!(!table::contains(&registry.issued_badges, badge_key), EBadgeAlreadyAwarded);

        // Create badge tier info
        let tier_info = create_tier_info(tier);

        // Mint the badge NFT
        let badge = AttendanceBadge {
            id: object::new(ctx),
            user_did,
            semester,
            tier: tier_info,
            final_clt: total_clt,
            date_awarded: tx_context::epoch_timestamp_ms(ctx),
            issuer: tx_context::sender(ctx),
        };

        // Record the badge issuance
        table::add(&mut registry.issued_badges, badge_key, tier);
        registry.total_badges_issued = registry.total_badges_issued + 1;

        // Emit event
        event::emit(BadgeAwarded {
            user_did,
            badge_tier: tier,
            semester,
            final_clt: total_clt,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // Transfer badge to user (non-transferrable)
        transfer::transfer(badge, user_did);
    }

    /// Check and mint bonus achievements based on attendance patterns
    fun check_and_mint_bonus_achievements(
        registry: &mut BadgeRegistry,
        user_did: address,
        ctx: &mut TxContext
    ) {
        // Check Night Owl achievement (3+ events after 7pm)
        if (!has_achievement(registry, user_did, NIGHT_OWL_TYPE)) {
            let night_events = count_night_events(registry, user_did);
            if (night_events >= 3) {
                mint_bonus_achievement_internal(
                    registry,
                    user_did,
                    NIGHT_OWL_TYPE,
                    b"Night Owl",
                    b"Attended 3+ events after 7pm",
                    night_events,
                    ctx
                );
            };
        };

        // Check Morning Achiever achievement (5+ events before 8am)
        if (!has_achievement(registry, user_did, MORNING_ACHIEVER_TYPE)) {
            let morning_events = count_morning_events(registry, user_did);
            if (morning_events >= 5) {
                mint_bonus_achievement_internal(
                    registry,
                    user_did,
                    MORNING_ACHIEVER_TYPE,
                    b"Morning Achiever",
                    b"Attended 5+ events before 8am",
                    morning_events,
                    ctx
                );
            };
        };

        // Check Full Commitment achievement (1+ event per week for whole semester)
        if (!has_achievement(registry, user_did, FULL_COMMITMENT_TYPE)) {
            let weeks_attended = count_weeks_with_attendance(registry, user_did);
            // Assuming 16-week semester
            if (weeks_attended >= 16) {
                mint_bonus_achievement_internal(
                    registry,
                    user_did,
                    FULL_COMMITMENT_TYPE,
                    b"Full Commitment",
                    b"Attended at least 1 event per week for whole semester",
                    weeks_attended,
                    ctx
                );
            };
        };
    }

    /// Manual bonus achievement minting (admin function)
    public fun mint_bonus_achievement(
        registry: &mut BadgeRegistry,
        user_did: address,
        achievement_type: u8,
        ctx: &mut TxContext
    ) {
        // Only admin can manually mint achievements
        assert!(tx_context::sender(ctx) == registry.admin, ENotAuthorized);

        // Check for duplicate achievement
        assert!(!has_achievement(registry, user_did, achievement_type), EAchievementAlreadyAwarded);

        if (achievement_type == KICKOFF_CHAMPION_TYPE) {
            mint_bonus_achievement_internal(
                registry,
                user_did,
                achievement_type,
                b"Kickoff Champion",
                b"Attended the first event of the semester",
                1,
                ctx
            );
        } else {
            abort EInvalidAttendancePattern
        };
    }

    /// Internal bonus achievement minting
    fun mint_bonus_achievement_internal(
        registry: &mut BadgeRegistry,
        user_did: address,
        achievement_type: u8,
        achievement_name: vector<u8>,
        description: vector<u8>,
        qualifying_events: u64,
        ctx: &mut TxContext
    ) {
        // Create achievement NFT
        let achievement = BonusAchievement {
            id: object::new(ctx),
            user_did,
            achievement_type,
            achievement_name,
            description,
            date_awarded: tx_context::epoch_timestamp_ms(ctx),
            qualifying_events,
            issuer: registry.admin,
        };

        // Record the achievement issuance
        let achievement_key = create_achievement_key(user_did, achievement_type);
        table::add(&mut registry.issued_achievements, achievement_key, true);
        registry.total_achievements_issued = registry.total_achievements_issued + 1;

        // Emit event
        event::emit(AchievementAwarded {
            user_did,
            achievement_type,
            achievement_name,
            qualifying_events,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        // Transfer achievement to user (non-transferrable)
        transfer::transfer(achievement, user_did);
    }

    // === Helper Functions ===

    /// Determine badge tier based on CLT balance
    fun determine_badge_tier(clt_balance: u64): u8 {
        if (clt_balance >= GOLD_THRESHOLD) {
            3 // Gold
        } else if (clt_balance >= SILVER_THRESHOLD) {
            2 // Silver  
        } else if (clt_balance >= BRONZE_THRESHOLD) {
            1 // Bronze
        } else {
            0 // No badge
        }
    }

    /// Create tier information
    fun create_tier_info(tier: u8): BadgeTier {
        if (tier == 3) {
            BadgeTier { tier: 3, name: b"Gold Badge", min_clt: GOLD_THRESHOLD }
        } else if (tier == 2) {
            BadgeTier { tier: 2, name: b"Silver Badge", min_clt: SILVER_THRESHOLD }
        } else if (tier == 1) {
            BadgeTier { tier: 1, name: b"Bronze Badge", min_clt: BRONZE_THRESHOLD }
        } else {
            abort EInvalidTier
        }
    }

    /// Calculate user's total CLT balance (simplified - in real implementation, query user's tokens)
    fun calculate_user_clt_balance(_user_did: address, _ctx: &TxContext): u64 {
        // In a real implementation, this would query the user's CLT token balance
        // For this demo, we'll return a mock value or implement actual balance checking
        // This would involve querying the user's owned Token<ATTENDANCE_TOKEN> objects
        150 // Mock value - replace with actual balance calculation
    }

    /// Count night events (after 7pm)
    fun count_night_events(registry: &BadgeRegistry, user_did: address): u64 {
        let mut count = 0;
        let mut i = 0;
        let records_len = vector::length(&registry.attendance_records);
        
        while (i < records_len) {
            let record = vector::borrow(&registry.attendance_records, i);
            if (record.user_did == user_did && record.check_in_time >= 19) { // 7pm = 19:00
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }

    /// Count morning events (before 8am)
    fun count_morning_events(registry: &BadgeRegistry, user_did: address): u64 {
        let mut count = 0;
        let mut i = 0;
        let records_len = vector::length(&registry.attendance_records);
        
        while (i < records_len) {
            let record = vector::borrow(&registry.attendance_records, i);
            if (record.user_did == user_did && record.check_in_time < 8) { // Before 8am
                count = count + 1;
            };
            i = i + 1;
        };
        
        count
    }

    /// Count weeks with at least one attendance
    fun count_weeks_with_attendance(registry: &BadgeRegistry, user_did: address): u64 {
        let mut weeks_set = vector::empty<u64>();
        let mut i = 0;
        let records_len = vector::length(&registry.attendance_records);
        
        while (i < records_len) {
            let record = vector::borrow(&registry.attendance_records, i);
            if (record.user_did == user_did) {
                if (!vector::contains(&weeks_set, &record.week_number)) {
                    vector::push_back(&mut weeks_set, record.week_number);
                };
            };
            i = i + 1;
        };
        
        vector::length(&weeks_set)
    }

    /// Calculate week number from timestamp
    fun calculate_week_number(timestamp: u64): u64 {
        // Simple week calculation (timestamp in ms to weeks)
        timestamp / (7 * 24 * 60 * 60 * 1000)
    }

    /// Create badge key for deduplication
    fun create_badge_key(user_did: address, semester: vector<u8>): vector<u8> {
        let mut key = address::to_bytes(user_did);
        vector::append(&mut key, semester);
        key
    }

    /// Create achievement key for deduplication
    fun create_achievement_key(user_did: address, achievement_type: u8): vector<u8> {
        let mut key = address::to_bytes(user_did);
        vector::push_back(&mut key, achievement_type);
        key
    }

    /// Check if user has specific achievement
    fun has_achievement(registry: &BadgeRegistry, user_did: address, achievement_type: u8): bool {
        let key = create_achievement_key(user_did, achievement_type);
        table::contains(&registry.issued_achievements, key)
    }

    // === View Functions ===

    /// Get badge registry statistics
    public fun get_badge_stats(registry: &BadgeRegistry): (u64, u64, u64) {
        (
            registry.total_badges_issued,
            registry.total_achievements_issued,
            vector::length(&registry.attendance_records)
        )
    }

    /// Check if user has badge for semester
    public fun has_badge_for_semester(
        registry: &BadgeRegistry,
        user_did: address,
        semester: vector<u8>
    ): bool {
        let key = create_badge_key(user_did, semester);
        table::contains(&registry.issued_badges, key)
    }

    /// Get user's badge tier for semester
    public fun get_user_badge_tier(
        registry: &BadgeRegistry,
        user_did: address,
        semester: vector<u8>
    ): u8 {
        let key = create_badge_key(user_did, semester);
        if (table::contains(&registry.issued_badges, key)) {
            *table::borrow(&registry.issued_badges, key)
        } else {
            0
        }
    }

    /// Get badge tier thresholds
    public fun get_tier_thresholds(): (u64, u64, u64) {
        (BRONZE_THRESHOLD, SILVER_THRESHOLD, GOLD_THRESHOLD)
    }

    /// Get achievement types
    public fun get_achievement_types(): (u8, u8, u8, u8) {
        (NIGHT_OWL_TYPE, MORNING_ACHIEVER_TYPE, KICKOFF_CHAMPION_TYPE, FULL_COMMITMENT_TYPE)
    }
} 