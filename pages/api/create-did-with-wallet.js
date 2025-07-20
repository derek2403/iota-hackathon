const IOTAIdentityService = require('../../lib/iota-identity');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userInfo, walletAddress, enableBlockchainPublishing, transactionDigest } = req.body;

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

    // Initialize IOTA Identity Service
    const identityService = new IOTAIdentityService();
    await identityService.initialize();

    // Check if user already has a DID
    const existingDID = identityService.checkExistingDID(userInfo);
    console.log('🔍 Checking for existing DID:', existingDID.did);

    if (enableBlockchainPublishing) {
      console.log('🚀 Preparing DID for blockchain publishing...');
      
      // Create DID document locally first
      const didResult = await identityService.createDID(userInfo);
      
      // Return the DID data for frontend to publish using wallet
      return res.status(200).json({
        success: true,
        requiresWalletSigning: true,
        did: didResult.did,
        document: didResult.document.toJSON(),
        publicJwk: didResult.publicJwk,
        userInfo: userInfo,
        walletAddress: walletAddress,
        didGenerationMethod: "user-credentials",
        message: '📝 DID prepared for blockchain publishing. Please sign the transaction with your wallet.',
        note: 'Your wallet will be used to publish this DID to the IOTA blockchain.',
        publishingInstructions: {
          step1: "Review the DID document details",
          step2: "Sign the transaction with your connected wallet", 
          step3: "DID will be published to IOTA testnet blockchain",
          step4: "You'll be able to verify it in the IOTA explorer"
        }
      });
    } else {
      // Original flow - create DID with wallet integration but don't publish
      const didResult = await identityService.createDIDWithWallet(userInfo, walletAddress, transactionDigest);

      // Create a verifiable credential for the user
      const userInfoWithWallet = {
        ...userInfo,
        walletAddress: walletAddress,
        transactionDigest: transactionDigest,
        network: "IOTA Testnet"
      };

      const credential = await identityService.createVerifiableCredential(
        didResult.did,
        didResult.did,
        userInfoWithWallet,
        didResult.jwk
      );

      res.status(200).json({
        success: true,
        did: didResult.did,
        document: didResult.document.toJSON(),
        credential: credential,
        explorerUrl: identityService.getExplorerUrl(didResult.did),
        published: didResult.published,
        network: didResult.network,
        walletAddress: walletAddress,
        transactionDigest: transactionDigest,
        didGenerationMethod: "user-credentials",
        message: didResult.published 
          ? '🎉 User-based DID created and published to IOTA testnet!' 
          : '📝 User-based DID created locally (requires wallet private key for blockchain publishing)',
        note: didResult.publishingNote || 'Same user credentials will always generate the same DID, regardless of wallet used.',
        publishingLimitation: !didResult.published ? {
          reason: "Cannot publish DID without wallet private key access",
          requirements: [
            "Access to wallet's private keys for transaction signing",
            "Gas tokens (IOTA) for transaction fees", 
            "Direct integration with wallet's signing methods",
            "Proper transaction creation and broadcasting"
          ],
          workaround: "DID is created deterministically and will be consistent across sessions"
        } : null
      });
    }

  } catch (error) {
    console.error('Error creating DID with wallet:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
} 