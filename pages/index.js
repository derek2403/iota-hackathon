import { useState } from 'react';
import UserRegistrationForm from '../components/UserRegistrationForm';
import RegistrationFaceScanner from '../components/RegistrationFaceScanner';
import DIDDisplay from '../components/DIDDisplay';
import WalletDIDCreation from '../components/WalletDIDCreation';
import RealDIDCreation from '../components/RealDIDCreation';
import StrongholdDIDCreation from '../components/StrongholdDIDCreation';

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [biometricData, setBiometricData] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [credential, setCredential] = useState(null);
  const [creationMode, setCreationMode] = useState('stronghold'); // Default to Stronghold implementation
  const [showFaceScanner, setShowFaceScanner] = useState(false);

  const handleUserRegistration = (userData) => {
    setUserInfo(userData);
    setShowFaceScanner(true); // Show face scanner after registration
  };

  const handleFaceScanComplete = (faceData) => {
    setBiometricData(faceData);
    setShowFaceScanner(false);
    console.log('Biometric data captured and stored:', faceData);
  };

  const handleSkipFaceScan = () => {
    setShowFaceScanner(false);
    setBiometricData(null);
    console.log('Face scan skipped by user');
  };

  const handleDIDCreated = (didData) => {
    // Include biometric data in DID creation if available
    const enhancedDidData = {
      ...didData,
      biometricData: biometricData,
      hasBiometricVerification: !!biometricData
    };
    
    setDidInfo(enhancedDidData);
    setCredential(enhancedDidData.credential);
  };

  const handleCreateNewDID = () => {
    setUserInfo(null);
    setBiometricData(null);
    setDidInfo(null);
    setCredential(null);
    setShowFaceScanner(false);
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
            ) : showFaceScanner ? (
              <RegistrationFaceScanner 
                userInfo={userInfo}
                onFaceScanComplete={handleFaceScanComplete}
                onSkip={handleSkipFaceScan}
              />
            ) : (
              <div className="space-y-6">
                {/* Show biometric status */}
                {biometricData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-green-800 font-medium">
                        ✅ Biometric verification enabled (Confidence: {Math.round(biometricData.detectionScore * 100)}%)
                      </span>
                    </div>
                  </div>
                )}

                {!biometricData && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="text-yellow-800 font-medium">
                        ⚠️ Biometric verification skipped - Consider adding for enhanced security
                      </span>
                      <button
                        onClick={() => setShowFaceScanner(true)}
                        className="ml-4 text-sm bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded"
                      >
                        Add Now
                      </button>
                    </div>
                  </div>
                )}

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
                          body: JSON.stringify({ 
                            userInfo,
                            biometricData: biometricData 
                          }),
                        });
                        const result = await response.json();
                        handleDIDCreated(result);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Local DID {biometricData ? 'with Biometric Security' : ''}
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
