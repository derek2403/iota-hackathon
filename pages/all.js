import { useState } from 'react';
import { initializeSystem as initializeNFTSystem, showCurrentTokens as showNFTTokens, mintNFT, showMyNFTs, slashToken } from '../utils/buyNFT';
import { initializeSystem as initializeTokenSystem, mintAttendanceToken, mintMultipleTokens, showCurrentTokens as showAttendanceTokens } from '../utils/mint-token';

export default function AllOperations() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOperation = async (operation, ...args) => {
    setLoading(true);
    setStatus('Processing...');
    try {
      // Initialize based on operation type
      const { adminAddress } = operation === mintNFT || operation === showMyNFTs || operation === slashToken
        ? await initializeNFTSystem()
        : await initializeTokenSystem();
        
      const result = await operation(...(args.length > 0 ? args : [adminAddress]));
      setStatus('Operation completed successfully!');
      console.log('Operation result:', result);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('Operation failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Token and NFT Management</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Attendance Token Operations</h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleOperation(showAttendanceTokens)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Show Current Attendance Tokens
            </button>

            <button
              onClick={() => handleOperation(mintAttendanceToken)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              disabled={loading}
            >
              Mint Single Attendance Token
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">NFT Operations</h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => handleOperation(showMyNFTs)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              Show My NFTs
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Token Conversion</h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={async () => {
                const tokens = await showAttendanceTokens();
                if (tokens.length > 0) {
                  await handleOperation(slashToken, tokens[0].data.objectId);
                } else {
                  setStatus('No tokens available to convert');
                }
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
              disabled={loading}
            >
              Convert Token to NFT
            </button>
          </div>
        </div>

        {status && (
          <div className={`mt-4 p-4 rounded ${
            status.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
