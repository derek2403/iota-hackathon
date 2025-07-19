const { EdDSAJwsVerifier, FailFast, Resolver } = require('@iota/identity-wasm/node');
const { Client } = require('@iota/sdk-wasm/node');
const { IotaIdentityClient } = require('@iota/identity-wasm/node');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ 
        error: 'Credential is required',
        success: false 
      });
    }

    console.log('🔍 Verifying credential...');

    // Initialize IOTA client
    const client = new Client({
      primaryNode: "https://api.testnet.iotaledger.net",
      localPow: true,
    });

    // Initialize IOTA Identity client
    const identityClient = new IotaIdentityClient(client);

    // Initialize resolver and verifier
    const resolver = new Resolver();
    const verifier = new EdDSAJwsVerifier();

    try {
      // Verify the credential
      const result = await verifier.verify(credential, resolver, FailFast);
      
      console.log('✅ Credential verification completed');

      res.status(200).json({
        valid: result.isValid,
        credential: result.credential,
        success: true,
        verificationType: "real-cryptographic-verification",
        iotaIdentityVersion: "v1.6+",
        message: result.isValid ? 'Credential is valid! ✅' : 'Credential is invalid! ❌'
      });

    } catch (verificationError) {
      console.error('❌ Credential verification failed:', verificationError);
      
      res.status(400).json({
        valid: false,
        error: verificationError.message,
        success: false,
        verificationType: "failed",
        details: verificationError.toString()
      });
    }

  } catch (error) {
    console.error('❌ Error verifying credential:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      details: error.toString()
    });
  }
} 