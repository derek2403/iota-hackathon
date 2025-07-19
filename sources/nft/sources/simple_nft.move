/// Module: devnet_nft
module 0x0::devnet_nft {
    use iota::object::{Self, UID};
    use iota::tx_context::{Self, TxContext};
    use iota::transfer;
    use iota::url::{Self, Url};
    use std::string;
    use iota::event;

    /// An example NFT that can be minted by anybody
    public struct DevNetNFT has key, store {
        id: UID,
        /// Name for the token
        name: string::String,
        /// Description of the token
        description: string::String,
        /// URL for the token
        url: Url,
    }

    // ===== Events =====

    public struct NFTMinted has copy, drop {
        // The Object ID of the NFT
        object_id: address,
        // The creator of the NFT
        creator: address,
        // The name of the NFT
        name: string::String,
    }

    public struct NFTTransferred has copy, drop {
        // The Object ID of the NFT
        object_id: address,
        // The previous owner
        from: address,
        // The new owner
        to: address,
    }

    // ===== Public view functions =====

    /// Get the NFT's `name`
    public fun name(nft: &DevNetNFT): &string::String {
        &nft.name
    }

    /// Get the NFT's `description`
    public fun description(nft: &DevNetNFT): &string::String {
        &nft.description
    }

    /// Get the NFT's `url`
    public fun url(nft: &DevNetNFT): &Url {
        &nft.url
    }

    // ===== Entrypoints =====

    /// Create a new devnet_nft
    public entry fun mint_to_sender(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let nft = DevNetNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url)
        };

        event::emit(NFTMinted {
            object_id: object::uid_to_address(&nft.id),
            creator: sender,
            name: nft.name,
        });

        transfer::public_transfer(nft, sender);
    }

    /// SPONSORED: Create a new devnet_nft without paying gas fees
    /// This function is sponsored by the gas station
    entry fun sponsored_mint_to_sender(
        name: vector<u8>,
        description: vector<u8>,
        url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let nft = DevNetNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            url: url::new_unsafe_from_bytes(url)
        };

        event::emit(NFTMinted {
            object_id: object::uid_to_address(&nft.id),
            creator: sender,
            name: nft.name,
        });

        transfer::public_transfer(nft, sender);
    }

    /// Transfer `nft` to `recipient`
    public entry fun transfer(
        nft: DevNetNFT, 
        recipient: address, 
        _: &mut TxContext
    ) {
        transfer::public_transfer(nft, recipient)
    }

    /// SPONSORED: Transfer `nft` to `recipient` without paying gas fees
    entry fun sponsored_transfer(
        nft: DevNetNFT, 
        recipient: address, 
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let object_id = object::uid_to_address(&nft.id);
        
        // Emit transfer event
        event::emit(NFTTransferred {
            object_id,
            from: sender,
            to: recipient,
        });
        
        transfer::public_transfer(nft, recipient)
    }

    /// Update the `description` of `nft` to `new_description`
    public entry fun update_description(
        nft: &mut DevNetNFT,
        new_description: vector<u8>,
        _: &mut TxContext
    ) {
        nft.description = string::utf8(new_description)
    }

    /// SPONSORED: Update the `description` of `nft` to `new_description` without paying gas fees
    entry fun sponsored_update_description(
        nft: &mut DevNetNFT,
        new_description: vector<u8>,
        _: &TxContext
    ) {
        nft.description = string::utf8(new_description)
    }

    /// Permanently delete `nft`
    public entry fun burn(
        nft: DevNetNFT, 
        _: &mut TxContext
    ) {
        let DevNetNFT { id, name: _, description: _, url: _ } = nft;
        object::delete(id)
    }

    /// SPONSORED: Permanently delete `nft` without paying gas fees
    entry fun sponsored_burn(
        nft: DevNetNFT, 
        _: &TxContext
    ) {
        let DevNetNFT { id, name: _, description: _, url: _ } = nft;
        object::delete(id)
    }
} 