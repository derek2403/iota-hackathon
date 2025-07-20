import { calculateDistance } from './mathUtils';

export const calculateFaceGeometry = (landmarks) => {
  // Key facial points
  const leftEye = landmarks[36]; // Left eye outer corner
  const rightEye = landmarks[45]; // Right eye outer corner
  const noseTip = landmarks[33]; // Nose tip
  const mouthLeft = landmarks[48]; // Mouth left corner
  const mouthRight = landmarks[54]; // Mouth right corner
  const chin = landmarks[8]; // Chin center
  const foreheadTop = { 
    x: (leftEye.x + rightEye.x) / 2, 
    y: Math.min(...landmarks.slice(17, 27).map(p => p.y)) 
  };

  // Calculate distances
  const eyeDistance = calculateDistance(leftEye, rightEye);
  const faceWidth = eyeDistance * 1.5; // Approximate face width
  const faceHeight = calculateDistance(foreheadTop, chin);
  const noseToMouth = calculateDistance(noseTip, { 
    x: (mouthLeft.x + mouthRight.x) / 2, 
    y: (mouthLeft.y + mouthRight.y) / 2 
  });
  const mouthWidth = calculateDistance(mouthLeft, mouthRight);
  const eyeToNose = calculateDistance({ 
    x: (leftEye.x + rightEye.x) / 2, 
    y: (leftEye.y + rightEye.y) / 2 
  }, noseTip);

  // Calculate ratios (these are relatively stable across different photos)
  return {
    faceAspectRatio: faceHeight / faceWidth,
    eyeDistanceToFaceWidth: eyeDistance / faceWidth,
    noseToMouthRatio: noseToMouth / faceHeight,
    mouthToFaceWidthRatio: mouthWidth / faceWidth,
    eyeToNoseRatio: eyeToNose / faceHeight,
    // Symmetry measures
    leftEyeToNose: calculateDistance(leftEye, noseTip),
    rightEyeToNose: calculateDistance(rightEye, noseTip),
    faceSymmetry: Math.abs(calculateDistance(leftEye, noseTip) - calculateDistance(rightEye, noseTip)) / eyeDistance
  };
};

export const calculateFacialAngles = (landmarks) => {
  const leftEye = landmarks[36];
  const rightEye = landmarks[45];
  const noseTip = landmarks[33];
  const chin = landmarks[8];
  
  // Calculate the angle of the face
  const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const noseAngle = Math.atan2(chin.y - noseTip.y, chin.x - noseTip.x);
  
  return { eyeAngle, noseAngle };
};

export const compareFaceGeometry = (geo1, geo2) => {
  const ratioComparisons = [
    'faceAspectRatio',
    'eyeDistanceToFaceWidth',
    'noseToMouthRatio',
    'mouthToFaceWidthRatio',
    'eyeToNoseRatio'
  ];

  let totalScore = 0;
  ratioComparisons.forEach(ratio => {
    const diff = Math.abs(geo1[ratio] - geo2[ratio]);
    const similarity = Math.max(0, 100 - (diff * 500)); // Scale the difference
    totalScore += similarity;
  });

  return Math.round(totalScore / ratioComparisons.length);
}; 