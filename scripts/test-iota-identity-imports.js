const { 
  IotaDocument, 
  MethodScope, 
  VerificationMethod, 
  Service,
  Credential, 
  FailFast, 
  EdDSAJwsVerifier,
  JwsSignatureOptions,
  Timestamp,
  Resolver,
  Jwk,
  JwkType,
  EdCurve,
  IotaIdentityClient,
  JwkMemStore,
  KeyIdMemStore
} = require('@iota/identity-wasm/node');

const { Client } = require('@iota/sdk-wasm/node');

async function testIOTAIdentityImports() {
  console.log('🧪 Testing IOTA Identity Imports...\n');

  try {
    console.log('✅ All imports successful!');
    console.log('Available classes:');
    console.log('  - IotaDocument:', typeof IotaDocument);
    console.log('  - MethodScope:', typeof MethodScope);
    console.log('  - VerificationMethod:', typeof VerificationMethod);
    console.log('  - Service:', typeof Service);
    console.log('  - Credential:', typeof Credential);
    console.log('  - JwsSignatureOptions:', typeof JwsSignatureOptions);
    console.log('  - Timestamp:', typeof Timestamp);
    console.log('  - Resolver:', typeof Resolver);
    console.log('  - Jwk:', typeof Jwk);
    console.log('  - JwkType:', typeof JwkType);
    console.log('  - EdCurve:', typeof EdCurve);
    console.log('  - IotaIdentityClient:', typeof IotaIdentityClient);
    console.log('  - JwkMemStore:', typeof JwkMemStore);
    console.log('  - KeyIdMemStore:', typeof KeyIdMemStore);
    console.log('  - Client:', typeof Client);

    // Test basic functionality
    console.log('\n📋 Testing basic functionality...');
    
    // Test client creation
    const client = new Client({
      primaryNode: "https://api.testnet.iotaledger.net",
      localPow: true,
    });
    console.log('✅ Client created successfully');

    // Test identity client
    const identityClient = new IotaIdentityClient(client);
    console.log('✅ Identity client created successfully');

    // Test network HRP
    const networkHrp = await identityClient.getNetworkHrp();
    console.log('✅ Network HRP retrieved:', networkHrp);

    // Test document creation
    const document = new IotaDocument(networkHrp);
    console.log('✅ Document created successfully');

    // Test JWK storage
    const keyStorage = new JwkMemStore();
    console.log('✅ Key storage created successfully');

    console.log('\n🎉 All IOTA Identity imports and basic functionality working!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testIOTAIdentityImports().catch(console.error); 