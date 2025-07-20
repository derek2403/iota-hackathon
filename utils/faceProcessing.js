import { extractFaceData } from './faceDetection';
import { calculateFaceGeometry, calculateFacialAngles } from './faceGeometry';
import { calculateBiometricFeatures } from './biometricFeatures';

export const processCompleteface = async (imageElement) => {
  // Extract basic face data
  const basicFaceData = await extractFaceData(imageElement);
  
  // Calculate facial geometry ratios
  const faceGeometry = calculateFaceGeometry(basicFaceData.landmarks);
  
  // Calculate additional biometric features
  const biometricFeatures = calculateBiometricFeatures(basicFaceData.landmarks);
  
  // Calculate facial angles
  const facialAngles = calculateFacialAngles(basicFaceData.landmarks);
  
  // Add facial angles to biometric features
  biometricFeatures.facialAngles = facialAngles;

  return {
    ...basicFaceData,
    faceGeometry,
    biometricFeatures
  };
};