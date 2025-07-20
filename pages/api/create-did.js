const IOTAIdentityService = require('../../lib/iota-identity');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo } = req.body;

    if (!userInfo || !userInfo.name || !userInfo.email || !userInfo.dateOfBirth) {
      return res.status(400).json({ 
        error: 'Missing required user information: name, email, and date of birth are required',
        success: false 
      });
    }

    // Initialize IOTA Identity Service
    const identityService = new IOTAIdentityService();
    await identityService.initialize();

    // Check if user already has a DID
    const existingDID = identityService.checkExistingDID(userInfo);
    console.log('🔍 Checking for existing DID:', existingDID.did);

    // Create user-based DID
    const didResult = await identityService.createDID(userInfo);

    // Create a verifiable credential for the user
    const credential = await identityService.createVerifiableCredential(
      didResult.did,
      didResult.did,
      userInfo,
      didResult.jwk
    );

    res.status(200).json({
      success: true,
      did: didResult.did,
      document: didResult.document.toJSON(),
      credential: credential,
      explorerUrl: identityService.getExplorerUrl(didResult.did),
      published: false,
      network: didResult.network,
      didGenerationMethod: "user-credentials",
      message: '🎉 User-based DID created locally! This DID is tied to your identity credentials.',
      note: 'Same user credentials will always generate the same DID. This is a local creation - use wallet integration to publish to testnet.'
    });

  } catch (error) {
    console.error('Error creating DID:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
} 