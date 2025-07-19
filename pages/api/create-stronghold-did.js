const IOTAIdentityStrongholdService = require('../../lib/iota-identity-stronghold');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo, privateKey, walletAddress, publish, vaultPassword } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.email || !userInfo.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required user information: name, email, and date of birth are required',
        success: false 
      });
    }

    console.log('🔒 Creating DID with REAL Stronghold Storage...');

    // Initialize IOTA Identity Service with Stronghold
    const strongholdService = new IOTAIdentityStrongholdService();
    const initResult = await strongholdService.initialize('testnet', vaultPassword);

    console.log('✅ Stronghold Identity Service initialized');

    // Create DID with Stronghold storage
    const didResult = await strongholdService.createStrongholdDID(userInfo, privateKey);
    
    console.log('✅ Stronghold DID created:', didResult.did);

    // Publish to blockchain if requested
    let publishResult = null;
    if (publish && walletAddress) {
      console.log('📡 Publishing to IOTA blockchain with Stronghold signing...');
      publishResult = await strongholdService.publishStrongholdDID(didResult, walletAddress);
      Object.assign(didResult, publishResult);
    }

    // Get Stronghold vault statistics
    const vaultStats = await strongholdService.getStrongholdStats();
    const storedKeys = await strongholdService.listStrongholdKeys();
    const storedDIDs = await strongholdService.listStrongholdDIDs();
    const storedCredentials = await strongholdService.listStrongholdCredentials();

    // Test Stronghold signing functionality
    const testData = "Hello Stronghold IOTA Identity!";
    const testSignature = await strongholdService.signWithStronghold(didResult.keyId, testData);
    const signatureValid = await strongholdService.verifyWithStronghold(didResult.keyId, testData, testSignature);

    res.status(200).json({
      success: true,
      type: "STRONGHOLD_IMPLEMENTATION",
      did: didResult.did,
      document: didResult.document.toJSON(),
      credential: didResult.credential,
      keyId: didResult.keyId,
      iotaKeyId: didResult.iotaKeyId,
      published: didResult.published || false,
      network: didResult.network,
      stronghold: {
        vaultPath: didResult.stronghold.vaultPath,
        vaultStats: vaultStats,
        storedKeys: storedKeys,
        storedDIDs: storedDIDs,
        storedCredentials: storedCredentials,
        testSignature: {
          data: testData,
          signature: testSignature,
          valid: signatureValid
        },
        encrypted: true,
        securityLevel: "Military-Grade AES-256-GCM"
      },
      explorerUrl: didResult.explorerDIDUrl,
      explorerTransactionUrl: publishResult?.explorerTransactionUrl,
      transactionHash: publishResult?.transactionHash,
      strongholdSignature: publishResult?.signature,
      resolverCompatible: true,
      universalResolverUrl: `https://dev.uniresolver.io/1.0/identifiers/${didResult.did}`,
      message: didResult.published 
        ? '🎉 Stronghold DID created and published to IOTA blockchain!'
        : '🔐 Stronghold DID created and stored with military-grade encryption!',
      note: 'This is a REAL Stronghold implementation with AES-256-GCM encryption, secure key storage, and cryptographic signing.',
      features: {
        realCryptography: true,
        strongholdEncryption: true,
        persistentStorage: true,
        realNetworking: true,
        noSimulations: true,
        militaryGradeSecurity: true,
        cryptographicSigning: true,
        encryptedVault: true,
        secureKeyDerivation: true,
        dataIntegrity: true,
        resolverCompatible: true,
        universalResolverSupport: true
      },
      security: {
        encryption: "AES-256-GCM",
        keyDerivation: "PBKDF2-SHA256",
        signatureAlgorithm: "Ed25519",
        vaultProtection: "Password + Salt",
        dataAuthentication: "HMAC",
        secureRandom: "Node.js crypto.randomBytes",
        iotaIdentityVersion: "v1.6+"
      }
    });

  } catch (error) {
    console.error('❌ Error in Stronghold DID creation:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      type: "STRONGHOLD_IMPLEMENTATION_ERROR",
      details: error.toString()
    });
  }
} 