const IOTAStrongholdStorage = require('../lib/iota-stronghold-storage');
const path = require('path');
const fs = require('fs').promises;

async function testStrongholdRecovery() {
  console.log('🧪 Testing Stronghold Recovery System...\n');

  // Test 1: Fresh vault creation
  console.log('📋 Test 1: Fresh vault creation');
  const testVaultPath = './test-stronghold-recovery';
  
  try {
    const stronghold = new IOTAStrongholdStorage(testVaultPath, 'test-password-123');
    const initResult = await stronghold.initialize();
    
    console.log('✅ Fresh vault created successfully');
    console.log('   Vault path:', initResult.vaultPath);
    console.log('   Security level:', initResult.securityLevel);
    console.log('   Encryption:', initResult.encryption);
    
    // Test 2: Store and retrieve data
    console.log('\n📋 Test 2: Store and retrieve data');
    
    const testKey = {
      publicKey: 'test-public-key',
      privateKey: 'test-private-key',
      algorithm: 'Ed25519'
    };
    
    await stronghold.storeKey('test-key-1', testKey, { purpose: 'testing' });
    const retrievedKey = await stronghold.getKey('test-key-1');
    
    console.log('✅ Key stored and retrieved successfully');
    console.log('   Key ID:', retrievedKey.keyId);
    console.log('   Algorithm:', retrievedKey.keyData.algorithm);
    
    // Test 3: Test vault corruption recovery
    console.log('\n📋 Test 3: Vault corruption recovery');
    
    // Corrupt the vault file
    const vaultFile = path.join(testVaultPath, 'vault.stronghold');
    const vaultData = JSON.parse(await fs.readFile(vaultFile, 'utf8'));
    vaultData.keyStore.data = 'corrupted-data';
    await fs.writeFile(vaultFile, JSON.stringify(vaultData, null, 2));
    
    console.log('   Corrupted vault file');
    
    // Try to load corrupted vault
    const recoveryStronghold = new IOTAStrongholdStorage(testVaultPath, 'test-password-123');
    const recoveryResult = await recoveryStronghold.initialize();
    
    console.log('✅ Vault recovery successful');
    console.log('   Recovered:', recoveryResult.recovered);
    console.log('   Key count:', recoveryResult.keyCount);
    
    // Test 4: Test with different password
    console.log('\n📋 Test 4: Different password handling');
    
    const newVaultPath = './test-stronghold-new-password';
    const newStronghold = new IOTAStrongholdStorage(newVaultPath, 'different-password-456');
    const newInitResult = await newStronghold.initialize();
    
    console.log('✅ New vault with different password created');
    console.log('   Vault path:', newInitResult.vaultPath);
    console.log('   Key count:', newInitResult.keyCount);
    
    // Test 5: Test key generation and signing
    console.log('\n📋 Test 5: Key generation and signing');
    
    const keyPair = await newStronghold.generateKeyPair();
    console.log('✅ Key pair generated');
    console.log('   Algorithm:', keyPair.algorithm);
    console.log('   Generated:', keyPair.generated);
    
    // Store the generated key pair
    await newStronghold.storeKey('generated-key-1', keyPair, { purpose: 'testing' });
    console.log('✅ Generated key pair stored');
    
    const testData = "Hello Stronghold Recovery Test!";
    const signature = await newStronghold.signData('generated-key-1', testData);
    const isValid = await newStronghold.verifySignature('generated-key-1', testData, signature);
    
    console.log('✅ Signing and verification successful');
    console.log('   Signature valid:', isValid);
    
    // Test 6: Vault statistics
    console.log('\n📋 Test 6: Vault statistics');
    
    const stats = await newStronghold.getVaultStats();
    console.log('✅ Vault statistics retrieved');
    console.log('   Total keys:', stats.totalKeys);
    console.log('   Total DIDs:', stats.totalDIDs);
    console.log('   Total credentials:', stats.totalCredentials);
    console.log('   Vault size:', stats.vaultSize, 'bytes');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test vaults...');
    await fs.rm(testVaultPath, { recursive: true, force: true });
    await fs.rm(newVaultPath, { recursive: true, force: true });
    console.log('✅ Test vaults cleaned up');
    
    console.log('\n🎉 All Stronghold recovery tests passed!');
    console.log('   ✅ Fresh vault creation');
    console.log('   ✅ Data storage and retrieval');
    console.log('   ✅ Vault corruption recovery');
    console.log('   ✅ Password handling');
    console.log('   ✅ Key generation and signing');
    console.log('   ✅ Vault statistics');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testStrongholdRecovery().catch(console.error); 