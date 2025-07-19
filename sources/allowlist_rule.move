/// Simple allowlist rule for closed-loop tokens
module clt_tutorial::allowlist_rule {
    use iota::bag::{Self, Bag};
    use iota::token::{Self, TokenPolicy, TokenPolicyCap, ActionRequest};

    // Error codes
    const ENotAuthorized: u64 = 1;
    const ENoConfig: u64 = 2;

    /// Rule witness - identifies this rule type
    public struct AllowlistRule has drop {}

    /// Configuration data stored in the token policy
    public struct Config has store {
        /// Bag storing approved addresses
        approved_addresses: Bag,
    }

    /// Add addresses to the allowlist (only policy owner can do this)
    public fun add_to_allowlist<T>(
        policy: &mut TokenPolicy<T>,
        policy_cap: &TokenPolicyCap<T>,
        mut addresses: vector<address>,
        ctx: &mut iota::tx_context::TxContext
    ) {
        // Initialize config if it doesn't exist
        if (!token::has_rule_config<T, AllowlistRule>(policy)) {
            let config = Config {
                approved_addresses: bag::new(ctx),
            };
            token::add_rule_config(
                AllowlistRule {},
                policy,
                policy_cap,
                config,
                ctx
            );
        };

        // Get mutable reference to config
        let config = token::rule_config_mut<T, AllowlistRule, Config>(
            AllowlistRule {},
            policy,
            policy_cap
        );

        // Add each address to the allowlist
        while (!vector::is_empty(&addresses)) {
            let addr = vector::pop_back(&mut addresses);
            if (!bag::contains(&config.approved_addresses, addr)) {
                bag::add(&mut config.approved_addresses, addr, true);
            };
        };
    }

    /// Verify if a token action is allowed
    public fun verify<T>(
        policy: &TokenPolicy<T>,
        request: &mut ActionRequest<T>,
        ctx: &mut iota::tx_context::TxContext
    ) {
        // Ensure config exists
        assert!(token::has_rule_config<T, AllowlistRule>(policy), ENoConfig);

        let config = token::rule_config<T, AllowlistRule, Config>(AllowlistRule {}, policy);
        let sender = token::sender(request);

        // Check if sender is authorized
        assert!(
            bag::contains(&config.approved_addresses, sender),
            ENotAuthorized
        );

        // If it's a transfer, check if recipient is also authorized
        if (token::action(request) == token::transfer_action()) {
            let recipient_opt = token::recipient(request);
            if (std::option::is_some(&recipient_opt)) {
                let recipient = *std::option::borrow(&recipient_opt);
                assert!(
                    bag::contains(&config.approved_addresses, recipient),
                    ENotAuthorized
                );
            };
        };

        // Approve the action
        token::add_approval(AllowlistRule {}, request, ctx);
    }

    /// Check if an address is on the allowlist
    public fun is_approved<T>(
        policy: &TokenPolicy<T>,
        addr: address
    ): bool {
        if (!token::has_rule_config<T, AllowlistRule>(policy)) {
            return false
        };

        let config = token::rule_config<T, AllowlistRule, Config>(AllowlistRule {}, policy);
        bag::contains(&config.approved_addresses, addr)
    }
} 