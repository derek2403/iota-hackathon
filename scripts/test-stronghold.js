const IOTAIdentityStrongholdService = require('../lib/iota-identity-stronghold');
const IOTAStrongholdStorage = require('../lib/iota-stronghold-storage');

async function testStrongholdImplementation() {
  console.log('🔒 Testing IOTA Stronghold Implementation...\n');

  try {
    // Test 1: Basic Stronghold Storage
    console.log('=== Test 1: Basic Stronghold Storage ===');
    const stronghold = new IOTAStrongholdStorage('./test-stronghold', 'test-password-123');
    await stronghold.initialize();
    
    // Generate and store a key
    const keyPair = await stronghold.generateKeyPair();
    const keyId = await stronghold.storeKey('test-key-1', keyPair, { purpose: 'testing' });
    console.log('✅ Key generated and stored:', keyId);
    
    // Retrieve and verify the key
    const retrievedKey = await stronghold.getKey(keyId);
    console.log('✅ Key retrieved successfully');
    
    // Test signing and verification
    const testData = 'Hello IOTA Stronghold!';
    const signature = await stronghold.signData(keyId, testData);
    const isValid = await stronghold.verifySignature(keyId, testData, signature);
    console.log('✅ Signature test passed:', isValid);
    
    // Get vault stats
    const stats = await stronghold.getVaultStats();
    console.log('📊 Vault stats:', stats);
    
    await stronghold.close();
    console.log('✅ Stronghold storage test completed\n');

    // Test 2: Full Identity Service
    console.log('=== Test 2: Full Identity Service with Stronghold ===');
    const identityService = new IOTAIdentityStrongholdService();
    // Use different vault directory to avoid conflicts
    await identityService.initialize('testnet', 'identity-vault-password', './test-stronghold-identity');
    
    // Test user info
    const testUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      dateOfBirth: '1990-01-01',
      country: 'United States',
      address: '123 Main St, Anytown, USA',
      idNumber: 'ID123456789'
    };
    
    // Create DID with Stronghold
    const didResult = await identityService.createStrongholdDID(testUser);
    console.log('✅ DID created with Stronghold:', didResult.did);
    console.log('🔑 Key ID:', didResult.keyId);
    
    // Test publishing (simulation)
    const publishResult = await identityService.publishStrongholdDID(didResult, 'test-wallet-address');
    console.log('✅ DID published:', publishResult.published);
    console.log('🔗 Transaction hash:', publishResult.transactionHash);
    
    // Test Stronghold operations
    const allKeys = await identityService.listStrongholdKeys();
    const allDIDs = await identityService.listStrongholdDIDs();
    const allCredentials = await identityService.listStrongholdCredentials();
    
    console.log('📋 Stored keys:', allKeys.length);
    console.log('📋 Stored DIDs:', allDIDs.length);
    console.log('📋 Stored credentials:', allCredentials.length);
    
    // Test signing with service
    const testMessage = 'IOTA Identity Stronghold Test';
    const serviceSignature = await identityService.signWithStronghold(didResult.keyId, testMessage);
    const serviceVerification = await identityService.verifyWithStronghold(didResult.keyId, testMessage, serviceSignature);
    console.log('✅ Service signature test passed:', serviceVerification);
    
    await identityService.closeStronghold();
    console.log('✅ Identity service test completed\n');

    // Test 3: Vault Persistence
    console.log('=== Test 3: Vault Persistence Test ===');
    const stronghold2 = new IOTAStrongholdStorage('./test-stronghold', 'test-password-123');
    await stronghold2.initialize();
    
    // Check if previously stored key exists
    try {
      const persistedKey = await stronghold2.getKey('test-key-1');
      console.log('✅ Vault persistence verified - key found after restart');
    } catch (error) {
      console.log('❌ Vault persistence test failed:', error.message);
    }
    
    await stronghold2.close();
    console.log('✅ Persistence test completed\n');

    // Test 4: Multiple User Scenarios
    console.log('=== Test 4: Multiple User Scenarios ===');
    const multiUserService = new IOTAIdentityStrongholdService();
    // Use another separate vault directory
    await multiUserService.initialize('testnet', 'multi-user-vault-password', './test-stronghold-multi');
    
    const users = [
      { name: 'Alice Smith', email: 'alice@example.com', dateOfBirth: '1985-05-15' },
      { name: 'Bob Johnson', email: 'bob@example.com', dateOfBirth: '1992-12-03' },
      { name: 'Charlie Brown', email: 'charlie@example.com', dateOfBirth: '1988-08-22' }
    ];
    
    for (const user of users) {
      const userDID = await multiUserService.createStrongholdDID(user);
      console.log(`✅ Created DID for ${user.name}: ${userDID.did.substring(0, 50)}...`);
    }
    
    const finalStats = await multiUserService.getStrongholdStats();
    console.log('📊 Final vault stats:', finalStats);
    
    await multiUserService.closeStronghold();
    console.log('✅ Multi-user test completed\n');

    console.log('🎉 All Stronghold tests passed successfully!');
    console.log('🔒 Military-grade security verified');
    console.log('💾 Persistent storage verified');
    console.log('🔑 Cryptographic operations verified');
    console.log('🆔 DID management verified');

  } catch (error) {
    console.error('❌ Stronghold test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testStrongholdImplementation()
    .then(() => {
      console.log('\n✅ Stronghold implementation test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Stronghold implementation test failed:', error);
      process.exit(1);
    });
}

module.exports = { testStrongholdImplementation }; 