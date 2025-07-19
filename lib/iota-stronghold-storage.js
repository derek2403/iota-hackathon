const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * IOTA Stronghold-like Storage Implementation
 * Provides encrypted storage for keys, DIDs, and credentials
 * Uses AES-256-GCM for encryption and secure key derivation
 */
class IOTAStrongholdStorage {
  constructor(vaultPath = './stronghold', password = null) {
    this.vaultPath = vaultPath;
    this.password = password || this.generateSecurePassword();
    this.salt = null;
    this.encryptionKey = null;
    this.isInitialized = false;
    
    // Storage structures
    this.keyStore = new Map();
    this.didStore = new Map();
    this.credentialStore = new Map();
    this.metadata = {
      created: new Date().toISOString(),
      version: '1.0.0',
      type: 'IOTA-Stronghold-Compatible'
    };
  }

  /**
   * Initialize vault with robust error handling
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Stronghold storage...');
      
      // Ensure vault directory exists
      await this.ensureVaultDirectory();
      
      // Generate password if not provided
      if (!this.password) {
        this.password = this.generateSecurePassword();
        console.log('🔑 Generated secure password for vault');
      }
      
      // Check if vault exists
      const exists = await this.vaultExists();
      
      if (exists) {
        console.log('📂 Loading existing Stronghold vault...');
        await this.loadVault();
      } else {
        console.log('🆕 Creating new Stronghold vault...');
        await this.createNewVault();
      }
      
      this.isInitialized = true;
      
      return {
        success: true,
        vaultPath: this.vaultPath,
        vaultExists: exists,
        keyCount: this.keyStore.size,
        didCount: this.didStore.size,
        credentialCount: this.credentialStore.size,
        securityLevel: 'Military-Grade AES-256-GCM',
        encryption: 'PBKDF2-SHA256 Key Derivation'
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize Stronghold storage:', error);
      
      // Try to recover by creating a completely new vault
      try {
        console.log('🔄 Attempting vault recovery...');
        
        // Remove existing vault directory
        await fs.rm(this.vaultPath, { recursive: true, force: true });
        
        // Create fresh vault
        await this.ensureVaultDirectory();
        this.password = this.generateSecurePassword();
        await this.createNewVault();
        this.isInitialized = true;
        
        console.log('✅ Vault recovery successful');
        
        return {
          success: true,
          vaultPath: this.vaultPath,
          vaultExists: false,
          keyCount: 0,
          didCount: 0,
          credentialCount: 0,
          securityLevel: 'Military-Grade AES-256-GCM',
          encryption: 'PBKDF2-SHA256 Key Derivation',
          recovered: true
        };
        
      } catch (recoveryError) {
        console.error('❌ Vault recovery failed:', recoveryError);
        throw new Error('Stronghold initialization failed and recovery unsuccessful');
      }
    }
  }

  /**
   * Generate a secure random password for the vault
   */
  generateSecurePassword() {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  async deriveEncryptionKey(password, salt) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      });
    });
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encryptData(data, key) {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from('iota-stronghold', 'utf8'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex')
    };
  }

  /**
   * Decrypt data using AES-256-GCM with error handling
   */
  decryptData(encryptedData, key) {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from('iota-stronghold', 'utf8'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(Buffer.from(encryptedData.data, 'hex'));
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return JSON.parse(decrypted.toString('utf8'));
    } catch (error) {
      console.error('❌ Decryption failed:', error.message);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Ensure vault directory exists
   */
  async ensureVaultDirectory() {
    try {
      await fs.mkdir(this.vaultPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Check if vault exists
   */
  async vaultExists() {
    try {
      const vaultFile = path.join(this.vaultPath, 'vault.stronghold');
      await fs.access(vaultFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new vault
   */
  async createNewVault() {
    // Generate salt for key derivation
    this.salt = crypto.randomBytes(32);
    
    // Derive encryption key
    this.encryptionKey = await this.deriveEncryptionKey(this.password, this.salt);
    
    // Save vault metadata
    await this.saveVault();
    
    console.log('🔐 New Stronghold vault created with secure encryption');
  }

  /**
   * Load existing vault with error handling
   */
  async loadVault() {
    try {
      const vaultFile = path.join(this.vaultPath, 'vault.stronghold');
      const vaultData = JSON.parse(await fs.readFile(vaultFile, 'utf8'));
      
      // Extract salt
      this.salt = Buffer.from(vaultData.salt, 'hex');
      
      // Derive encryption key
      this.encryptionKey = await this.deriveEncryptionKey(this.password, this.salt);
      
      // Decrypt and load stores with error handling
      try {
        if (vaultData.keyStore) {
          const decryptedKeyStore = this.decryptData(vaultData.keyStore, this.encryptionKey);
          this.keyStore = new Map(decryptedKeyStore);
        }
        
        if (vaultData.didStore) {
          const decryptedDidStore = this.decryptData(vaultData.didStore, this.encryptionKey);
          this.didStore = new Map(decryptedDidStore);
        }
        
        if (vaultData.credentialStore) {
          const decryptedCredentialStore = this.decryptData(vaultData.credentialStore, this.encryptionKey);
          this.credentialStore = new Map(decryptedCredentialStore);
        }
        
        if (vaultData.metadata) {
          this.metadata = vaultData.metadata;
        }
        
        console.log('🔓 Stronghold vault decrypted and loaded successfully');
      } catch (decryptError) {
        console.warn('⚠️ Vault decryption failed, creating new vault:', decryptError.message);
        await this.handleVaultCorruption();
      }
      
    } catch (error) {
      console.warn('⚠️ Vault loading failed, creating new vault:', error.message);
      await this.handleVaultCorruption();
    }
  }

  /**
   * Handle vault corruption by creating a new vault
   */
  async handleVaultCorruption() {
    try {
      // Backup corrupted vault
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${this.vaultPath}_corrupted_${timestamp}`;
      
      if (await this.vaultExists()) {
        await fs.rename(this.vaultPath, backupPath);
        console.log(`💾 Corrupted vault backed up to: ${backupPath}`);
      }
      
      // Ensure directory exists for new vault
      await this.ensureVaultDirectory();
      
      // Create new vault
      await this.createNewVault();
      console.log('🔄 New vault created after corruption recovery');
      
    } catch (error) {
      console.error('❌ Failed to handle vault corruption:', error);
      throw new Error('Vault corruption recovery failed');
    }
  }

  /**
   * Save vault to encrypted file
   */
  async saveVault() {
    const vaultData = {
      salt: this.salt.toString('hex'),
      keyStore: this.encryptData(Array.from(this.keyStore.entries()), this.encryptionKey),
      didStore: this.encryptData(Array.from(this.didStore.entries()), this.encryptionKey),
      credentialStore: this.encryptData(Array.from(this.credentialStore.entries()), this.encryptionKey),
      metadata: this.metadata,
      timestamp: new Date().toISOString()
    };
    
    const vaultFile = path.join(this.vaultPath, 'vault.stronghold');
    await fs.writeFile(vaultFile, JSON.stringify(vaultData, null, 2));
    
    console.log('💾 Stronghold vault saved with encryption');
  }

  /**
   * Store a key securely in the vault
   */
  async storeKey(keyId, keyData, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const keyEntry = {
      keyId,
      keyData,
      metadata: {
        ...metadata,
        stored: new Date().toISOString(),
        type: 'cryptographic-key'
      }
    };
    
    this.keyStore.set(keyId, keyEntry);
    await this.saveVault();
    
    console.log('🔑 Key stored securely in Stronghold:', keyId);
    return keyId;
  }

  /**
   * Retrieve a key from the vault
   */
  async getKey(keyId) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const keyEntry = this.keyStore.get(keyId);
    if (!keyEntry) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    console.log('🔓 Key retrieved from Stronghold:', keyId);
    return keyEntry;
  }

  /**
   * Store a DID document securely
   */
  async storeDID(did, document, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const didEntry = {
      did,
      document,
      metadata: {
        ...metadata,
        stored: new Date().toISOString(),
        type: 'did-document'
      }
    };
    
    this.didStore.set(did, didEntry);
    await this.saveVault();
    
    console.log('🆔 DID stored securely in Stronghold:', did);
    return did;
  }

  /**
   * Retrieve a DID document from the vault
   */
  async getDID(did) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const didEntry = this.didStore.get(did);
    if (!didEntry) {
      throw new Error(`DID not found: ${did}`);
    }
    
    console.log('📋 DID retrieved from Stronghold:', did);
    return didEntry;
  }

  /**
   * Store a verifiable credential securely
   */
  async storeCredential(credentialId, credential, metadata = {}) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const credentialEntry = {
      credentialId,
      credential,
      metadata: {
        ...metadata,
        stored: new Date().toISOString(),
        type: 'verifiable-credential'
      }
    };
    
    this.credentialStore.set(credentialId, credentialEntry);
    await this.saveVault();
    
    console.log('🏆 Credential stored securely in Stronghold:', credentialId);
    return credentialId;
  }

  /**
   * Retrieve a credential from the vault
   */
  async getCredential(credentialId) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const credentialEntry = this.credentialStore.get(credentialId);
    if (!credentialEntry) {
      throw new Error(`Credential not found: ${credentialId}`);
    }
    
    console.log('🎖️  Credential retrieved from Stronghold:', credentialId);
    return credentialEntry;
  }

  /**
   * List all keys in the vault
   */
  async listKeys() {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    return Array.from(this.keyStore.keys());
  }

  /**
   * List all DIDs in the vault
   */
  async listDIDs() {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    return Array.from(this.didStore.keys());
  }

  /**
   * List all credentials in the vault
   */
  async listCredentials() {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    return Array.from(this.credentialStore.keys());
  }

  /**
   * Get vault statistics
   */
  async getVaultStats() {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    return {
      keyCount: this.keyStore.size,
      didCount: this.didStore.size,
      credentialCount: this.credentialStore.size,
      vaultPath: this.vaultPath,
      metadata: this.metadata,
      isEncrypted: true,
      storageType: 'IOTA-Stronghold-Compatible'
    };
  }

  /**
   * Export vault data (for backup)
   */
  async exportVault(password) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    if (password !== this.password) {
      throw new Error('Invalid password for vault export');
    }
    
    return {
      keys: Array.from(this.keyStore.entries()),
      dids: Array.from(this.didStore.entries()),
      credentials: Array.from(this.credentialStore.entries()),
      metadata: this.metadata,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Generate a secure key pair for Ed25519
   */
  async generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    
    // Convert to base64 for storage
    const keyPair = {
      publicKey: publicKey.toString('base64'),
      privateKey: privateKey.toString('base64'),
      algorithm: 'Ed25519',
      generated: new Date().toISOString()
    };
    
    console.log('🎲 Generated new Ed25519 key pair');
    return keyPair;
  }

  /**
   * Sign data with a stored private key
   */
  async signData(keyId, data) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const keyEntry = await this.getKey(keyId);
    const privateKeyDer = Buffer.from(keyEntry.keyData.privateKey, 'base64');
    
    // Convert DER to PEM for Node.js crypto
    const privateKeyPem = crypto.createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'pkcs8'
    });
    
    // Sign the data
    const signature = crypto.sign(null, Buffer.from(data), privateKeyPem);
    
    console.log('✍️  Data signed with key:', keyId);
    return signature.toString('base64');
  }

  /**
   * Verify signature with a stored public key
   */
  async verifySignature(keyId, data, signature) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const keyEntry = await this.getKey(keyId);
    const publicKeyDer = Buffer.from(keyEntry.keyData.publicKey, 'base64');
    
    // Convert DER to PEM for Node.js crypto
    const publicKeyPem = crypto.createPublicKey({
      key: publicKeyDer,
      format: 'der',
      type: 'spki'
    });
    
    // Verify the signature
    const isValid = crypto.verify(null, Buffer.from(data), publicKeyPem, Buffer.from(signature, 'base64'));
    
    console.log('🔍 Signature verification result:', isValid);
    return isValid;
  }

  /**
   * Delete a key from the vault
   */
  async deleteKey(keyId) {
    if (!this.isInitialized) {
      throw new Error('Stronghold storage not initialized');
    }
    
    const deleted = this.keyStore.delete(keyId);
    if (deleted) {
      await this.saveVault();
      console.log('🗑️  Key deleted from Stronghold:', keyId);
    }
    
    return deleted;
  }

  /**
   * Close and lock the vault
   */
  async close() {
    if (this.isInitialized) {
      await this.saveVault();
      
      // Clear sensitive data from memory
      this.encryptionKey = null;
      this.keyStore.clear();
      this.didStore.clear();
      this.credentialStore.clear();
      this.isInitialized = false;
      
      console.log('🔒 Stronghold vault closed and locked');
    }
  }
}

module.exports = IOTAStrongholdStorage; 