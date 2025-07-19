import { useState } from 'react';
import UserRegistrationForm from '../components/UserRegistrationForm';
import DIDDisplay from '../components/DIDDisplay';
import WalletDIDCreation from '../components/WalletDIDCreation';

export default function Home() {
  const [userInfo, setUserInfo] = useState(null);
  const [didInfo, setDidInfo] = useState(null);
  const [credential, setCredential] = useState(null);

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
                <p className="text-sm text-gray-500">Wallet Integration with IOTA Testnet</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Powered by IOTA 2.0 + Wallet</p>
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
            Build verifiable, decentralized identities on the IOTA network using your connected wallet
          </p>
        </div>

        {!didInfo ? (
          <div className="space-y-8">
            {!userInfo ? (
              <UserRegistrationForm onUserRegistration={handleUserRegistration} />
            ) : (
              <div className="space-y-6">
                {/* DID Creation Component */}
                <WalletDIDCreation userInfo={userInfo} onDIDCreated={handleDIDCreated} />
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
                  <a href="https://explorer.iota.org/iota2-testnet" className="text-base text-gray-500 hover:text-gray-900">
                    IOTA Explorer
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Network
              </h3>
              <div className="mt-4 space-y-2 text-sm text-gray-500">
                <p>Network: IOTA 2.0 Testnet</p>
                <p>Framework: IOTA Identity v1.5.1</p>
                <p>Standards: W3C DID & VC</p>
              </div>
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
