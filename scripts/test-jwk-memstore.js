const { JwkMemStore, Jwk, JwkType, EdCurve } = require('@iota/identity-wasm/node');

async function testJwkMemStore() {
  console.log('🧪 Testing JwkMemStore API...\n');

  try {
    const keyStorage = new JwkMemStore();
    console.log('✅ JwkMemStore created successfully');
    
    // List all methods on the object
    console.log('\n📋 Available methods on JwkMemStore:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(keyStorage));
    methods.forEach(method => {
      if (method !== 'constructor') {
        console.log(`  - ${method}`);
      }
    });

    // Test creating a JWK
    console.log('\n📋 Testing JWK creation...');
    const jwk = new Jwk({
      kty: JwkType.Okp,
      crv: EdCurve.Ed25519,
      x: "test-public-key-base64url",
      d: "test-private-key-base64url"
    });
    console.log('✅ JWK created successfully');

    // Try different method names that might exist
    console.log('\n📋 Testing different method names...');
    
    const methodNames = [
      'insertKey',
      'insert',
      'addKey',
      'add',
      'storeKey',
      'store',
      'setKey',
      'set'
    ];

    for (const methodName of methodNames) {
      if (typeof keyStorage[methodName] === 'function') {
        console.log(`✅ Found method: ${methodName}`);
        try {
          const result = await keyStorage[methodName](jwk);
          console.log(`   Result:`, result);
        } catch (error) {
          console.log(`   Error:`, error.message);
        }
      }
    }

    // Check if there are any async methods
    console.log('\n📋 Checking for async methods...');
    for (const method of methods) {
      if (method !== 'constructor') {
        const methodFunc = keyStorage[method];
        if (methodFunc.constructor.name === 'AsyncFunction') {
          console.log(`  - ${method} (async)`);
        } else {
          console.log(`  - ${method} (sync)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJwkMemStore().catch(console.error); 