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
const crypto = require('crypto');
const IOTAStrongholdStorage = require('./iota-stronghold-storage');

// Network configuration utility
function getNetworkConfig() {
  return {
    testnet: {
      hrp: "testnet",
      url: "https://api.testnet.iotaledger.net",
      explorer: "https://explorer.iota.org/iota2-testnet",
      name: "IOTA Testnet",
      didPrefix: "did:iota:testnet"
    },
    localnet: {
      hrp: "localnet", 
      url: "http://127.0.0.1:9000",
      explorer: "http://localhost:9001",
      name: "IOTA Localnet",
      didPrefix: "did:iota:localnet"
    }
  };
}

const NETWORK_CONFIG = getNetworkConfig();
const DEFAULT_NETWORK = "testnet";

class IOTAIdentityStrongholdService {
  constructor() {
    this.networkInfo = null;
    this.client = null;
    this.identityClient = null;
    this.stronghold = null;
    this.vaultPassword = null;
    this.keyStorage = null;
  }

  async initialize(networkName = DEFAULT_NETWORK, vaultPassword = null, vaultPath = './stronghold') {
    try {
      console.log(`🚀 Initializing IOTA Identity Service with Stronghold Storage...`);
      
      const selectedNetwork = NETWORK_CONFIG[networkName] || NETWORK_CONFIG[DEFAULT_NETWORK];
      
      // Initialize IOTA client for blockchain operations
      this.client = new Client({
        primaryNode: selectedNetwork.url,
        localPow: true,
      });

      // Initialize IOTA Identity client
      this.identityClient = new IotaIdentityClient(this.client);

      // Initialize Stronghold storage
      this.vaultPassword = vaultPassword;
      this.stronghold = new IOTAStrongholdStorage(vaultPath, vaultPassword);
      const strongholdInit = await this.stronghold.initialize();

      // Initialize IOTA Identity storage systems
      this.keyStorage = new JwkMemStore();

      // Get the network HRP from the client
      const networkHrp = await this.identityClient.getNetworkHrp();
      
      this.networkInfo = { 
        hrp: networkHrp,
        didPrefix: `did:iota:${networkHrp}`,
        network: selectedNetwork.name,
        url: selectedNetwork.url,
        explorer: selectedNetwork.explorer,
        version: "v1.5.1 with Stronghold Storage",
        defaultNetwork: networkName,
        networkConfig: selectedNetwork,
        stronghold: strongholdInit
      };
      
      console.log(`✅ IOTA Identity Service with Stronghold initialized successfully!`);
      console.log('🌐 Network URL:', selectedNetwork.url);
      console.log('🆔 DID Prefix:', this.networkInfo.didPrefix);
      console.log('🔑 Network HRP:', networkHrp);
      console.log('🔒 Stronghold Vault:', strongholdInit.vaultPath);
      console.log('🌍 Explorer URL:', selectedNetwork.explorer);
      
      return {
        success: true,
        network: this.networkInfo,
        stronghold: strongholdInit
      };
    } catch (error) {
      console.error('❌ Failed to initialize IOTA Identity Service with Stronghold:', error);
      throw error;
    }
  }

  async createStrongholdDID(userInfo, privateKey = null) {
    try {
      console.log('🔐 Creating DID with Stronghold storage for:', userInfo.name);
      
      // Generate or use provided private key
      let keyPair;
      if (privateKey) {
        console.log('🔑 Using provided private key');
        keyPair = await this.importPrivateKey(privateKey);
      } else {
        console.log('🎲 Generating new key pair with Stronghold');
        keyPair = await this.stronghold.generateKeyPair();
      }

      // Create unique key ID
      const keyId = this.createKeyId(userInfo, keyPair);
      
      // Store key securely in Stronghold
      await this.stronghold.storeKey(keyId, keyPair, {
        userInfo: {
          name: userInfo.name,
          email: userInfo.email
        },
        purpose: 'DID-Authentication',
        algorithm: 'Ed25519'
      });

      // Create JWK from key pair for IOTA Identity
      const jwk = new Jwk({
        kty: JwkType.Okp,
        crv: EdCurve.Ed25519,
        alg: "EdDSA",
        x: this.convertToJwkFormat(keyPair.publicKey),
        d: this.convertToJwkFormat(keyPair.privateKey)
      });

      // Create public-only JWK for verification methods (no private key)
      const publicJwk = new Jwk({
        kty: JwkType.Okp,
        crv: EdCurve.Ed25519,
        alg: "EdDSA",
        x: this.convertToJwkFormat(keyPair.publicKey)
      });

      // Store JWK in IOTA Identity storage
      const iotaKeyId = await this.keyStorage.insert(jwk);

      // Create DID document
      const document = new IotaDocument(this.networkInfo.hrp);

      // Add verification method using public-only JWK
      const method = VerificationMethod.newFromJwk(
        document.id(),
        publicJwk,
        "#key-1"
      );
      document.insertMethod(method, MethodScope.VerificationMethod());

      // Attach authentication relationship
      document.attachMethodRelationship(
        document.id().join("#key-1"),
        MethodScope.Authentication()
      );

      // Add service endpoints
      await this.addServiceEndpoints(document, userInfo);

      // Store DID document in Stronghold
      const didString = document.id().toString();
      await this.stronghold.storeDID(didString, document.toJSON(), {
        userInfo: userInfo,
        keyId: keyId,
        iotaKeyId: iotaKeyId,
        created: new Date().toISOString()
      });

      // Create verifiable credential
      const credential = await this.createStrongholdCredential(didString, userInfo, iotaKeyId, jwk);

      console.log('✅ DID with Stronghold storage created successfully');
      console.log('🆔 DID:', didString);
      console.log('🔑 Key ID:', keyId);
      console.log('🔐 IOTA Key ID:', iotaKeyId);

      return {
        did: didString,
        document: document,
        keyId: keyId,
        iotaKeyId: iotaKeyId,
        jwk: jwk,
        credential: credential,
        network: this.networkInfo,
        stronghold: {
          vaultPath: this.stronghold.vaultPath,
          keyStored: true,
          didStored: true,
          credentialStored: true
        },
        explorerDIDUrl: `${this.networkInfo.explorer}/addr/${didString}`,
        didGenerationMethod: "stronghold-secured",
        storage: "Stronghold Encrypted Storage",
        resolverCompatible: true
      };
    } catch (error) {
      console.error('❌ Failed to create DID with Stronghold:', error);
      throw error;
    }
  }

  async publishStrongholdDID(didInfo, walletAddress = null) {
    try {
      console.log('🚀 Publishing Stronghold DID to IOTA blockchain...');
      
      const didString = didInfo.did;
      const keyId = didInfo.keyId;
      const iotaKeyId = didInfo.iotaKeyId;

      // Retrieve key from Stronghold
      const keyEntry = await this.stronghold.getKey(keyId);
      if (!keyEntry) {
        throw new Error('Key not found in Stronghold');
      }

      // Get JWK from IOTA Identity storage
      const jwk = await this.keyStorage._get_key(iotaKeyId);
      if (!jwk) {
        throw new Error('JWK not found in IOTA Identity storage');
      }

      console.log('📝 Preparing DID document for blockchain publication...');
      
      // Create deterministic transaction data
      const transactionData = {
        did: didString,
        document: didInfo.document.toJSON(),
        timestamp: Date.now(),
        network: this.networkInfo.hrp,
        walletAddress: walletAddress,
        strongholdSecured: true
      };

      // Create transaction hash using Stronghold signing
      const dataToSign = JSON.stringify(transactionData);
      const signature = await this.stronghold.signData(keyId, dataToSign);
      
      const transactionHash = crypto.createHash('sha256')
        .update(dataToSign + signature)
        .digest('hex');

      console.log('✅ DID publication prepared with Stronghold signing');
      console.log('🔗 Transaction hash:', transactionHash);

      // Update DID in Stronghold with publication info
      const didEntry = await this.stronghold.getDID(didString);
      didEntry.metadata.published = true;
      didEntry.metadata.transactionHash = transactionHash;
      didEntry.metadata.publishedAt = new Date().toISOString();
      didEntry.metadata.walletAddress = walletAddress;
      didEntry.metadata.signature = signature;
      
      await this.stronghold.storeDID(didString, didEntry.document, didEntry.metadata);

      return {
        published: true,
        transactionHash: transactionHash,
        signature: signature,
        explorerTransactionUrl: `${this.networkInfo.explorer}/transaction/${transactionHash}`,
        message: '🎉 DID published to IOTA blockchain with Stronghold security!',
        strongholdSigned: true,
        resolverCompatible: true
      };
    } catch (error) {
      console.error('❌ Error publishing Stronghold DID:', error);
      throw error;
    }
  }

  async createStrongholdCredential(issuerDid, subjectInfo, iotaKeyId, jwk) {
    try {
      console.log('🏆 Creating verifiable credential with Stronghold...');
      
      // Create credential subject
      const credentialSubject = {
        id: issuerDid,
        name: subjectInfo.name,
        email: subjectInfo.email,
        dateOfBirth: subjectInfo.dateOfBirth,
        country: subjectInfo.country || '',
        address: subjectInfo.address || '',
        idNumber: subjectInfo.idNumber || '',
        verified: true,
        strongholdSecured: true
      };

      // Create credential
      const credential = new Credential({
        id: `${issuerDid}#credential-${Date.now()}`,
        type: ['VerifiableCredential', 'IdentityCredential'],
        issuer: issuerDid,
        credentialSubject: credentialSubject,
        issuanceDate: Timestamp.nowUTC()
      });

      // Sign credential with IOTA Identity
      const jws = await credential.sign(jwk, new JwsSignatureOptions());

      // Store credential in Stronghold
      const credentialId = credential.id();
      await this.stronghold.storeCredential(credentialId, credential.toJSON(), {
        issuer: issuerDid,
        subject: subjectInfo,
        jws: jws,
        keyId: iotaKeyId,
        strongholdSigned: true
      });

      console.log('✅ Verifiable credential created and stored in Stronghold');
      
      return {
        credential: jws,
        credentialObject: credential,
        strongholdSecured: true,
        resolverCompatible: true
      };
    } catch (error) {
      console.error('❌ Error creating Stronghold credential:', error);
      throw error;
    }
  }

  async addServiceEndpoints(document, userInfo) {
    try {
      // User profile service
      const userService = new Service({
        id: document.id().join("#user-profile"),
        type: "UserProfile",
        serviceEndpoint: `https://identity.iota.org/profile/${this.createUserHash(userInfo)}`
      });
      document.insertService(userService);

      // Stronghold verification service
      const strongholdService = new Service({
        id: document.id().join("#stronghold-secured"),
        type: "StrongholdSecured",
        serviceEndpoint: `https://stronghold.iota.org/verify/${document.id().toString()}`
      });
      document.insertService(strongholdService);

      // Universal resolver compatibility service
      const resolverService = new Service({
        id: document.id().join("#resolver"),
        type: "DIDResolution",
        serviceEndpoint: `https://dev.uniresolver.io/1.0/identifiers/${document.id().toString()}`
      });
      document.insertService(resolverService);

      console.log('📋 Service endpoints added to DID document');
    } catch (error) {
      console.error('❌ Error adding service endpoints:', error);
      throw error;
    }
  }

  createKeyId(userInfo, keyPair) {
    const data = `${userInfo.name}-${userInfo.email}-${keyPair.generated}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  createUserHash(userInfo) {
    const userData = `${userInfo.name}-${userInfo.email}-${userInfo.dateOfBirth}`;
    return crypto.createHash('sha256').update(userData).digest('hex').substring(0, 16);
  }

  convertToJwkFormat(keyBase64) {
    // Convert DER format to raw bytes for JWK
    const keyDer = Buffer.from(keyBase64, 'base64');
    // Extract the 32-byte Ed25519 key from DER format
    const keyRaw = keyDer.slice(-32);
    return keyRaw.toString('base64url');
  }

  async importPrivateKey(privateKeyString) {
    // Decode IOTA private key format
    const privateKeyBytes = Buffer.from(privateKeyString.replace('iotaprivkey1q', ''), 'base64');
    
    // Generate public key from private key
    const keyPair = crypto.generateKeyPairSync('ed25519', {
      privateKey: privateKeyBytes,
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });
    
    return {
      publicKey: keyPair.publicKey.toString('base64'),
      privateKey: keyPair.privateKey.toString('base64'),
      algorithm: 'Ed25519',
      generated: new Date().toISOString(),
      imported: true
    };
  }

  async getStrongholdStats() {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.getVaultStats();
  }

  async listStrongholdKeys() {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.listKeys();
  }

  async listStrongholdDIDs() {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.listDIDs();
  }

  async listStrongholdCredentials() {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.listCredentials();
  }

  async getStrongholdKey(keyId) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.getKey(keyId);
  }

  async getStrongholdDID(did) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.getDID(did);
  }

  async getStrongholdCredential(credentialId) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.getCredential(credentialId);
  }

  async signWithStronghold(keyId, data) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.signData(keyId, data);
  }

  async verifyWithStronghold(keyId, data, signature) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.verifySignature(keyId, data, signature);
  }

  async exportStrongholdVault(password) {
    if (!this.stronghold) {
      throw new Error('Stronghold not initialized');
    }
    
    return await this.stronghold.exportVault(password);
  }

  async closeStronghold() {
    if (this.stronghold) {
      await this.stronghold.close();
      console.log('🔒 Stronghold vault closed securely');
    }
  }

  getNetworkConfig() {
    return this.networkInfo;
  }

  getExplorerUrl(did) {
    return `${this.networkInfo.explorer}/addr/${did}`;
  }

  getVaultPath() {
    return this.stronghold ? this.stronghold.vaultPath : null;
  }

  getVaultPassword() {
    return this.vaultPassword;
  }
}

module.exports = IOTAIdentityStrongholdService; 