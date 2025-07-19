import { useState } from 'react';
import Head from 'next/head';

export default function NFT() {
  const [operation, setOperation] = useState('mint');
  const [userAddress, setUserAddress] = useState('');
  const [nftName, setNftName] = useState('My Sponsored NFT');
  const [nftDescription, setNftDescription] = useState('An awesome NFT minted with gas station sponsorship');
  const [nftUrl, setNftUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400');
  const [nftObjectId, setNftObjectId] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Sample user address for testing
  const sampleAddress = '0xbe44bbcb5e7ab07670d2dbef90eda4ab73a9e0550facf22c329d90f4dc1ac0d7';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const requestBody = {
        userAddress: userAddress || sampleAddress,
        operation,
        nftName,
        nftDescription,
        nftUrl,
      };

      // Add operation-specific fields
      if (operation === 'transfer') {
        requestBody.nftObjectId = nftObjectId;
        requestBody.recipientAddress = recipientAddress;
      } else if (operation === 'update') {
        requestBody.nftObjectId = nftObjectId;
        requestBody.newDescription = newDescription;
      } else if (operation === 'burn') {
        requestBody.nftObjectId = nftObjectId;
      }

      const response = await fetch('/api/nft-sponsored', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to execute NFT operation');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const useSampleAddress = () => {
    setUserAddress(sampleAddress);
  };

  const useSampleNftObjectId = () => {
    setNftObjectId('0x1234567890abcdef1234567890abcdef12345678');
  };

  const operationColors = {
    mint: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    transfer: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    update: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    burn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  };

  const operationEmojis = {
    mint: '🎨',
    transfer: '📤',
    update: '✏️',
    burn: '🔥'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Sponsored NFT Operations - IOTA Gas Station</title>
        <meta name="description" content="Create, transfer, update and burn NFTs using IOTA Gas Station sponsorship" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:p-8 p-6">
          <div className="uppercase tracking-wide text-sm text-cyan-500 font-semibold mb-1">
            IOTA Gas Station Demo
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            Sponsored NFT Operations
          </h1>
          <p className="mt-2 text-gray-500">
            Create, transfer, update, and burn NFTs without paying gas fees! All operations are sponsored by the gas station.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Operation Selection */}
            <div className="mb-4">
              <label htmlFor="operation" className="block text-sm font-medium text-gray-700 mb-2">
                Choose NFT Operation:
              </label>
              <select
                id="operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="mint">🎨 Mint New NFT</option>
                <option value="transfer">📤 Transfer NFT</option>
                <option value="update">✏️ Update NFT Description</option>
                <option value="burn">🔥 Burn NFT</option>
              </select>
            </div>

            {/* User Address Input */}
            <div className="mb-4">
              <label htmlFor="userAddress" className="block text-sm font-medium text-gray-700 mb-2">
                User Address:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="userAddress"
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  placeholder="Enter IOTA address or use sample"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                />
                <button
                  type="button"
                  onClick={useSampleAddress}
                  className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Use Sample
                </button>
              </div>
            </div>

            {/* Mint-specific fields */}
            {operation === 'mint' && (
              <>
                <div className="mb-4">
                  <label htmlFor="nftName" className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Name:
                  </label>
                  <input
                    type="text"
                    id="nftName"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="nftDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Description:
                  </label>
                  <textarea
                    id="nftDescription"
                    value={nftDescription}
                    onChange={(e) => setNftDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="nftUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Image URL:
                  </label>
                  <input
                    type="url"
                    id="nftUrl"
                    value={nftUrl}
                    onChange={(e) => setNftUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Transfer-specific fields */}
            {operation === 'transfer' && (
              <>
                <div className="mb-4">
                  <label htmlFor="nftObjectId" className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Object ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="nftObjectId"
                      value={nftObjectId}
                      onChange={(e) => setNftObjectId(e.target.value)}
                      placeholder="Enter NFT object ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={useSampleNftObjectId}
                      className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Sample
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="recipientAddress" className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address:
                  </label>
                  <input
                    type="text"
                    id="recipientAddress"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter recipient IOTA address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Update-specific fields */}
            {operation === 'update' && (
              <>
                <div className="mb-4">
                  <label htmlFor="nftObjectId" className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Object ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="nftObjectId"
                      value={nftObjectId}
                      onChange={(e) => setNftObjectId(e.target.value)}
                      placeholder="Enter NFT object ID"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={useSampleNftObjectId}
                      className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Sample
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="newDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    New Description:
                  </label>
                  <textarea
                    id="newDescription"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Enter new description for the NFT"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {/* Burn-specific fields */}
            {operation === 'burn' && (
              <div className="mb-4">
                <label htmlFor="nftObjectId" className="block text-sm font-medium text-gray-700 mb-2">
                  NFT Object ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="nftObjectId"
                    value={nftObjectId}
                    onChange={(e) => setNftObjectId(e.target.value)}
                    placeholder="Enter NFT object ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={useSampleNftObjectId}
                    className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Sample
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : operationColors[operation] + ' focus:outline-none focus:ring-2 focus:ring-offset-2'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                `${operationEmojis[operation]} ${operation.charAt(0).toUpperCase() + operation.slice(1)} NFT (Gas Station Sponsored)`
              )}
            </button>
          </form>

          {/* Results */}
          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Success! NFT Operation Completed
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>{result.message}</strong></p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p><strong>🔧 Operation:</strong> {result.operation}</p>
                      <p><strong>👤 User Address:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.userAddress}</code></p>
                      <p><strong>🔗 Transaction ID:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.transactionId}</code></p>
                      <p><strong>💰 Sponsor Account:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.sponsorAccount}</code></p>
                      <p><strong>🎫 Reservation ID:</strong> {result.reservationId}</p>
                      {result.details?.nftDetails && (
                        <>
                          <p><strong>🎨 NFT Name:</strong> {result.details.nftDetails.name}</p>
                          <p><strong>📝 Description:</strong> {result.details.nftDetails.description}</p>
                          {result.details.nftDetails.url && (
                            <p><strong>🖼️ Image URL:</strong> <a href={result.details.nftDetails.url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">View Image</a></p>
                          )}
                          {result.details.nftDetails.objectId && (
                            <p><strong>🆔 NFT Object ID:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.details.nftDetails.objectId}</code></p>
                          )}
                          {result.details.nftDetails.recipientAddress && (
                            <p><strong>📤 Recipient:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.details.nftDetails.recipientAddress}</code></p>
                          )}
                        </>
                      )}
                      {result.transactionEffects && (
                        <>
                          <p><strong>⚡ Status:</strong> <span className="text-green-700">{result.transactionEffects.status.status}</span></p>
                          <p><strong>⛽ Gas Used:</strong> {JSON.stringify(result.transactionEffects.gasUsed)}</p>
                          <p><strong>📊 Objects Created:</strong> {result.transactionEffects.created}</p>
                          <p><strong>📝 Objects Mutated:</strong> {result.transactionEffects.mutated}</p>
                        </>
                      )}
                      {result.details?.realBlockchainTransaction && (
                        <p className="font-bold text-green-800">🚀 REAL BLOCKCHAIN TRANSACTION EXECUTED!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('YOUR_DEPLOYED_NFT_PACKAGE_ID_HERE') && (
                      <p className="mt-2 font-bold">
                        ⚠️ You need to deploy the NFT contract first and update the package ID in the API!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Setup Instructions
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Deploy the NFT smart contract: <code className="bg-blue-100 px-1 rounded">iota client publish sources/nft</code></li>
                    <li>Copy the package ID from deployment output</li>
                    <li>Update the package ID in <code className="bg-blue-100 px-1 rounded">pages/api/nft-sponsored.js</code></li>
                    <li>Test the sponsored NFT operations!</li>
                  </ol>
                  <div className="mt-3 p-2 bg-blue-100 rounded">
                    <p className="font-medium">Available Operations:</p>
                    <ul className="mt-1 space-y-1">
                      <li>🎨 <strong>Mint:</strong> Create new NFTs for free</li>
                      <li>📤 <strong>Transfer:</strong> Send NFTs to other addresses</li>
                      <li>✏️ <strong>Update:</strong> Modify NFT descriptions</li>
                      <li>🔥 <strong>Burn:</strong> Permanently delete NFTs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
