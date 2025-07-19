import React from 'react';

const VerificationResults = ({ 
  loading, 
  error, 
  storedEncodedData, 
  verificationResult, 
  inputFaceData, 
  onInputFaceDataChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Verification Results</h2>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Performing advanced facial analysis...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {storedEncodedData && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
          <h3 className="font-bold mb-2">✅ Biometric Profile Generated</h3>
          <p className="text-sm text-gray-600 mb-2">Complete Face Data (Base64):</p>
          <textarea
            value={storedEncodedData}
            readOnly
            className="w-full p-2 border rounded text-xs font-mono h-20 bg-white"
          />
        </div>
      )}

      {verificationResult && (
        <div className={`border-2 px-4 py-4 rounded-lg mb-4 ${
          verificationResult.overallMatch 
            ? 'bg-green-100 border-green-500 text-green-800'
            : 'bg-red-100 border-red-500 text-red-800'
        }`}>
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">
              {verificationResult.overallMatch ? '✅' : '❌'}
            </div>
            <div className="text-2xl font-bold mb-2">
              {verificationResult.overallMatch ? 'SAME PERSON' : 'DIFFERENT PERSON'}
            </div>
            <div className="text-lg">
              Overall Confidence: {verificationResult.confidence}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p><strong>Neural Features:</strong> {verificationResult.descriptorMatch ? '✅' : '❌'} ({verificationResult.details.descriptorSimilarity}%)</p>
              <p><strong>Face Geometry:</strong> {verificationResult.geometryMatch ? '✅' : '❌'} ({verificationResult.details.geometryScore}%)</p>
            </div>
            <div>
              <p><strong>Biometric Features:</strong> {verificationResult.biometricMatch ? '✅' : '❌'} ({verificationResult.details.biometricScore}%)</p>
              <p><strong>Landmark Alignment:</strong> {verificationResult.landmarkMatch ? '✅' : '❌'} ({verificationResult.details.landmarkScore}%)</p>
            </div>
          </div>

          <div className="text-xs bg-white bg-opacity-50 p-2 rounded">
            <p><strong>Age Difference:</strong> {verificationResult.details.ageDifference} years</p>
            <p><strong>Gender Match:</strong> {verificationResult.details.genderMatch ? 'Yes' : 'No'}</p>
            <p><strong>Neural Distance:</strong> {verificationResult.details.descriptorDistance}</p>
            <p><strong>Timestamp:</strong> {verificationResult.timestamp}</p>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="border-t pt-4">
        <h3 className="font-bold mb-2">Verify Against External Data:</h3>
        <textarea
          value={inputFaceData}
          onChange={(e) => onInputFaceDataChange(e.target.value)}
          placeholder="Paste base64-encoded complete face data here..."
          className="w-full p-2 border rounded text-xs font-mono h-16 mb-2"
        />
        <p className="text-xs text-gray-500">
          Paste complete biometric face data for advanced multi-factor verification.
        </p>
      </div>
    </div>
  );
};

export default VerificationResults; 