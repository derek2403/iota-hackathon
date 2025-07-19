const { Resolver } = require('@iota/identity-wasm/node');
const { Client } = require('@iota/sdk-wasm/node');
const { IotaIdentityClient } = require('@iota/identity-wasm/node');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { did } = req.body;

    if (!did) {
      return res.status(400).json({ 
        error: 'DID is required',
        success: false 
      });
    }

    console.log('🔍 Resolving DID:', did);

    // Initialize IOTA client
    const client = new Client({
      primaryNode: "https://api.testnet.iotaledger.net",
      localPow: true,
    });

    // Initialize IOTA Identity client
    const identityClient = new IotaIdentityClient(client);

    // Initialize resolver
    const resolver = new Resolver();

    try {
      // Resolve the DID using IOTA Identity
      const resolved = await identityClient.resolveDid(did);
      
      console.log('✅ DID resolved successfully');

      // Format response for universal resolver compatibility
      const resolutionResult = {
        didDocument: resolved.toJSON(),
        didResolutionMetadata: {
          contentType: "application/did+ld+json",
          did: {
            didString: did,
            methodSpecificId: did.split(':')[2] || did.split(':')[1],
            method: "iota"
          }
        },
        didDocumentMetadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          versionId: "1",
          nextVersionId: null,
          deactivated: false
        }
      };

      res.status(200).json({
        success: true,
        resolution: resolutionResult,
        universalResolverCompatible: true,
        resolverUrl: `https://dev.uniresolver.io/1.0/identifiers/${did}`,
        message: 'DID resolved successfully using IOTA Identity v1.6+'
      });

    } catch (resolveError) {
      console.log('❌ DID resolution failed, trying universal resolver...');
      
      // Fallback to universal resolver
      try {
        const universalResolverUrl = `https://dev.uniresolver.io/1.0/identifiers/${did}`;
        const universalResponse = await fetch(universalResolverUrl);
        
        if (universalResponse.ok) {
          const universalResult = await universalResponse.json();
          
          res.status(200).json({
            success: true,
            resolution: universalResult,
            universalResolverCompatible: true,
            resolverUrl: universalResolverUrl,
            message: 'DID resolved using universal resolver',
            fallbackUsed: true
          });
        } else {
          throw new Error('Universal resolver also failed');
        }
      } catch (universalError) {
        console.error('❌ Universal resolver also failed:', universalError);
        
        res.status(404).json({
          success: false,
          error: 'DID not found',
          did: did,
          message: 'DID could not be resolved using IOTA Identity or universal resolver',
          details: resolveError.message
        });
      }
    }

  } catch (error) {
    console.error('❌ Error resolving DID:', error);
    res.status(500).json({
      error: error.message,
      success: false,
      details: error.toString()
    });
  }
} 