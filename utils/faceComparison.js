import { calculateDistance } from './mathUtils';
import { compareFaceGeometry } from './faceGeometry';
import { compareBiometricFeatures } from './biometricFeatures';

export const calculateEuclideanDistance = (desc1, desc2) => {
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const compareLandmarks = (landmarks1, landmarks2) => {
  // Compare key landmark positions (normalized)
  const keyPoints = [36, 45, 33, 48, 54, 8]; // Eyes, nose, mouth corners, chin
  let totalSimilarity = 0;

  keyPoints.forEach(pointIndex => {
    const p1 = landmarks1[pointIndex];
    const p2 = landmarks2[pointIndex];
    const dist = calculateDistance(p1, p2);
    const similarity = Math.max(0, 100 - dist); // Adjust scaling as needed
    totalSimilarity += similarity;
  });

  return Math.round(totalSimilarity / keyPoints.length);
};

export const compareFaces = (faceData1, faceData2) => {
  const results = {
    descriptorMatch: false,
    geometryMatch: false,
    biometricMatch: false,
    landmarkMatch: false,
    overallMatch: false,
    confidence: 0,
    details: {}
  };

  // 1. Descriptor comparison (neural network features)
  const descriptorDistance = calculateEuclideanDistance(faceData1.descriptor, faceData2.descriptor);
  const descriptorSimilarity = Math.max(0, 100 - (descriptorDistance * 100));
  results.descriptorMatch = descriptorDistance < 0.6;
  results.details.descriptorDistance = descriptorDistance;
  results.details.descriptorSimilarity = Math.round(descriptorSimilarity);

  // 2. Facial geometry comparison
  const geometryScore = compareFaceGeometry(faceData1.faceGeometry, faceData2.faceGeometry);
  results.geometryMatch = geometryScore > 85;
  results.details.geometryScore = geometryScore;

  // 3. Biometric features comparison
  const biometricScore = compareBiometricFeatures(faceData1.biometricFeatures, faceData2.biometricFeatures);
  results.biometricMatch = biometricScore > 80;
  results.details.biometricScore = biometricScore;

  // 4. Landmark alignment comparison
  const landmarkScore = compareLandmarks(faceData1.landmarks, faceData2.landmarks);
  results.landmarkMatch = landmarkScore > 75;
  results.details.landmarkScore = landmarkScore;

  // 5. Age and gender consistency
  const ageDifference = Math.abs(faceData1.age - faceData2.age);
  const genderMatch = faceData1.gender === faceData2.gender;
  results.details.ageDifference = Math.round(ageDifference);
  results.details.genderMatch = genderMatch;

  // Weighted scoring system
  let totalScore = 0;
  let weights = 0;

  // Descriptor carries the most weight (40%)
  totalScore += descriptorSimilarity * 0.4;
  weights += 0.4;

  // Geometry is also very important (25%)
  totalScore += geometryScore * 0.25;
  weights += 0.25;

  // Biometric features (20%)
  totalScore += biometricScore * 0.20;
  weights += 0.20;

  // Landmark alignment (10%)
  totalScore += landmarkScore * 0.10;
  weights += 0.10;

  // Age consistency bonus/penalty (5%)
  const ageScore = Math.max(0, 100 - (ageDifference * 10));
  totalScore += ageScore * 0.05;
  weights += 0.05;

  results.confidence = Math.round(totalScore / weights);

  // Multi-factor decision making
  const criticalMatches = [
    results.descriptorMatch,
    results.geometryMatch,
    results.biometricMatch
  ].filter(Boolean).length;

  // Need at least 2 out of 3 critical matches AND overall confidence > 75%
  results.overallMatch = criticalMatches >= 2 && results.confidence > 75 && genderMatch;

  // Special case: if descriptor is very strong (>90%), that can override other factors
  if (descriptorSimilarity > 90 && genderMatch) {
    results.overallMatch = true;
  }

  // Special case: if too many factors disagree, it's likely different people
  if (criticalMatches < 2 && results.confidence < 60) {
    results.overallMatch = false;
  }

  return results;
};