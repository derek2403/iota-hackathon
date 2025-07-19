import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { loadFaceModels } from '../utils/faceDetection';
import { processCompleteface } from '../utils/faceProcessing';
import { compareFaces } from '../utils/faceComparison';
import { encodeFaceData, decodeFaceData } from '../utils/dataEncoding';

export default function Scan() {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [storedFaceData, setStoredFaceData] = useState(null);
  const [storedEncodedData, setStoredEncodedData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputFaceData, setInputFaceData] = useState('');

  const videoConstraints = {
    width: 720,
    height: 560,
    facingMode: "user"
  };

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

      const faceData = await processCompleteface(img);
      const encodedData = encodeFaceData(faceData);
      
      setStoredFaceData(faceData);
      setStoredEncodedData(encodedData);
      setVerificationResult(null);

      console.log('Face profile generated with confidence:', faceData.detectionScore);

    } catch (err) {
      setError('Error generating face profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyWithStored = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models not loaded yet');
      return;
    }

    if (!storedFaceData) {
      setError('No stored face profile to verify against. Generate a profile first.');
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

      const currentFaceData = await processCompleteface(img);
      const comparison = compareFaces(storedFaceData, currentFaceData);

      setVerificationResult({
        ...comparison,
        timestamp: new Date().toLocaleString(),
        currentFaceData: encodeFaceData(currentFaceData)
      });

      console.log('Advanced face verification completed:', comparison);

    } catch (err) {
      setError('Error during verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyWithInput = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models not loaded yet');
      return;
    }

    if (!inputFaceData.trim()) {
      setError('Please enter encoded face data');
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
      const storedData = decodeFaceData(inputFaceData.trim());

      const img = document.createElement('img');
      img.src = imageSrc;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      const currentFaceData = await processCompleteface(img);
      const comparison = compareFaces(storedData, currentFaceData);

      setVerificationResult({
        ...comparison,
        timestamp: new Date().toLocaleString(),
        currentFaceData: encodeFaceData(currentFaceData),
        inputMode: true
      });

    } catch (err) {
      setError('Error during verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStoredFaceData(null);
    setStoredEncodedData('');
    setVerificationResult(null);
    setError('');
    setInputFaceData('');
  };

  // ... rest of the JSX remains the same as before ...
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">Advanced Face Verification System</h1>
        <p className="text-center text-gray-600 mb-8">
          Multi-factor biometric verification using facial geometry, landmarks, and neural features
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
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
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="rounded-lg mx-auto w-full"
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={generateFaceProfile}
                disabled={loading || !modelsLoaded}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Processing...' : '📷 Generate Biometric Profile'}
              </button>
              
              {storedFaceData && (
                <button
                  onClick={verifyWithStored}
                  disabled={loading || !modelsLoaded}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
                >
                  🔍 Advanced Verification
                </button>
              )}

              <button
                onClick={verifyWithInput}
                disabled={loading || !modelsLoaded || !inputFaceData.trim()}
                className="w-full bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
              >
                🆚 Verify Against Input
              </button>

              <button
                onClick={reset}
                className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                🔄 Reset All
              </button>
            </div>
          </div>

          {/* Results Section */}
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
                onChange={(e) => setInputFaceData(e.target.value)}
                placeholder="Paste base64-encoded complete face data here..."
                className="w-full p-2 border rounded text-xs font-mono h-16 mb-2"
              />
              <p className="text-xs text-gray-500">
                Paste complete biometric face data for advanced multi-factor verification.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-3">🔬 Multi-Factor Verification System</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <h4 className="font-semibold mb-1">Neural Features (40%)</h4>
              <p>128D deep learning face descriptors trained on millions of faces</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-semibold mb-1">Face Geometry (25%)</h4>
              <p>Unique facial proportions and ratios that remain stable across photos</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <h4 className="font-semibold mb-1">Biometric Features (20%)</h4>
              <p>Eye shapes, nose ratios, mouth characteristics, and facial asymmetry</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <h4 className="font-semibold mb-1">Landmark Analysis (15%)</h4>
              <p>68-point facial landmark alignment and positioning verification</p>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Decision Making:</strong> Requires 2+ critical matches AND overall confidence {'>'} 75% AND gender consistency</p>
          </div>
        </div>
      </div>
    </div>
  );
}