import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

// Gas Station configuration
const GAS_STATION_URL = 'http://localhost:9527';
const GAS_STATION_AUTH = 'my-secret-bearer-token-123';

// YOUR DEPLOYED NFT CONTRACT DETAILS 
const NFT_PACKAGE_ID = '0xe7dc7eeead174f564c4c4774acd22eccc00f9e850c1bcaea3f386a236cb15a0e';

// IOTA network configuration
const IOTA_RPC_URL = 'https://api.testnet.iota.cafe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { 
    userAddress, 
    operation = 'mint', // mint, transfer, update, burn
    nftName = 'Sponsored NFT',
    nftDescription = 'An NFT minted using gas station sponsorship',
    nftUrl = 'https://example.com/nft-image.png',
    nftObjectId = null, // Required for transfer, update, burn
    recipientAddress = null, // Required for transfer
    newDescription = null // Required for update
  } = req.body;

  if (!userAddress) {
    return res.status(400).json({ 
      success: false, 
      error: 'User address is required' 
    });
  }

  // Validate operation-specific requirements
  if (operation === 'transfer' && !recipientAddress) {
    return res.status(400).json({ 
      success: false, 
      error: 'Recipient address is required for transfer operation' 
    });
  }

  if (['transfer', 'update', 'burn'].includes(operation) && !nftObjectId) {
    return res.status(400).json({ 
      success: false, 
      error: `NFT object ID is required for ${operation} operation` 
    });
  }

  if (operation === 'update' && !newDescription) {
    return res.status(400).json({ 
      success: false, 
      error: 'New description is required for update operation' 
    });
  }

  try {
    console.log(`Starting sponsored NFT ${operation}...`);
    console.log('User address:', userAddress);
    
    // Step 1: Reserve gas from the gas station
    console.log('Reserving gas from gas station...');
    const reserveResponse = await fetch(`${GAS_STATION_URL}/v1/reserve_gas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GAS_STATION_AUTH}`
      },
      body: JSON.stringify({
        gas_budget: 1000000000, // 1 IOTA in nanos
        reserve_duration_secs: 10
      })
    });

    if (!reserveResponse.ok) {
      const errorText = await reserveResponse.text();
      throw new Error(`Failed to reserve gas: ${reserveResponse.status} ${reserveResponse.statusText} - ${errorText}`);
    }

    const reserveData = await reserveResponse.json();
    console.log('Gas reservation successful:', reserveData);

    // Check if reservation was successful
    if (!reserveData.result) {
      throw new Error(`Gas reservation failed: ${reserveData.error || 'Unknown error'}`);
    }

    // Step 2: Create IOTA client and build transaction
    const iotaClient = new IotaClient({ url: IOTA_RPC_URL });
    const sponsorAddress = reserveData.result.sponsor_address;
    
    console.log(`Building NFT ${operation} transaction...`);
    console.log('- Sponsor address (gas payer):', sponsorAddress);
    console.log('- User address (transaction sender):', userAddress);

    // Create a test user keypair (in production, this would be the actual user's wallet)
    const userKeypair = Ed25519Keypair.generate();
    const testUserAddress = userKeypair.toIotaAddress();
    
    console.log('- Test user address for transaction:', testUserAddress);

    // Create transaction based on operation type
    const tx = new Transaction();
    let functionName = '';
    
    switch (operation) {
      case 'mint':
        functionName = 'sponsored_mint_to_sender';
        tx.moveCall({
          target: `${NFT_PACKAGE_ID}::devnet_nft::${functionName}`,
          arguments: [
            tx.pure.string(nftName),
            tx.pure.string(nftDescription),
            tx.pure.string(nftUrl)
          ]
        });
        break;
        
      case 'transfer':
        functionName = 'sponsored_transfer';
        tx.moveCall({
          target: `${NFT_PACKAGE_ID}::devnet_nft::${functionName}`,
          arguments: [
            tx.object(nftObjectId),
            tx.pure.address(recipientAddress)
          ]
        });
        break;
        
      case 'update':
        functionName = 'sponsored_update_description';
        tx.moveCall({
          target: `${NFT_PACKAGE_ID}::devnet_nft::${functionName}`,
          arguments: [
            tx.object(nftObjectId),
            tx.pure.string(newDescription)
          ]
        });
        break;
        
      case 'burn':
        functionName = 'sponsored_burn';
        tx.moveCall({
          target: `${NFT_PACKAGE_ID}::devnet_nft::${functionName}`,
          arguments: [
            tx.object(nftObjectId)
          ]
        });
        break;
        
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // Get gas price and set transaction parameters
    const gasPrice = await iotaClient.getReferenceGasPrice();
    const gasCoins = reserveData.result.gas_coins.map(coin => ({
      objectId: coin.objectId,
      version: coin.version,
      digest: coin.digest
    }));

    // Set transaction parameters - CORRECT SPONSORED PATTERN
    tx.setGasPayment(gasCoins);
    tx.setGasBudget(10000000);
    tx.setSender(testUserAddress); // USER is the sender
    tx.setGasOwner(sponsorAddress); // SPONSOR owns the gas coins
    tx.setGasPrice(gasPrice);

    // Build and sign transaction
    const txBytes = await tx.build({ client: iotaClient });
    const signature = await userKeypair.signTransaction(txBytes);

    console.log('Transaction built, sending to gas station for execution...');

    // Execute via gas station
    const executeResponse = await fetch(`${GAS_STATION_URL}/v1/execute_tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GAS_STATION_AUTH}`
      },
      body: JSON.stringify({
        reservation_id: reserveData.result.reservation_id,
        tx_bytes: Buffer.from(txBytes).toString('base64'),
        user_sig: signature.signature
      })
    });

    if (!executeResponse.ok) {
      const errorText = await executeResponse.text();
      throw new Error(`Gas station execution failed: ${executeResponse.status} ${executeResponse.statusText} - ${errorText}`);
    }

    const executeData = await executeResponse.json();
    console.log('Gas station execution response:', executeData);

    if (!executeData.effects) {
      throw new Error(`Transaction execution failed: ${executeData.error || 'Unknown error'}`);
    }

    // Return results
    const result = {
      success: true,
      transactionId: executeData.effects.transactionDigest,
      reservationId: reserveData.result.reservation_id,
      sponsorAccount: reserveData.result.sponsor_address,
      userAccount: testUserAddress,
      userAddress: userAddress,
      operation: operation,
      message: `🎨 NFT ${operation} operation completed! Sponsored by gas station!`,
      gasStationWorking: true,
      timestamp: new Date().toISOString(),
      transactionEffects: {
        status: executeData.effects.status,
        gasUsed: executeData.effects.gasUsed,
        created: executeData.effects.created?.length || 0,
        mutated: executeData.effects.mutated?.length || 0,
        digest: executeData.effects.transactionDigest
      },
      details: {
        packageId: NFT_PACKAGE_ID,
        functionCalled: functionName,
        nftDetails: {
          name: nftName,
          description: operation === 'update' ? newDescription : nftDescription,
          url: nftUrl,
          objectId: nftObjectId,
          recipientAddress
        },
        gasCoinsReserved: reserveData.result.gas_coins?.length || 0,
        actualTransaction: true,
        sponsorPattern: 'user-as-sender-sponsor-pays-gas',
        realBlockchainTransaction: true
      }
    };

    console.log(`🎉 NFT ${operation} executed successfully!`, result);
    res.status(200).json(result);

  } catch (error) {
    console.error(`Error in sponsored NFT ${operation}:`, error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      operation: operation,
      timestamp: new Date().toISOString(),
      details: {
        gasStationUrl: GAS_STATION_URL,
        userAddress,
        packageId: NFT_PACKAGE_ID
      }
    };

    res.status(500).json(errorResponse);
  }
} 