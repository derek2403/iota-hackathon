import { calculateDistance } from './mathUtils';

export const calculateEyeAspectRatio = (eyePoints) => {
  const height1 = calculateDistance(eyePoints[1], eyePoints[5]);
  const height2 = calculateDistance(eyePoints[2], eyePoints[4]);
  const width = calculateDistance(eyePoints[0], eyePoints[3]);
  return (height1 + height2) / (2 * width);
};

export const calculateMouthAspectRatio = (mouthPoints) => {
  const height1 = calculateDistance(mouthPoints[2], mouthPoints[10]);
  const height2 = calculateDistance(mouthPoints[4], mouthPoints[8]);
  const width = calculateDistance(mouthPoints[0], mouthPoints[6]);
  return (height1 + height2) / (2 * width);
};

export const calculateEyebrowArch = (landmarks) => {
  const leftBrow = landmarks.slice(17, 22);
  const rightBrow = landmarks.slice(22, 27);
  
  const leftArch = leftBrow[2].y - Math.min(leftBrow[0].y, leftBrow[4].y);
  const rightArch = rightBrow[2].y - Math.min(rightBrow[0].y, rightBrow[4].y);
  
  return { leftArch, rightArch, asymmetry: Math.abs(leftArch - rightArch) };
};

export const calculateBiometricFeatures = (landmarks) => {
  // Eye features
  const leftEyePoints = landmarks.slice(36, 42);
  const rightEyePoints = landmarks.slice(42, 48);
  const leftEyeAspectRatio = calculateEyeAspectRatio(leftEyePoints);
  const rightEyeAspectRatio = calculateEyeAspectRatio(rightEyePoints);

  // Nose features
  const noseWidth = calculateDistance(landmarks[31], landmarks[35]);
  const noseHeight = calculateDistance(landmarks[27], landmarks[33]);

  // Mouth features
  const mouthPoints = landmarks.slice(48, 68);
  const mouthAspectRatio = calculateMouthAspectRatio(mouthPoints);

  // Jaw line features
  const jawWidth = calculateDistance(landmarks[0], landmarks[16]);

  return {
    leftEyeAspectRatio,
    rightEyeAspectRatio,
    eyeAsymmetry: Math.abs(leftEyeAspectRatio - rightEyeAspectRatio),
    noseAspectRatio: noseHeight / noseWidth,
    mouthAspectRatio,
    jawWidth,
    // Additional unique features
    eyebrowArch: calculateEyebrowArch(landmarks),
    facialAngles: null // Will be set from faceGeometry
  };
};

export const compareBiometricFeatures = (bio1, bio2) => {
  const features = [
    'leftEyeAspectRatio',
    'rightEyeAspectRatio',
    'noseAspectRatio',
    'mouthAspectRatio',
    'eyeAsymmetry'
  ];

  let totalScore = 0;
  features.forEach(feature => {
    const diff = Math.abs(bio1[feature] - bio2[feature]);
    const similarity = Math.max(0, 100 - (diff * 200));
    totalScore += similarity;
  });

  return Math.round(totalScore / features.length);
};