/// Module: counter_package
module counter_package::counter;

use iota::event;
use iota::object::{Self, UID};
use iota::transfer;
use iota::tx_context::TxContext;

/// Event emitted when counter is incremented
public struct CounterIncremented has copy, drop {
    user: address,
    new_count: u64,
}
    
/// Shared counter object
public struct Counter has key, store {
    id: UID,
    count: u64,
}

/// Initialize function - creates a shared counter
fun init(ctx: &mut TxContext) {
    let counter = Counter {
        id: object::new(ctx),
        count: 0,
    };
    
    // Share the counter so anyone can increment it
    transfer::public_share_object(counter);
}

/// Sponsored increment function - anyone can call this without paying gas
entry fun sponsored_increment(counter: &mut Counter, ctx: &TxContext) {
    counter.count = counter.count + 1;
    
    // Emit event
    event::emit(CounterIncremented {
        user: ctx.sender(),
        new_count: counter.count,
    });
}

/// Get current count (view function)
public fun get_count(counter: &Counter): u64 {
    counter.count
} 