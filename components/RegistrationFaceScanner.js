import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { loadFaceModels } from '../utils/faceDetection';
import { processCompleteface } from '../utils/faceProcessing';
import { encodeFaceData } from '../utils/dataEncoding';
import FaceCamera from './FaceCamera';

const RegistrationFaceScanner = ({ userInfo, onFaceScanComplete, onSkip }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceData, setFaceData] = useState(null);
  const [encodedData, setEncodedData] = useState('');
  const [scanCompleted, setScanCompleted] = useState(false);

  useEffect(() => {
    initializeModels();
  }, []);

  const initializeModels = async () => {
    try {
      setError('Loading face recognition models...');
      await loadFaceModels();
      setModelsLoaded(true);
      setError('');
    } catch (error) {
      console.error('Error loading models:', error);
      setError(error.message);
    }
  };

  const generateFaceProfile = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models not loaded yet');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const img = document.createElement('img');
      img.src = imageSrc;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      const faceDataResult = await processCompleteface(img);
      const encodedDataResult = encodeFaceData(faceDataResult);
      
      setFaceData(faceDataResult);
      setEncodedData(encodedDataResult);
      setScanCompleted(true);

      // Store in localStorage
      const biometricData = {
        userInfo,
        faceData: encodedDataResult,
        timestamp: new Date().toISOString(),
        detectionScore: faceDataResult.detectionScore
      };

      localStorage.setItem('userBiometricData', JSON.stringify(biometricData));
      localStorage.setItem(`biometric_${userInfo.email}`, JSON.stringify(biometricData));

      console.log('Face profile generated and stored with confidence:', faceDataResult.detectionScore);

    } catch (err) {
      setError('Error generating face profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (faceData && encodedData) {
      onFaceScanComplete({
        faceData: encodedData,
        detectionScore: faceData.detectionScore,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleRetake = () => {
    setFaceData(null);
    setEncodedData('');
    setScanCompleted(false);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Secure Your Identity with Biometric Verification
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Scan your face to create a secure biometric profile that will be linked to your digital identity. 
          This adds an extra layer of security and helps verify your identity in the future.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">📷 Biometric Capture</h3>
          
          {!modelsLoaded && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              Loading face recognition models... This may take a moment.
            </div>
          )}
          
          <div className="text-center mb-6">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 720,
                height: 560,
                facingMode: "user"
              }}
              className="rounded-lg mx-auto w-full"
            />
          </div>

          <div className="space-y-3">
            {!scanCompleted ? (
              <button
                onClick={generateFaceProfile}
                disabled={loading || !modelsLoaded}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : '📷 Capture Biometric Profile'}
              </button>
            ) : (
              <button
                onClick={handleRetake}
                className="w-full bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded"
              >
                🔄 Retake Photo
              </button>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">🔐 Security Profile</h3>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Processing biometric data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {scanCompleted && faceData && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h4 className="font-bold text-green-800">Biometric Profile Created Successfully!</h4>
                </div>
                <p className="text-sm text-green-700">
                  Detection Confidence: {Math.round(faceData.detectionScore * 100)}%
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <h4 className="font-bold mb-2">🔒 Security Features</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ Neural network face descriptors</li>
                  <li>✅ Facial geometry analysis</li>
                  <li>✅ Biometric landmark detection</li>
                  <li>✅ Encrypted local storage</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                <h4 className="font-bold mb-2">📊 Technical Details</h4>
                <p className="text-xs text-gray-600 mb-2">Biometric Hash Preview:</p>
                <div className="text-xs font-mono bg-white p-2 rounded border max-h-20 overflow-y-auto">
                  {encodedData.substring(0, 200)}...
                </div>
              </div>
            </div>
          )}

          {!scanCompleted && !loading && !error && (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <p className="text-gray-500">
                Position your face in the camera frame and click "Capture Biometric Profile" to continue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        {scanCompleted ? (
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150"
          >
            ✅ Continue with Biometric Security
          </button>
        ) : null}
        
        <button
          onClick={onSkip}
          className="px-8 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition duration-150"
        >
          Skip Biometric Scan
        </button>
      </div>

      {/* Information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-800 mb-2">🛡️ Privacy & Security</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your biometric data is processed locally and stored securely</li>
          <li>• No facial images are saved, only mathematical descriptors</li>
          <li>• Data is encrypted and linked to your identity on the blockchain</li>
          <li>• You can delete this data at any time</li>
        </ul>
      </div>
    </div>
  );
};

export default RegistrationFaceScanner; 