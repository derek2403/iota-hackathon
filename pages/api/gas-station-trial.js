import { IotaClient } from '@iota/iota-sdk/client';
import { Transaction } from '@iota/iota-sdk/transactions';
import { Ed25519Keypair } from '@iota/iota-sdk/keypairs/ed25519';

// Gas Station configuration
const GAS_STATION_URL = 'http://localhost:9527';
const GAS_STATION_AUTH = 'my-secret-bearer-token-123';

// Smart contract details from your deployment
const PACKAGE_ID = '0x3ee3eba9d1c998d0865ccef4b804de81f625fd849ef56facb81c83b01a4f7e79';
const SUBSCRIPTION_MANAGER_ID = '0x93787c06852cf95dba1ade7fe0d29183bf457109956428de5535b6e9045e1bc5';

// IOTA network configuration
const IOTA_RPC_URL = 'https://api.testnet.iota.cafe';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { subscriptionType = 'Music', userAddress } = req.body;

  if (!userAddress) {
    return res.status(400).json({ 
      success: false, 
      error: 'User address is required' 
    });
  }

  try {
    console.log('Starting gas station sponsored transaction...');
    console.log('Input:', { subscriptionType, userAddress });
    
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

    // Debug: Check what sponsor address we got
    console.log('Gas Station returned sponsor:', reserveData.result.sponsor_address);
    console.log('Gas coins:', reserveData.result.gas_coins.length);
    console.log('Reservation ID:', reserveData.result.reservation_id);

    // Step 2: Create IOTA client and build real transaction
    const iotaClient = new IotaClient({ url: IOTA_RPC_URL });
    
    // Step 3: Build transaction with CORRECT sponsored pattern
    const sponsorAddress = reserveData.result.sponsor_address;
    
    console.log('Building REAL transaction...');
    console.log('- Sponsor address (gas payer):', sponsorAddress);
    console.log('- User address (transaction sender):', userAddress);
    console.log('- Gas coins available:', reserveData.result.gas_coins.length);

    // Create a test user keypair (in production, this would be the actual user's wallet)
    const userKeypair = Ed25519Keypair.generate();
    const testUserAddress = userKeypair.toIotaAddress();
    
    console.log('- Test user address for transaction:', testUserAddress);

    // Create transaction with USER as sender (correct sponsored pattern)
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::sponsored_transactions::free_trial`,
      arguments: [
        tx.pure.string(subscriptionType),
        tx.object(SUBSCRIPTION_MANAGER_ID)
      ]
    });

    // Get gas price
    const gasPrice = await iotaClient.getReferenceGasPrice();

    // Convert gas coins format
    const gasCoins = reserveData.result.gas_coins.map(coin => ({
      objectId: coin.objectId,
      version: coin.version,
      digest: coin.digest
    }));

    // Set transaction parameters - CORRECT PATTERN: User as sender, sponsor pays gas
    tx.setGasPayment(gasCoins);
    tx.setGasBudget(10000000);
    tx.setSender(testUserAddress); // USER is the sender
    tx.setGasOwner(sponsorAddress); // SPONSOR owns the gas coins
    tx.setGasPrice(gasPrice);

    // Build transaction
    const txBytes = await tx.build({ client: iotaClient });

    // User signs their own transaction
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

    // Return REAL transaction results
    const realResult = {
      success: true,
      transactionId: executeData.effects.transactionDigest,
      reservationId: reserveData.result.reservation_id,
      sponsorAccount: reserveData.result.sponsor_address,
      userAccount: testUserAddress,
      subscriptionType,
      userAddress: userAddress,
      message: `🚀 REAL TRANSACTION EXECUTED! Free ${subscriptionType} trial activated via gas station!`,
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
        packageId: PACKAGE_ID,
        functionCalled: 'free_trial',
        subscriptionManager: SUBSCRIPTION_MANAGER_ID,
        gasCoinsReserved: reserveData.result.gas_coins?.length || 0,
        actualTransaction: true,
        sponsorPattern: 'user-as-sender-sponsor-pays-gas',
        realBlockchainTransaction: true
      }
    };

    console.log('🎉 REAL gas station transaction executed successfully!', realResult);

    res.status(200).json(realResult);

  } catch (error) {
    console.error('Error in gas station transaction:', error);
    
    // Provide more detailed error information
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      details: {
        gasStationUrl: GAS_STATION_URL,
        subscriptionType,
        userAddress
      }
    };

    // Check if it's a gas station connection error
    if (error.message.includes('Failed to reserve gas')) {
      errorResponse.suggestion = 'Make sure the gas station server is running on localhost:9527';
    }

    res.status(500).json(errorResponse);
  }
} 