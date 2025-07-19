import { useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function Scan() {
  const webcamRef = useRef(null);
  const [faceHash, setFaceHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captured, setCaptured] = useState(false);

  const videoConstraints = {
    width: 720,
    height: 560,
    facingMode: "user"
  };

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image');
      return;
    }

    setLoading(true);
    setError('');
    setCaptured(true);

    try {
      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');

      console.log('Sending image to API...');

      // Send to API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const apiResponse = await fetch('/api/face-hash', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const result = await apiResponse.json();

      if (result.success) {
        setFaceHash(result.hash);
        console.log('Face hash generated:', result.hash);
      } else {
        setError(result.error || 'Failed to process face');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Error processing image: ' + err.message);
      }
      console.error('Capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFaceHash('');
    setError('');
    setCaptured(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Face Recognition ID Scanner</h1>
        <p className="text-center text-gray-600 mb-8">
          Using TensorFlow.js BlazeFace model for deterministic face hashing
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="rounded-lg mx-auto"
            />
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={capture}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Capture & Generate ID'}
            </button>
            
            {(faceHash || error) && (
              <button
                onClick={reset}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Reset
              </button>
            )}
          </div>

          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Analyzing face with TensorFlow.js...</p>
              <p className="mt-1 text-sm text-gray-500">This may take a moment on first use</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {faceHash && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <h3 className="font-bold mb-2">Your Unique Face ID:</h3>
              <div className="font-mono text-sm break-all bg-white p-2 rounded border">
                {faceHash}
              </div>
              <p className="text-sm mt-2">
                This deterministic hash was generated using TensorFlow.js BlazeFace model and represents your facial features for identity verification.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}