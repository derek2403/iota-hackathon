import { useState } from 'react';
import UserRegistrationForm from '../components/UserRegistrationForm';
import DIDDisplay from '../components/DIDDisplay';
import WalletDIDCreation from '../components/WalletDIDCreation';
import RealDIDCreation from '../components/RealDIDCreation';
import StrongholdDIDCreation from '../components/StrongholdDIDCreation';

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [credential, setCredential] = useState(null);
  const [creationMode, setCreationMode] = useState('stronghold'); // Default to Stronghold implementation

  const handleUserRegistration = (userData) => {
    setUserInfo(userData);
  };

  const handleDIDCreated = (didData) => {
    setDidInfo(didData);
    setCredential(didData.credential);
  };

  const handleCreateNewDID = () => {
    setUserInfo(null);
    setDidInfo(null);
    setCredential(null);
  };

  const handleVerifyCredential = async () => {
    if (!credential) return;

    try {
      const response = await fetch('/api/verify-credential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credential.credential }),
      });

      const result = await response.json();
      alert(result.valid ? 'Credential is valid! ✅' : 'Credential is invalid! ❌');
    } catch (error) {
      console.error('Error verifying credential:', error);
      alert('Error verifying credential');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">I</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">IOTA Identity Framework</h1>
                <p className="text-sm text-gray-500">Testnet with Stronghold Security</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Powered by IOTA 2.0 + Stronghold</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Create Your Digital Identity
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
            Build verifiable, decentralized identities on the IOTA network with military-grade Stronghold security
          </p>
        </div>

        {!didInfo ? (
          <div className="space-y-8">
            {!userInfo ? (
              <UserRegistrationForm onUserRegistration={handleUserRegistration} />
            ) : (
              <div className="space-y-6">
                {/* Creation Mode Toggle */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Choose DID Creation Method</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setCreationMode('stronghold')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        creationMode === 'stronghold'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔒 Stronghold Security
                    </button>
                    <button
                      onClick={() => setCreationMode('real')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        creationMode === 'real'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔥 Real Implementation
                    </button>
                    <button
                      onClick={() => setCreationMode('local')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        creationMode === 'local'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📝 Local Creation
                    </button>
                    <button
                      onClick={() => setCreationMode('wallet')}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        creationMode === 'wallet'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🔗 Wallet Integration
                    </button>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    {creationMode === 'stronghold' && (
                      <p>🔒 <strong>Stronghold Security:</strong> Military-grade AES-256-GCM encryption, secure vault storage, cryptographic signing, and data integrity protection</p>
                    )}
                    {creationMode === 'real' && (
                      <p>✅ <strong>Real Implementation:</strong> No simulations, real cryptography, persistent storage, secure key management</p>
                    )}
                    {creationMode === 'local' && (
                      <p>📝 <strong>Local Creation:</strong> Create DID locally with user-based deterministic generation</p>
                    )}
                    {creationMode === 'wallet' && (
                      <p>🔗 <strong>Wallet Integration:</strong> Use connected wallet to sign and publish DID to IOTA testnet</p>
                    )}
                  </div>
                </div>

                {/* DID Creation Components */}
                {creationMode === 'stronghold' && (
                  <StrongholdDIDCreation userInfo={userInfo} onDIDCreated={handleDIDCreated} />
                )}
                {creationMode === 'real' && (
                  <RealDIDCreation userInfo={userInfo} onDIDCreated={handleDIDCreated} />
                )}
                {creationMode === 'wallet' && (
                  <WalletDIDCreation userInfo={userInfo} onDIDCreated={handleDIDCreated} />
                )}
                {creationMode === 'local' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Local DID Creation</h3>
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/create-did', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userInfo }),
                        });
                        const result = await response.json();
                        handleDIDCreated(result);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Local DID
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <DIDDisplay 
            didInfo={didInfo} 
            credential={credential}
            onCreateNewDID={handleCreateNewDID}
            onVerifyCredential={handleVerifyCredential}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                About IOTA Identity
              </h3>
              <p className="mt-4 text-base text-gray-500">
                IOTA Identity enables Self-Sovereign Identity (SSI) through DID and Verifiable Credentials standards on the feeless IOTA network.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Resources
              </h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="https://wiki.iota.org/identity.rs/introduction" className="text-base text-gray-500 hover:text-gray-900">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="https://github.com/iotaledger/identity.rs" className="text-base text-gray-500 hover:text-gray-900">
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a href="https://explorer.iota.org" className="text-base text-gray-500 hover:text-gray-900">
                    IOTA Explorer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Network
              </h3>
              <ul className="mt-4 space-y-4">
                <li className="text-base text-gray-500">
                  Network: IOTA 2.0 Testnet
                </li>
                <li className="text-base text-gray-500">
                  Framework: IOTA Identity v1.6+
                </li>
                <li className="text-base text-gray-500">
                  Standards: W3C DID & VC
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              Built with IOTA Identity Framework. This is a demonstration on testnet.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
