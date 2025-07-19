import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

export default function Scan() {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [storedDescriptor, setStoredDescriptor] = useState(null);
  const [storedEncodedDescriptor, setStoredEncodedDescriptor] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputDescriptor, setInputDescriptor] = useState('');

  // Configurable thresholds for face verification
  const VERIFICATION_THRESHOLDS = {
    STRICT: 0.4,      // Very strict - minimizes false positives
    NORMAL: 0.6,      // Standard threshold - good balance
    LENIENT: 0.7      // More lenient - minimizes false negatives
  };

  const [selectedThreshold, setSelectedThreshold] = useState('NORMAL');

  const videoConstraints = {
    width: 720,
    height: 560,
    facingMode: "user"
  };

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setError('Loading face recognition models...');
      
      await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
      
      setModelsLoaded(true);
      setError('');
      console.log('✅ Face recognition models loaded');
    } catch (error) {
      console.error('Error loading models:', error);
      setError('Failed to load face recognition models. Please refresh and try again.');
    }
  };

  const encodeDescriptor = (descriptor) => {
    const descriptorArray = Array.from(descriptor);
    const jsonString = JSON.stringify(descriptorArray);
    return btoa(jsonString);
  };

  const decodeDescriptor = (encodedDescriptor) => {
    try {
      const jsonString = atob(encodedDescriptor);
      const descriptorArray = JSON.parse(jsonString);
      return new Float32Array(descriptorArray);
    } catch (error) {
      throw new Error('Invalid encoded descriptor');
    }
  };

  const calculateDistance = (descriptor1, descriptor2) => {
    if (descriptor1.length !== descriptor2.length) {
      throw new Error('Descriptors must have the same length');
    }
    
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      const diff = descriptor1[i] - descriptor2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  };

  // Face verification function - returns definitive same/different person result
  const verifyFaces = (descriptor1, descriptor2, threshold = 'NORMAL') => {
    const distance = calculateDistance(descriptor1, descriptor2);
    const thresholdValue = VERIFICATION_THRESHOLDS[threshold];
    const isSamePerson = distance < thresholdValue;
    
    // Calculate confidence based on how far from threshold
    let confidence;
    if (isSamePerson) {
      // Same person - confidence increases as distance decreases
      confidence = Math.min(99, Math.max(60, 100 - (distance / thresholdValue) * 40));
    } else {
      // Different person - confidence increases as distance increases
      const excessDistance = distance - thresholdValue;
      confidence = Math.min(99, Math.max(60, 60 + (excessDistance / thresholdValue) * 39));
    }

    return {
      isSamePerson,
      distance: Math.round(distance * 1000) / 1000,
      threshold: thresholdValue,
      confidence: Math.round(confidence),
      decision: isSamePerson ? 'SAME PERSON' : 'DIFFERENT PERSON',
      reliability: getReliabilityLevel(distance, thresholdValue)
    };
  };

  const getReliabilityLevel = (distance, threshold) => {
    const margin = Math.abs(distance - threshold);
    if (margin > threshold * 0.3) return 'HIGH';
    if (margin > threshold * 0.15) return 'MEDIUM';
    return 'LOW';
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

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected. Please ensure your face is clearly visible and well-lit.');
        return;
      }

      if (detection.detection.score < 0.7) {
        setError('Face detection confidence too low. Please improve lighting and try again.');
        return;
      }

      const descriptor = detection.descriptor;
      const encodedDescriptor = encodeDescriptor(descriptor);
      
      setStoredDescriptor(descriptor);
      setStoredEncodedDescriptor(encodedDescriptor);
      setVerificationResult(null);

      console.log('Face profile generated with confidence:', detection.detection.score);

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

    if (!storedDescriptor) {
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

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected in verification image. Please ensure your face is clearly visible.');
        return;
      }

      if (detection.detection.score < 0.7) {
        setError('Face detection confidence too low for verification. Please improve lighting.');
        return;
      }

      // Perform face verification
      const currentDescriptor = detection.descriptor;
      const verification = verifyFaces(storedDescriptor, currentDescriptor, selectedThreshold);

      setVerificationResult({
        ...verification,
        detectionConfidence: Math.round(detection.detection.score * 100) / 100,
        currentDescriptor: encodeDescriptor(currentDescriptor),
        timestamp: new Date().toLocaleString(),
        thresholdUsed: selectedThreshold
      });

      console.log('Verification completed:', verification);

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

    if (!inputDescriptor.trim()) {
      setError('Please enter an encoded face descriptor');
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
      const storedDesc = decodeDescriptor(inputDescriptor.trim());

      const img = document.createElement('img');
      img.src = imageSrc;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setError('No face detected in current image. Please ensure your face is clearly visible.');
        return;
      }

      if (detection.detection.score < 0.7) {
        setError('Face detection confidence too low for verification. Please improve lighting.');
        return;
      }

      // Perform face verification
      const currentDescriptor = detection.descriptor;
      const verification = verifyFaces(storedDesc, currentDescriptor, selectedThreshold);

      setVerificationResult({
        ...verification,
        detectionConfidence: Math.round(detection.detection.score * 100) / 100,
        currentDescriptor: encodeDescriptor(currentDescriptor),
        timestamp: new Date().toLocaleString(),
        thresholdUsed: selectedThreshold,
        inputMode: true
      });

    } catch (err) {
      setError('Error during verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStoredDescriptor(null);
    setStoredEncodedDescriptor('');
    setVerificationResult(null);
    setError('');
    setInputDescriptor('');
  };

  const getResultColor = (isSamePerson, reliability) => {
    if (isSamePerson) {
      return reliability === 'HIGH' ? 'bg-green-100 border-green-500 text-green-800' :
             reliability === 'MEDIUM' ? 'bg-green-50 border-green-400 text-green-700' :
             'bg-yellow-100 border-yellow-500 text-yellow-800';
    } else {
      return reliability === 'HIGH' ? 'bg-red-100 border-red-500 text-red-800' :
             reliability === 'MEDIUM' ? 'bg-red-50 border-red-400 text-red-700' :
             'bg-orange-100 border-orange-500 text-orange-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-4">Face Verification System</h1>
        <p className="text-center text-gray-600 mb-8">
          Definitive same person / different person verification using AI
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Camera & Controls</h2>
            
            {!modelsLoaded && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                Loading face recognition models... This may take a moment.
              </div>
            )}

            {/* Threshold Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Verification Sensitivity:</label>
              <select
                value={selectedThreshold}
                onChange={(e) => setSelectedThreshold(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="STRICT">Strict (Distance {`<`} 0.4) - Minimizes false matches</option>
                <option value="NORMAL">Normal (Distance {`<`} 0.6) - Balanced accuracy</option>
                <option value="LENIENT">Lenient (Distance {`<`} 0.7) - Minimizes missed matches</option>
              </select>
            </div>
            
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
                {loading ? 'Processing...' : '📷 Generate Reference Profile'}
              </button>
              
              {storedDescriptor && (
                <button
                  onClick={verifyWithStored}
                  disabled={loading || !modelsLoaded}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
                >
                  🔍 Verify Against Reference
                </button>
              )}

              <button
                onClick={verifyWithInput}
                disabled={loading || !modelsLoaded || !inputDescriptor.trim()}
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
                <p className="mt-2 text-gray-600">Analyzing faces with AI...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {storedEncodedDescriptor && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                <h3 className="font-bold mb-2">✅ Reference Profile Generated</h3>
                <p className="text-sm text-gray-600 mb-2">Face Descriptor (Base64):</p>
                <textarea
                  value={storedEncodedDescriptor}
                  readOnly
                  className="w-full p-2 border rounded text-xs font-mono h-20 bg-white"
                />
              </div>
            )}

            {verificationResult && (
              <div className={`border-2 px-4 py-4 rounded-lg mb-4 ${getResultColor(verificationResult.isSamePerson, verificationResult.reliability)}`}>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">
                    {verificationResult.isSamePerson ? '✅' : '❌'}
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {verificationResult.decision}
                  </div>
                  <div className="text-lg">
                    Confidence: {verificationResult.confidence}%
                  </div>
                  <div className="text-sm font-medium">
                    Reliability: {verificationResult.reliability}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Face Distance:</strong> {verificationResult.distance}</p>
                    <p><strong>Threshold Used:</strong> {verificationResult.threshold}</p>
                  </div>
                  <div>
                    <p><strong>Detection Quality:</strong> {verificationResult.detectionConfidence}</p>
                    <p><strong>Sensitivity:</strong> {verificationResult.thresholdUsed}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  <p><strong>Timestamp:</strong> {verificationResult.timestamp}</p>
                  <p><strong>Technical:</strong> {verificationResult.isSamePerson ? 
                    `Distance ${verificationResult.distance} < ${verificationResult.threshold} (Same Person)` :
                    `Distance ${verificationResult.distance} ≥ ${verificationResult.threshold} (Different Person)`}
                  </p>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="border-t pt-4">
              <h3 className="font-bold mb-2">Verify Against External Descriptor:</h3>
              <textarea
                value={inputDescriptor}
                onChange={(e) => setInputDescriptor(e.target.value)}
                placeholder="Paste base64-encoded face descriptor here..."
                className="w-full p-2 border rounded text-xs font-mono h-16 mb-2"
              />
              <p className="text-xs text-gray-500">
                Paste someone's face descriptor to verify if your current face matches their identity.
              </p>
            </div>
          </div>
        </div>

        {/* Decision Matrix */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-3">🎯 Verification Decision Matrix</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h4 className="font-semibold text-green-800 mb-2">✅ SAME PERSON</h4>
              <p className="text-sm text-green-700">
                Face distance below threshold. High confidence that both images show the same individual.
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h4 className="font-semibold text-red-800 mb-2">❌ DIFFERENT PERSON</h4>
              <p className="text-sm text-red-700">
                Face distance above threshold. High confidence that images show different individuals.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ LOW RELIABILITY</h4>
              <p className="text-sm text-yellow-700">
                Distance near threshold. Consider retaking photos with better lighting or different angles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}