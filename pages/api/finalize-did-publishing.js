const IOTAIdentityService = require('../../lib/iota-identity');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo, walletAddress, transactionDigest, blockchainEffects } = req.body;

    if (!userInfo || !walletAddress || !transactionDigest) {
      return res.status(400).json({ 
        error: 'Missing required information: userInfo, walletAddress, and transactionDigest are required',
        success: false 
      });
    }

    // Initialize IOTA Identity Service
    const identityService = new IOTAIdentityService();
    await identityService.initialize();

    // Create the DID locally (this will be consistent with the published version)
    const didResult = await identityService.createDID(userInfo);

    // Create a verifiable credential for the user with blockchain info
    const userInfoWithBlockchain = {
      ...userInfo,
      walletAddress: walletAddress,
      transactionDigest: transactionDigest,
      network: "IOTA Testnet",
      published: true,
      blockchainTimestamp: new Date().toISOString()
    };

    const credential = await identityService.createVerifiableCredential(
      didResult.did,
      didResult.did,
      userInfoWithBlockchain,
      didResult.jwk
    );

    res.status(200).json({
      success: true,
      did: didResult.did,
      document: didResult.document.toJSON(),
      credential: credential,
      explorerUrl: identityService.getExplorerUrl(didResult.did),
      explorerTransactionUrl: `${identityService.getNetworkConfig().explorer}/transaction/${transactionDigest}`,
      published: true,
      network: "IOTA Testnet (Published)",
      walletAddress: walletAddress,
      transactionDigest: transactionDigest,
      blockchainEffects: blockchainEffects,
      didGenerationMethod: "user-credentials",
      message: '🎉 DID successfully published to IOTA blockchain!',
      note: `Your DID is now permanently recorded on the IOTA testnet. Transaction: ${transactionDigest}`,
      publishingDetails: {
        status: "Successfully published to blockchain",
        transactionDigest: transactionDigest,
        network: "IOTA Testnet",
        timestamp: new Date().toISOString(),
        explorerLink: `${identityService.getNetworkConfig().explorer}/transaction/${transactionDigest}`
      }
    });

  } catch (error) {
    console.error('Error finalizing DID publishing:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
} 