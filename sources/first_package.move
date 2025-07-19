
/// Module: first_package
module first_package::first_package {

    public struct Sword has key, store {
        id: UID,
        magic: u64,
        strength: u64,
    }

    public struct Forge has key {
        id: UID,
        swords_created: u64,
    }

    /// Module initializer to be executed when this module is published
    fun init(ctx: &mut TxContext) {
        let admin = Forge {
            id: object::new(ctx),
            swords_created: 0,
        };

        // transfer the forge object to the module/package publisher
        transfer::transfer(admin, tx_context::sender(ctx));
    }

    // === Accessors ===

    public fun magic(self: &Sword): u64 {
        self.magic
    }

    public fun strength(self: &Sword): u64 {
        self.strength
    }

    #[test]
    public fun test_sword() {
        // Create a dummy TxContext for testing.
        let mut ctx = tx_context::dummy();

        // Create a sword.
        let sword = Sword {
            id: object::new(&mut ctx),
            magic: 42,
            strength: 7,
        };

        // Check if accessor functions return correct values.
        assert!(magic(&sword) == 42 && strength(&sword) == 7, 1);
        
        // Transfer the sword to the sender to consume it properly
        transfer::public_transfer(sword, tx_context::sender(&ctx));
    }

    public fun swords_created(self: &Forge): u64 {
        self.swords_created
    }
}


// For Move coding conventions, see
// https://docs.iota.org/developer/iota-101/move-overview/conventions


