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
        issued_badges: Table<vector<u8>, u8>,
        issued_achievements: Table<vector<u8>, bool>,
        attendance_records: vector<AttendanceRecord>,
        admin: address,
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

    /// Calculate week number from timestamp
    fun calculate_week_number(timestamp: u64): u64 {
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
}