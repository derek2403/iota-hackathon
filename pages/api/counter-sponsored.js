import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

// Gas Station configuration
const GAS_STATION_URL = 'http://localhost:9527';
const GAS_STATION_AUTH = 'my-secret-bearer-token-123';

// YOUR DEPLOYED CONTRACT DETAILS 
const COUNTER_PACKAGE_ID = '0xe82a0de5f5603140abf3f34d13a832b045d05efd74420a21208c107443542942';
const COUNTER_OBJECT_ID = '0xd4e5f477558bfbea16b5c5748722c5fd2c1530782bdb62ce9f88ddff196ee4a5';

// IOTA network configuration
const IOTA_RPC_URL = 'https://api.testnet.iota.cafe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userAddress } = req.body;

  if (!userAddress) {
    return res.status(400).json({ 
      success: false, 
      error: 'User address is required' 
    });
  }

  try {
    console.log('Starting sponsored counter increment...');
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
    
    console.log('Building counter increment transaction...');
    console.log('- Sponsor address (gas payer):', sponsorAddress);
    console.log('- User address (transaction sender):', userAddress);

    // Create a test user keypair (in production, this would be the actual user's wallet)
    const userKeypair = Ed25519Keypair.generate();
    const testUserAddress = userKeypair.toIotaAddress();
    
    console.log('- Test user address for transaction:', testUserAddress);

    // Create transaction - CALL YOUR COUNTER CONTRACT
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${COUNTER_PACKAGE_ID}::counter::sponsored_increment`,
      arguments: [
        tx.object(COUNTER_OBJECT_ID) // The shared counter object
      ]
    });

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
      message: `🎯 Counter incremented! Sponsored by gas station!`,
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
        packageId: COUNTER_PACKAGE_ID,
        functionCalled: 'sponsored_increment',
        counterObjectId: COUNTER_OBJECT_ID,
        gasCoinsReserved: reserveData.result.gas_coins?.length || 0,
        actualTransaction: true,
        sponsorPattern: 'user-as-sender-sponsor-pays-gas',
        realBlockchainTransaction: true
      }
    };

    console.log('🎉 Counter increment executed successfully!', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Error in sponsored counter transaction:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      details: {
        gasStationUrl: GAS_STATION_URL,
        userAddress
      }
    };

    res.status(500).json(errorResponse);
  }
} 