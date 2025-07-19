const { JwkMemStore, Jwk, JwkType, EdCurve } = require('@iota/identity-wasm/node');
const crypto = require('crypto');

async function testJwkFix() {
  console.log('🧪 Testing JWK Fix...\n');

  try {
    const keyStorage = new JwkMemStore();
    console.log('✅ JwkMemStore created successfully');

    // Generate a test key pair
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });

    // Convert to JWK format (simplified)
    const convertToJwkFormat = (keyBase64) => {
      const keyDer = Buffer.from(keyBase64, 'base64');
      const keyRaw = keyDer.slice(-32);
      return keyRaw.toString('base64url');
    };

    // Create JWK with correct parameters
    const jwk = new Jwk({
      kty: JwkType.Okp,
      crv: EdCurve.Ed25519,
      alg: "EdDSA",
      x: convertToJwkFormat(keyPair.publicKey),
      d: convertToJwkFormat(keyPair.privateKey)
    });
    console.log('✅ JWK created successfully');

    // Store JWK
    const keyId = await keyStorage.insert(jwk);
    console.log('✅ JWK stored successfully, Key ID:', keyId);

    // Retrieve JWK
    const retrievedJwk = await keyStorage._get_key(keyId);
    console.log('✅ JWK retrieved successfully');

    // Check if it exists
    const exists = await keyStorage.exists(keyId);
    console.log('✅ Key exists check:', exists);

    // Get count
    const count = keyStorage.count();
    console.log('✅ Key count:', count);

    console.log('\n🎉 JWK fix test passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testJwkFix().catch(console.error); 