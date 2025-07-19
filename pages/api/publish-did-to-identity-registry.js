const IOTAIdentityService = require('../../lib/iota-identity');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo, walletAddress, realTransactionDigest, privateKey } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.email || !userInfo.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required user information: name, email, and date of birth are required',
        success: false 
      });
    }

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address is required',
        success: false 
      });
    }

    console.log('🚀 Publishing DID to IOTA blockchain...');
    if (realTransactionDigest) {
      console.log('🔗 Using real blockchain transaction:', realTransactionDigest);
    }
    if (privateKey) {
      console.log('🔑 Using provided private key for publishing');
    }

    // Initialize IOTA Identity Service
    const identityService = new IOTAIdentityService();
    await identityService.initialize();

    // Check if user already has a DID
    const existingDID = identityService.checkExistingDID(userInfo);
    console.log('🔍 Checking for existing DID:', existingDID.did);

    let didResult;
    
    // Use private key publishing if private key is provided
    if (privateKey) {
      didResult = await identityService.publishDIDWithPrivateKey(userInfo, walletAddress, privateKey, realTransactionDigest);
    } else {
      // Fallback to regular blockchain publishing
      didResult = await identityService.publishDIDToBlockchain(userInfo, walletAddress, realTransactionDigest);
    }

    // Create a verifiable credential for the user with registry info
    const userInfoWithRegistry = {
      ...userInfo,
      walletAddress: walletAddress,
      transactionDigest: didResult.transactionDigest,
      network: didResult.network,
      published: didResult.published,
      registryTimestamp: new Date().toISOString()
    };

    const credential = await identityService.createVerifiableCredential(
      didResult.did,
      didResult.did,
      userInfoWithRegistry,
      didResult.jwk
    );

    res.status(200).json({
      success: true,
      did: didResult.did,
      document: didResult.document.toJSON(),
      credential: credential,
      explorerUrl: identityService.getExplorerUrl(didResult.did),
      explorerDIDUrl: didResult.explorerDIDUrl,
      explorerTransactionUrl: didResult.explorerTransactionUrl,
      published: didResult.published,
      network: didResult.network,
      walletAddress: walletAddress,
      transactionDigest: didResult.transactionDigest,
      didGenerationMethod: "user-credentials",
      message: didResult.privateKeyUsed 
        ? '🎉 DID published to IOTA blockchain using private key!' 
        : didResult.isRealBlockchainTransaction 
          ? '🎉 DID published to IOTA blockchain!' 
          : '📝 DID created with proper format - requires Alias Output for universal resolver',
      note: didResult.privateKeyUsed
        ? `Your DID is published using private key: ${didResult.transactionDigest}. Should be resolvable by universal resolver.`
        : didResult.isRealBlockchainTransaction
          ? `Your DID is published on IOTA blockchain: ${didResult.transactionDigest}`
          : `Your DID has correct format (${didResult.did}) but requires Alias Output creation for universal resolver compatibility`,
      isRealBlockchainTransaction: didResult.isRealBlockchainTransaction,
      universalResolverCompatible: didResult.universalResolverCompatible,
      aliasOutputRequired: didResult.aliasOutputRequired,
      privateKeyUsed: didResult.privateKeyUsed || false,
      aliasOutputCreated: didResult.aliasOutputCreated || false,
      registryDetails: {
        status: didResult.registryStatus,
        transactionDigest: didResult.transactionDigest,
        network: "IOTA Testnet",
        registryProtocol: "IOTA Identity v1.6+",
        timestamp: new Date().toISOString(),
        explorerDIDLink: didResult.explorerDIDUrl,
        explorerTransactionLink: didResult.explorerTransactionUrl,
        blockchainVerification: didResult.privateKeyUsed ? "PUBLISHED_WITH_PRIVATE_KEY" : 
                               didResult.isRealBlockchainTransaction ? "PUBLISHED" : "REQUIRES_ALIAS_OUTPUT",
        universalResolverNote: didResult.universalResolverCompatible 
          ? "DID should be resolvable by universal resolver"
          : "DID will not be resolvable by universal resolver until published as Alias Output",
        publishingMethod: didResult.privateKeyUsed ? "Private Key Signing" : "Wallet Integration"
      },
      publishingRequirements: didResult.publishingRequirements,
      publishingSuccess: didResult.publishingSuccess
    });

  } catch (error) {
    console.error('Error publishing DID to Identity registry:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      details: error.toString()
    });
  }
} 