/// University access control rule for closed-loop attendance tokens
/// Only approved university wallets (students, staff, admin) can participate
module clt_tutorial::university_rule {
    use iota::bag::{Self, Bag};
    use iota::token::{Self, TokenPolicy, TokenPolicyCap, ActionRequest};

    // Error codes
    const ENotUniversityMember: u64 = 1;
    const ENoConfig: u64 = 2;
    const EInsufficientPermissions: u64 = 3;

    /// Rule witness - identifies this rule type
    public struct UniversityRule has drop {}

    /// University member roles
    public struct Role has store, copy, drop {
        is_student: bool,
        is_staff: bool, 
        is_admin: bool,
    }

    /// Configuration data stored in the token policy
    public struct Config has store {
        /// Bag storing approved university members and their roles
        university_members: Bag,
        /// Total students enrolled
        total_students: u64,
        /// Total staff members
        total_staff: u64,
    }

    /// Create a student role
    public fun create_student_role(): Role {
        Role { is_student: true, is_staff: false, is_admin: false }
    }

    /// Create a staff role
    public fun create_staff_role(): Role {
        Role { is_student: false, is_staff: true, is_admin: false }
    }

    /// Create an admin role
    public fun create_admin_role(): Role {
        Role { is_student: false, is_staff: false, is_admin: true }
    }

    /// Add university members to the system (only policy owner can do this)
    public fun add_university_members<T>(
        policy: &mut TokenPolicy<T>,
        policy_cap: &TokenPolicyCap<T>,
        mut members: vector<address>,
        mut roles: vector<Role>,
        ctx: &mut iota::tx_context::TxContext
    ) {
        // Ensure equal number of members and roles
        assert!(vector::length(&members) == vector::length(&roles), EInsufficientPermissions);

        // Initialize config if it doesn't exist
        if (!token::has_rule_config<T, UniversityRule>(policy)) {
            let config = Config {
                university_members: bag::new(ctx),
                total_students: 0,
                total_staff: 0,
            };
            token::add_rule_config(
                UniversityRule {},
                policy,
                policy_cap,
                config,
                ctx
            );
        };

        // Get mutable reference to config
        let config = token::rule_config_mut<T, UniversityRule, Config>(
            UniversityRule {},
            policy,
            policy_cap
        );

        // Add each member with their role
        while (!vector::is_empty(&members)) {
            let addr = vector::pop_back(&mut members);
            let role = vector::pop_back(&mut roles);
            
            if (!bag::contains(&config.university_members, addr)) {
                bag::add(&mut config.university_members, addr, role);
                
                // Update counters
                if (role.is_student) {
                    config.total_students = config.total_students + 1;
                } else if (role.is_staff) {
                    config.total_staff = config.total_staff + 1;
                };
            };
        };
    }

    /// Remove a university member (admin only via policy cap)
    public fun remove_university_member<T>(
        policy: &mut TokenPolicy<T>,
        policy_cap: &TokenPolicyCap<T>,
        member: address,
        _ctx: &mut iota::tx_context::TxContext
    ) {
        assert!(token::has_rule_config<T, UniversityRule>(policy), ENoConfig);

        let config = token::rule_config_mut<T, UniversityRule, Config>(
            UniversityRule {},
            policy,
            policy_cap
        );

        if (bag::contains(&config.university_members, member)) {
            let role: Role = bag::remove(&mut config.university_members, member);
            
            // Update counters
            if (role.is_student) {
                config.total_students = config.total_students - 1;
            } else if (role.is_staff) {
                config.total_staff = config.total_staff - 1;
            };
        };
    }

    /// Verify if a token action is allowed within university
    public fun verify<T>(
        policy: &TokenPolicy<T>,
        request: &mut ActionRequest<T>,
        ctx: &mut iota::tx_context::TxContext
    ) {
        // Ensure config exists
        assert!(token::has_rule_config<T, UniversityRule>(policy), ENoConfig);

        let config = token::rule_config<T, UniversityRule, Config>(UniversityRule {}, policy);
        let sender = token::sender(request);

        // Check if sender is a university member
        assert!(
            bag::contains(&config.university_members, sender),
            ENotUniversityMember
        );

        // If it's a transfer, check if recipient is also a university member
        if (token::action(request) == token::transfer_action()) {
            let recipient_opt = token::recipient(request);
            if (std::option::is_some(&recipient_opt)) {
                let recipient = *std::option::borrow(&recipient_opt);
                assert!(
                    bag::contains(&config.university_members, recipient),
                    ENotUniversityMember
                );
            };
        };

        // Approve the action
        token::add_approval(UniversityRule {}, request, ctx);
    }

    /// Check if an address is a university member
    public fun is_university_member<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): bool {
        if (!token::has_rule_config<T, UniversityRule>(policy)) {
            return false
        };

        let config = token::rule_config<T, UniversityRule, Config>(UniversityRule {}, policy);
        bag::contains(&config.university_members, addr)
    }

    /// Get member role (returns option)
    public fun get_member_role<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): std::option::Option<Role> {
        if (!token::has_rule_config<T, UniversityRule>(policy)) {
            return std::option::none()
        };

        let config = token::rule_config<T, UniversityRule, Config>(UniversityRule {}, policy);
        if (bag::contains(&config.university_members, addr)) {
            let role = bag::borrow(&config.university_members, addr);
            std::option::some(*role)
        } else {
            std::option::none()
        }
    }

    /// Check if member is a student
    public fun is_student<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): bool {
        let role_opt = get_member_role(policy, addr);
        if (std::option::is_some(&role_opt)) {
            let role = std::option::borrow(&role_opt);
            role.is_student
        } else {
            false
        }
    }

    /// Check if member is staff
    public fun is_staff<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): bool {
        let role_opt = get_member_role(policy, addr);
        if (std::option::is_some(&role_opt)) {
            let role = std::option::borrow(&role_opt);
            role.is_staff
        } else {
            false
        }
    }

    /// Check if member is admin
    public fun is_admin<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): bool {
        let role_opt = get_member_role(policy, addr);
        if (std::option::is_some(&role_opt)) {
            let role = std::option::borrow(&role_opt);
            role.is_admin
        } else {
            false
        }
    }

    /// Get university statistics
    public fun get_university_stats<T>(
        policy: &TokenPolicy<T>
    ): (u64, u64) {
        if (!token::has_rule_config<T, UniversityRule>(policy)) {
            return (0, 0)
        };

        let config = token::rule_config<T, UniversityRule, Config>(UniversityRule {}, policy);
        (config.total_students, config.total_staff)
    }
} 