/// A closed-loop community token system
module clt_tutorial::community_token {
    use iota::coin::{Self, TreasuryCap};
    use iota::token::{Self, TokenPolicy, TokenPolicyCap, Token, ActionRequest};
    use iota::tx_context::{Self, TxContext};
    use clt_tutorial::allowlist_rule;

    /// The Community Token - One Time Witness
    public struct COMMUNITY_TOKEN has drop {}

    /// Initialize the community token system
    fun init(otw: COMMUNITY_TOKEN, ctx: &mut TxContext) {
        // Create the token currency
        let (treasury_cap, coin_metadata) = coin::create_currency(
            otw,
            2, // 2 decimal places (like cents)
            b"COMM",
            b"Community Token",
            b"A closed-loop community token for local economy",
            std::option::none(),
            ctx
        );

        // Create token policy with allowlist rule
        let (mut policy, policy_cap) = token::new_policy(&treasury_cap, ctx);

        // Add allowlist rule for transfers
        token::add_rule_for_action<COMMUNITY_TOKEN, allowlist_rule::AllowlistRule>(
            &mut policy,
            &policy_cap,
            token::transfer_action(),
            ctx
        );

        // Add allowlist rule for spending
        token::add_rule_for_action<COMMUNITY_TOKEN, allowlist_rule::AllowlistRule>(
            &mut policy,
            &policy_cap,
            token::spend_action(),
            ctx
        );

        // Share the policy so others can read it
        token::share_policy(policy);

        // Transfer capabilities to the deployer (community manager)
        transfer::public_transfer(policy_cap, tx_context::sender(ctx));
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_freeze_object(coin_metadata);
    }

    /// Community manager adds members to the allowlist
    public fun add_community_members(
        policy: &mut TokenPolicy<COMMUNITY_TOKEN>,
        policy_cap: &TokenPolicyCap<COMMUNITY_TOKEN>,
        members: vector<address>,
        ctx: &mut TxContext
    ) {
        allowlist_rule::add_to_allowlist(policy, policy_cap, members, ctx);
    }

    /// Issue tokens to community members (mint and send)
    public fun issue_tokens(
        treasury_cap: &mut TreasuryCap<COMMUNITY_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        // Mint the tokens
        let token = token::mint(treasury_cap, amount, ctx);
        
        // Create transfer request
        let request = token::transfer(token, recipient, ctx);
        
        // Confirm with treasury cap (bypasses rules for initial distribution)
        token::confirm_with_treasury_cap(treasury_cap, request, ctx);
    }

    /// Transfer tokens between community members
    public fun transfer_tokens(
        token: Token<COMMUNITY_TOKEN>,
        recipient: address,
        policy: &TokenPolicy<COMMUNITY_TOKEN>,
        ctx: &mut TxContext
    ): ActionRequest<COMMUNITY_TOKEN> {
        // Create transfer request
        let mut request = token::transfer(token, recipient, ctx);
        
        // Verify with allowlist rule
        allowlist_rule::verify(policy, &mut request, ctx);
        
        request
    }

    /// Spend tokens (return to treasury)
    public fun spend_tokens(
        token: Token<COMMUNITY_TOKEN>,
        policy: &TokenPolicy<COMMUNITY_TOKEN>,
        ctx: &mut TxContext
    ): ActionRequest<COMMUNITY_TOKEN> {
        // Create spend request
        let mut request = token::spend(token, ctx);
        
        // Verify with allowlist rule
        allowlist_rule::verify(policy, &mut request, ctx);
        
        request
    }

    /// Check if an address is a community member
    public fun is_community_member(
        policy: &TokenPolicy<COMMUNITY_TOKEN>,
        addr: address
    ): bool {
        allowlist_rule::is_approved(policy, addr)
    }

    /// Get token amount from a token object
    public fun token_value(token: &Token<COMMUNITY_TOKEN>): u64 {
        token::value(token)
    }

    // === Test Functions ===

    #[test_only]
    use iota::test_scenario;

    #[test]
    fun test_community_token_flow() {
        let admin = @0xAD;
        let alice = @0xA11CE;
        let bob = @0xB0B;
        let _charlie = @0xCC; // Not in community

        let mut scenario = test_scenario::begin(admin);
        
        // Initialize the token system
        {
            let ctx = test_scenario::ctx(&mut scenario);
            init(COMMUNITY_TOKEN {}, ctx);
        };

        // Admin adds Alice and Bob to community
        test_scenario::next_tx(&mut scenario, admin);
        {
            let mut policy = test_scenario::take_shared<TokenPolicy<COMMUNITY_TOKEN>>(&scenario);
            let policy_cap = test_scenario::take_from_sender<TokenPolicyCap<COMMUNITY_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            let members = vector[alice, bob];
            add_community_members(&mut policy, &policy_cap, members, ctx);

            test_scenario::return_shared(policy);
            test_scenario::return_to_sender(&scenario, policy_cap);
        };

        // Admin issues tokens to Alice
        test_scenario::next_tx(&mut scenario, admin);
        {
            let mut treasury_cap = test_scenario::take_from_sender<TreasuryCap<COMMUNITY_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            issue_tokens(&mut treasury_cap, 100, alice, ctx);

            test_scenario::return_to_sender(&scenario, treasury_cap);
        };

        // Alice transfers to Bob (should work - both in community)
        test_scenario::next_tx(&mut scenario, alice);
        {
            let mut token = test_scenario::take_from_sender<Token<COMMUNITY_TOKEN>>(&scenario);
            let policy = test_scenario::take_shared<TokenPolicy<COMMUNITY_TOKEN>>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);

            // Split token to send part to Bob
            let send_token = token::split(&mut token, 30, ctx);
            
            let request = transfer_tokens(send_token, bob, &policy, ctx);
            token::confirm_request(&policy, request, ctx);

            test_scenario::return_shared(policy);
            test_scenario::return_to_sender(&scenario, token); // Keep remaining token
        };

        test_scenario::end(scenario);
    }
} 