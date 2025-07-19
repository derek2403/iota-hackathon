import * as faceapi from 'face-api.js';

export const loadFaceModels = async () => {
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    await faceapi.nets.faceRecognitionNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    await faceapi.nets.ageGenderNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights');
    
    console.log('✅ Face recognition models loaded');
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    throw new Error('Failed to load face recognition models. Please refresh and try again.');
  }
};

export const extractFaceData = async (imageElement) => {
  const detection = await faceapi
    .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withAgeAndGender();

  if (!detection) {
    throw new Error('No face detected');
  }

  if (detection.detection.score < 0.8) {
    throw new Error('Face detection confidence too low. Please improve lighting and positioning.');
  }

  // Extract facial landmarks (68 points)
  const landmarks = detection.landmarks.positions.map(point => ({
    x: Math.round(point.x * 1000) / 1000,
    y: Math.round(point.y * 1000) / 1000
  }));

  // Extract face descriptor
  const descriptor = Array.from(detection.descriptor);

  return {
    descriptor,
    landmarks,
    detectionScore: detection.detection.score,
    age: detection.age,
    gender: detection.gender,
    bbox: detection.detection.box
  };
}; 