import { useRef, useState, useEffect } from 'react';
import { loadFaceModels } from '../utils/faceDetection';
import { processCompleteface } from '../utils/faceProcessing';
import { compareFaces } from '../utils/faceComparison';
import { encodeFaceData, decodeFaceData } from '../utils/dataEncoding';
import FaceCamera from './FaceCamera';
import VerificationResults from './VerificationResults';
import TechnicalDetails from './TechnicalDetails';

const FaceVerificationSystem = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [storedFaceData, setStoredFaceData] = useState(null);
  const [storedEncodedData, setStoredEncodedData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputFaceData, setInputFaceData] = useState('');

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

  const handleInputFaceDataChange = (value) => {
    setInputFaceData(value);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">Advanced Face Verification System</h1>
      <p className="text-center text-gray-600 mb-8">
        Multi-factor biometric verification using facial geometry, landmarks, and neural features
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FaceCamera
          ref={webcamRef}
          modelsLoaded={modelsLoaded}
          loading={loading}
          storedFaceData={storedFaceData}
          inputFaceData={inputFaceData}
          onGenerateProfile={generateFaceProfile}
          onVerifyWithStored={verifyWithStored}
          onVerifyWithInput={verifyWithInput}
          onReset={reset}
        />

        <VerificationResults
          loading={loading}
          error={error}
          storedEncodedData={storedEncodedData}
          verificationResult={verificationResult}
          inputFaceData={inputFaceData}
          onInputFaceDataChange={handleInputFaceDataChange}
        />
      </div>

      <TechnicalDetails />
    </div>
  );
};

export default FaceVerificationSystem; 