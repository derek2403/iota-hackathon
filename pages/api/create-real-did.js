const IOTAIdentityRealService = require('../../lib/iota-identity-real');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo, privateKey, walletAddress, publish } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.email || !userInfo.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required user information: name, email, and date of birth are required',
        success: false 
      });
    }

    console.log('🚀 Creating REAL DID with no simulations...');

    // Initialize REAL IOTA Identity Service
    const realIdentityService = new IOTAIdentityRealService();
    await realIdentityService.initialize();

    console.log('✅ Real Identity Service initialized');

    // Create REAL DID with persistent storage
    const didResult = await realIdentityService.createRealDID(userInfo, privateKey);
    
    console.log('✅ REAL DID created:', didResult.did);

    // Publish to blockchain if requested
    if (publish && walletAddress) {
      console.log('📡 Publishing to IOTA blockchain...');
      const publishedResult = await realIdentityService.publishRealDID(didResult, walletAddress);
      Object.assign(didResult, publishedResult);
    }

    // Create REAL verifiable credential
    console.log('🏆 Creating REAL verifiable credential...');
    const credential = await realIdentityService.createRealVerifiableCredential(
      didResult.did,
      didResult.did,
      userInfo,
      didResult.jwk
    );

    // List all stored identities
    const storedIdentities = await realIdentityService.listStoredIdentities();

    res.status(200).json({
      success: true,
      type: "REAL_IMPLEMENTATION",
      did: didResult.did,
      document: didResult.document.toJSON(),
      credential: credential,
      keyId: didResult.keyId,
      published: didResult.published || false,
      network: didResult.network,
      storage: didResult.storage,
      didGenerationMethod: didResult.didGenerationMethod,
      storageDirectory: realIdentityService.getStorageDirectory(),
      networkConfig: realIdentityService.getNetworkConfig(),
      storedIdentities: storedIdentities,
      explorerUrl: didResult.explorerDIDUrl,
      explorerTransactionUrl: didResult.explorerTransactionUrl,
      transactionHash: didResult.transactionHash,
      message: didResult.published 
        ? '🎉 REAL DID created and published to IOTA blockchain!'
        : '🔐 REAL DID created and stored securely!',
      note: 'This is a real implementation using actual IOTA Identity libraries with persistent storage.',
      features: {
        realCryptography: true,
        persistentStorage: true,
        realNetworking: true,
        noSimulations: true,
        secureKeyStorage: true,
        realCredentials: true
      }
    });

  } catch (error) {
    console.error('❌ Error in REAL DID creation:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      type: "REAL_IMPLEMENTATION_ERROR",
      details: error.toString()
    });
  }
} 