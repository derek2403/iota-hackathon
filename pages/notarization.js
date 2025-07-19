import { useState } from 'react';
import { useAccounts } from '@iota/dapp-kit';

export default function NotarizationPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const accounts = useAccounts();
  const isConnected = accounts.length > 0;

  const handleCreateLocked = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/create-notarization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.notarization);
        console.log('Locked notarization created successfully!', data.notarization);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Error creating locked notarization:', err);
      setError(err.message || 'Failed to create locked notarization');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">IOTA Locked Notarization</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create Locked Notarization</h2>
        <p className="text-gray-600 mb-6">
          This will create a locked notarization on the IOTA testnet via server-side API.
        </p>
        
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800">Please connect your wallet to create a notarization.</p>
          </div>
        )}

        <button
          onClick={handleCreateLocked}
          disabled={isCreating || !isConnected}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            isCreating || !isConnected
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isCreating ? 'Creating Notarization...' : 'Create Locked Notarization'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <h3 className="text-green-800 font-medium mb-4">✅ Notarization Created Successfully!</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID:</span>
              <span className="ml-2 font-mono text-green-700">{result.id}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Method:</span>
              <span className="ml-2 text-green-700">{result.method}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">State Data:</span>
              <span className="ml-2 text-green-700">{result.stateData}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">State Metadata:</span>
              <span className="ml-2 text-green-700">{result.stateMetadata}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Description:</span>
              <span className="ml-2 text-green-700">{result.description}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}