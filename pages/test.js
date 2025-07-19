import { useState } from 'react';
import Head from 'next/head';

export default function Test() {
  const [subscriptionType, setSubscriptionType] = useState('Music');
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Sample user address for testing (you can replace with actual wallet integration)
  const sampleAddress = '0xbe44bbcb5e7ab07670d2dbef90eda4ab73a9e0550facf22c329d90f4dc1ac0d7';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/gas-station-trial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionType,
          userAddress: userAddress || sampleAddress
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to execute transaction');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Gas Station Test - Sponsored Transactions</title>
        <meta name="description" content="Test gas station sponsored transactions for media platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:p-8 p-6">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">
            IOTA Gas Station Demo
          </div>
          <h1 className="block mt-1 text-lg leading-tight font-medium text-black">
            Media Platform - Free Trial (Sponsored Transaction)
          </h1>
          <p className="mt-2 text-gray-500">
            Test the gas station sponsored transaction system. Users can get free trials without paying gas fees!
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            {/* Subscription Type Selection */}
            <div className="mb-4">
              <label htmlFor="subscriptionType" className="block text-sm font-medium text-gray-700 mb-2">
                Choose Subscription Type:
              </label>
              <select
                id="subscriptionType"
                value={subscriptionType}
                onChange={(e) => setSubscriptionType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Music">🎵 Music</option>
                <option value="Movies">🎬 Movies</option>
                <option value="News">📰 News</option>
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={useSampleAddress}
                  className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Use Sample
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use sample address for testing
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
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
                '🚀 Activate Free Trial (Gas Station Sponsored)'
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
                    Success! Free Trial Activated
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p><strong>{result.message}</strong></p>
                    <div className="mt-3 space-y-1 text-xs">
                      <p><strong>📦 Subscription:</strong> {result.subscriptionType}</p>
                      <p><strong>👤 User Address:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.userAddress}</code></p>
                      <p><strong>🔗 Transaction ID:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.transactionId}</code></p>
                      <p><strong>💰 Sponsor Account:</strong> <code className="text-xs bg-green-100 px-1 rounded">{result.sponsorAccount}</code></p>
                      <p><strong>🎫 Reservation ID:</strong> {result.reservationId}</p>
                      {result.transactionEffects && (
                        <>
                          <p><strong>⚡ Status:</strong> <span className="text-green-700">{result.transactionEffects.status.status}</span></p>
                          <p><strong>⛽ Gas Used:</strong> {JSON.stringify(result.transactionEffects.gasUsed)}</p>
                          <p><strong>📊 Objects Created:</strong> {result.transactionEffects.created}</p>
                          <p><strong>📝 Objects Mutated:</strong> {result.transactionEffects.mutated}</p>
                          <p><strong>🔗 TX Digest:</strong> <code className="text-xs bg-green-100 px-1 rounded break-all">{result.transactionEffects.digest}</code></p>
                        </>
                      )}
                      {result.details?.realBlockchainTransaction && (
                        <p className="font-bold text-green-800">🚀 REAL BLOCKCHAIN TRANSACTION EXECUTED!</p>
                      )}
                      {result.details?.sponsorPattern && (
                        <p className="text-green-600 text-xs mt-2">🎯 Pattern: {result.details.sponsorPattern}</p>
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
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  How it works
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Gas Station reserves gas coins for sponsored transactions</li>
                    <li>User triggers free trial without paying gas fees</li>
                    <li>Smart contract adds user to trial subscription list</li>
                    <li>Gas Station covers all transaction costs</li>
                    <li>User gets instant access to content!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
