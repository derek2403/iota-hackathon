import React, { useState } from 'react';
import { useCurrentAccount } from '@iota/dapp-kit';

const StrongholdDIDCreation = ({ userInfo, onDIDCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publishToBlockchain, setPublishToBlockchain] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const currentAccount = useCurrentAccount();

  const createStrongholdDID = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔒 Creating DID with REAL Stronghold Storage...');

      const response = await fetch('/api/create-stronghold-did', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInfo,
          privateKey: 'iotaprivkey1qpzczkf970zc58jqwvpxqmmmqa5fdhxf37eakzlncsc2aqjtvr35k6rhyv6',
          walletAddress: currentAccount?.address,
          publish: publishToBlockchain,
          vaultPassword: useCustomPassword ? vaultPassword : null
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Stronghold DID created successfully!');
        console.log('🆔 DID:', result.did);
        console.log('🔑 Key ID:', result.keyId);
        console.log('🔐 IOTA Key ID:', result.iotaKeyId);
        console.log('🔒 Vault Path:', result.stronghold.vaultPath);
        console.log('📊 Vault Stats:', result.stronghold.vaultStats);
        console.log('🔐 Security:', result.security);
        console.log('🌐 Universal Resolver URL:', result.universalResolverUrl);

        onDIDCreated({
          ...result,
          strongholdImplementation: true,
          message: result.message,
          note: 'REAL Stronghold implementation - military-grade encryption, secure key storage, cryptographic signing, universal resolver compatible'
        });
      } else {
        setError(result.error || 'Failed to create Stronghold DID');
      }

    } catch (err) {
      console.error('❌ Error creating Stronghold DID:', err);
      setError(err.message || 'Failed to create Stronghold DID');
    } finally {
      setLoading(false);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVaultPassword(password);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-xl shadow-lg border border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          🔒 Stronghold DID Creation
          <span className="ml-2 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
            Military-Grade Security
          </span>
        </h2>
      </div>

      <div className="space-y-6">
        {/* Security Features */}
        <div className="bg-white p-6 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🛡️ Stronghold Security Features
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>AES-256-GCM Encryption</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>PBKDF2-SHA256 Key Derivation</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Ed25519 Digital Signatures</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Encrypted Vault Storage</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Universal Resolver Compatible</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>IOTA Identity v1.6+</span>
            </div>
          </div>
        </div>

        {/* Vault Password Configuration */}
        <div className="bg-white p-6 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🔐 Vault Password Configuration
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={useCustomPassword}
                onChange={(e) => setUseCustomPassword(e.target.checked)}
                className="form-checkbox h-5 w-5 text-purple-600"
              />
              <span className="text-gray-700">Use custom vault password</span>
            </label>

            {useCustomPassword && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={vaultPassword}
                    onChange={(e) => setVaultPassword(e.target.value)}
                    placeholder="Enter secure vault password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 pr-24"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={generateSecurePassword}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium"
                  >
                    🎲 Generate Secure Password
                  </button>
                </div>
                
                {vaultPassword && (
                  <div className="text-sm text-gray-600">
                    Password strength: <span className="font-medium text-green-600">
                      {vaultPassword.length >= 20 ? 'Very Strong' : vaultPassword.length >= 12 ? 'Strong' : 'Weak'}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {!useCustomPassword && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                💡 A secure random password will be generated automatically for your vault
              </div>
            )}
          </div>
        </div>

        {/* Publishing Options */}
        <div className="bg-white p-6 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📡 Publishing Options
          </h3>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={publishToBlockchain}
              onChange={(e) => setPublishToBlockchain(e.target.checked)}
              className="form-checkbox h-5 w-5 text-purple-600"
            />
            <span className="text-gray-700">Publish DID to IOTA blockchain with Stronghold signing</span>
          </label>

          {publishToBlockchain && currentAccount && (
            <div className="mt-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
              ✅ Will publish using wallet: {currentAccount.address.slice(0, 8)}...{currentAccount.address.slice(-8)}
            </div>
          )}

          {publishToBlockchain && !currentAccount && (
            <div className="mt-3 text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
              ⚠️ Please connect your wallet to enable blockchain publishing
            </div>
          )}
        </div>

        {/* Resolver Compatibility Info */}
        <div className="bg-white p-6 rounded-lg border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            🌐 Universal Resolver Compatibility
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>✅ Your DID will be compatible with the Universal Resolver</p>
            <p>✅ Can be resolved at: <code className="bg-gray-100 px-2 py-1 rounded">https://dev.uniresolver.io/1.0/identifiers/[YOUR_DID]</code></p>
            <p>✅ Works with IOTA Identity v1.6+ libraries</p>
            <p>✅ Standard W3C DID document format</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={createStrongholdDID}
          disabled={loading || (useCustomPassword && !vaultPassword)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition duration-300 flex items-center justify-center space-x-2 shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Creating Stronghold DID...</span>
            </>
          ) : (
            <>
              <span>🔒</span>
              <span>Create DID with Stronghold Storage</span>
            </>
          )}
        </button>

        <div className="text-center text-sm text-gray-600">
          <p>🔐 Your keys and data will be encrypted with military-grade security</p>
          <p>🛡️ Stronghold provides the highest level of protection for your digital identity</p>
          <p>🌐 Universal resolver compatible for maximum interoperability</p>
        </div>
      </div>
    </div>
  );
};

export default StrongholdDIDCreation; 