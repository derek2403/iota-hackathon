import { useRef, forwardRef } from 'react';
import Webcam from 'react-webcam';

const FaceCamera = forwardRef(({ 
  modelsLoaded, 
  loading, 
  storedFaceData, 
  inputFaceData,
  onGenerateProfile, 
  onVerifyWithStored, 
  onVerifyWithInput, 
  onReset 
}, ref) => {
  const videoConstraints = {
    width: 720,
    height: 560,
    facingMode: "user"
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Camera & Controls</h2>
      
      {!modelsLoaded && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Loading advanced face recognition models... This may take a moment.
        </div>
      )}
      
      <div className="text-center mb-6">
        <Webcam
          audio={false}
          ref={ref}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="rounded-lg mx-auto w-full"
        />
      </div>

      <div className="space-y-3">
        <button
          onClick={onGenerateProfile}
          disabled={loading || !modelsLoaded}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Processing...' : '📷 Generate Biometric Profile'}
        </button>
        
        {storedFaceData && (
          <button
            onClick={onVerifyWithStored}
            disabled={loading || !modelsLoaded}
            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
          >
            🔍 Advanced Verification
          </button>
        )}

        <button
          onClick={onVerifyWithInput}
          disabled={loading || !modelsLoaded || !inputFaceData.trim()}
          className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
        >
          🆚 Verify Against Input
        </button>

        <button
          onClick={onReset}
          className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          🔄 Reset All
        </button>
      </div>
    </div>
  );
});

FaceCamera.displayName = 'FaceCamera';

export default FaceCamera; 