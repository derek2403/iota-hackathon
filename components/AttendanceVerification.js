import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { loadFaceModels } from '../utils/faceDetection';
import { processCompleteface } from '../utils/faceProcessing';
import { compareFaces } from '../utils/faceComparison';
import { encodeFaceData, decodeFaceData } from '../utils/dataEncoding';
import AttendanceSummary from './AttendanceSummary';

const AttendanceVerification = () => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storedProfiles, setStoredProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [notarizing, setNotarizing] = useState(false);
  const [notarizationResult, setNotarizationResult] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    initializeModels();
    loadStoredProfiles();
    loadAttendanceRecords();
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

  const loadStoredProfiles = () => {
    try {
      const profiles = [];
      
      // Get general biometric data
      const generalData = localStorage.getItem('userBiometricData');
      if (generalData) {
        const parsed = JSON.parse(generalData);
        profiles.push({
          id: 'general',
          name: parsed.userInfo?.name || 'Unknown User',
          email: parsed.userInfo?.email || 'No Email',
          data: parsed,
          source: 'General Profile'
        });
      }

      // Get all biometric profiles for specific users
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('biometric_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              const email = key.replace('biometric_', '');
              profiles.push({
                id: email,
                name: parsed.userInfo?.name || 'Unknown User',
                email: email,
                data: parsed,
                source: 'User Specific Profile'
              });
            } catch (e) {
              console.warn('Failed to parse biometric data for key:', key);
            }
          }
        }
      }

      // Remove duplicates based on email
      const uniqueProfiles = profiles.filter((profile, index, self) => 
        index === self.findIndex(p => p.email === profile.email)
      );

      setStoredProfiles(uniqueProfiles);
      console.log('Loaded stored biometric profiles:', uniqueProfiles);
    } catch (error) {
      console.error('Error loading stored profiles:', error);
      setError('Failed to load stored biometric profiles');
    }
  };

  const loadAttendanceRecords = () => {
    const records = localStorage.getItem('attendanceRecords');
    if (records) {
      setAttendanceRecords(JSON.parse(records));
    }
  };

  const saveAttendanceRecord = (record) => {
    const updatedRecords = [record, ...attendanceRecords];
    setAttendanceRecords(updatedRecords);
    localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
  };

  const createAttendanceNotarization = async (attendanceRecord) => {
    setNotarizing(true);
    try {
      console.log('🔗 Creating blockchain notarization for attendance...');
      
      const response = await fetch('/api/create-attendance-notarization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          attendanceRecord: {
            ...attendanceRecord,
            biometricHash: selectedProfile.data.faceData.substring(0, 100),
            location: 'Office/Remote Location',
            device: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Computer'
          }
        }),
      });

      const notarizationData = await response.json();

      if (notarizationData.success) {
        console.log('✅ Attendance notarization created successfully!');
        setNotarizationResult(notarizationData.notarization);
        
        // Update attendance record with blockchain proof
        const updatedRecord = {
          ...attendanceRecord,
          blockchainProof: notarizationData.notarization.blockchainProof,
          notarizationId: notarizationData.notarization.id,
          notarized: true
        };

        // Update the stored attendance records with blockchain proof
        const updatedRecords = attendanceRecords.map(record => 
          record.id === attendanceRecord.id ? updatedRecord : record
        );
        setAttendanceRecords(updatedRecords);
        localStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));

        return notarizationData.notarization;
      } else {
        throw new Error(notarizationData.error || 'Failed to create notarization');
      }
    } catch (err) {
      console.error('Error creating attendance notarization:', err);
      setError('Failed to create blockchain notarization: ' + err.message);
      return null;
    } finally {
      setNotarizing(false);
    }
  };

  const verifyAttendance = async () => {
    if (!modelsLoaded) {
      setError('Face recognition models not loaded yet');
      return;
    }

    if (!selectedProfile) {
      setError('Please select a profile to verify against');
      return;
    }

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Failed to capture image');
      return;
    }

    setLoading(true);
    setError('');
    setNotarizationResult(null);

    try {
      const img = document.createElement('img');
      img.src = imageSrc;
      
      await new Promise(resolve => {
        img.onload = resolve;
      });

      // Process current face
      const currentFaceData = await processCompleteface(img);
      
      // Decode stored face data
      const storedFaceData = decodeFaceData(selectedProfile.data.faceData);
      
      // Compare faces
      const comparison = compareFaces(storedFaceData, currentFaceData);

      const result = {
        ...comparison,
        timestamp: new Date().toLocaleString(),
        currentFaceData: encodeFaceData(currentFaceData),
        verifiedProfile: selectedProfile,
        success: comparison.overallMatch
      };

      setVerificationResult(result);

      // Save attendance record
      const attendanceRecord = {
        id: Date.now(),
        profileId: selectedProfile.id,
        userName: selectedProfile.name,
        userEmail: selectedProfile.email,
        timestamp: new Date().toISOString(),
        success: result.success,
        confidence: result.confidence,
        verificationDetails: {
          descriptorMatch: result.descriptorMatch,
          geometryMatch: result.geometryMatch,
          biometricMatch: result.biometricMatch,
          landmarkMatch: result.landmarkMatch
        }
      };

      saveAttendanceRecord(attendanceRecord);

      // If attendance verification was successful, create blockchain notarization
      if (result.success) {
        console.log('✅ Attendance verified successfully! Creating blockchain notarization...');
        await createAttendanceNotarization(attendanceRecord);
      }

      // Show results modal
      setShowResultsModal(true);

      console.log('Attendance verification completed:', result);

    } catch (err) {
      setError('Error during verification: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setNotarizationResult(null);
    setError('');
    setSelectedProfile(null);
    setShowResultsModal(false);
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${showResultsModal ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <div className={`bg-white shadow-sm border-b transition-all duration-300 ${showResultsModal ? 'filter blur-md opacity-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏢 Biometric Attendance Verification
            </h1>
            <p className="text-gray-600">
              Verify your identity using your registered biometric profile for secure attendance tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${showResultsModal ? 'filter blur-md opacity-20' : ''}`}>
        <AttendanceSummary attendanceRecords={attendanceRecords} />
      </div>

      {/* Main Verification Area - Full Page */}
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${showResultsModal ? 'filter blur-md opacity-20' : ''}`}>
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📷 Identity Verification
            </h2>
            <p className="text-gray-600">
              Select your profile and verify your attendance using facial recognition
            </p>
          </div>

          {!modelsLoaded && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg mb-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-2"></div>
              Loading face recognition models... This may take a moment.
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Profile Selection */}
          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-700 mb-3">
              Select Your Profile:
            </label>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const profile = storedProfiles.find(p => p.id === e.target.value);
                setSelectedProfile(profile || null);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              <option value="">Select a registered profile...</option>
              {storedProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.email})
                </option>
              ))}
            </select>
          </div>

          {/* Camera Section */}
          <div className="mb-8">
            <div className="text-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 800,
                  height: 600,
                  facingMode: "user"
                }}
                className="rounded-lg mx-auto w-full max-w-2xl shadow-lg"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={verifyAttendance}
              disabled={loading || !modelsLoaded || !selectedProfile}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying Identity...
                </>
              ) : (
                <>
                  Verify Attendance
                </>
              )}
            </button>

            <button
              onClick={resetVerification}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-4 px-8 rounded-lg text-lg transition-colors duration-200"
            >
              🔄 Reset
            </button>
          </div>

          {notarizing && (
            <div className="mt-6 text-center py-4 px-6 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-2"></div>
              🔗 Creating blockchain notarization...
            </div>
          )}
        </div>
      </div>

      {/* Results Modal with Backdrop */}
      {showResultsModal && verificationResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with enhanced dark overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={closeResultsModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Verification Results
                </h3>
                <button
                  onClick={closeResultsModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors duration-200"
                >
                  ×
                </button>
              </div>

              {/* Verification Result */}
              <div className={`border-2 px-6 py-6 rounded-lg mb-6 ${
                verificationResult.success 
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-red-100 border-red-500 text-red-800'
              }`}>
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">
                    {verificationResult.success ? '✅' : '❌'}
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {verificationResult.success ? 'ATTENDANCE VERIFIED' : 'VERIFICATION FAILED'}
                  </div>
                  <div className="text-xl">
                    Confidence: {verificationResult.confidence}%
                  </div>
                  <div className="text-lg mt-2">
                    User: {verificationResult.verifiedProfile.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p><strong>Neural Features:</strong> {verificationResult.descriptorMatch ? '✅' : '❌'}</p>
                    <p><strong>Face Geometry:</strong> {verificationResult.geometryMatch ? '✅' : '❌'}</p>
                  </div>
                  <div>
                    <p><strong>Biometric Features:</strong> {verificationResult.biometricMatch ? '✅' : '❌'}</p>
                    <p><strong>Landmark Analysis:</strong> {verificationResult.landmarkMatch ? '✅' : '❌'}</p>
                  </div>
                </div>

                <div className="text-sm bg-white bg-opacity-50 p-3 rounded">
                  <p><strong>Timestamp:</strong> {verificationResult.timestamp}</p>
                </div>
              </div>

              {/* Blockchain Notarization Results */}
              {notarizationResult && verificationResult.success && (
                <div className="border-2 border-green-400 bg-green-50 px-6 py-6 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-3">🔗</div>
                    <div className="text-xl font-bold text-green-800 mb-2">
                      BLOCKCHAIN NOTARIZATION CREATED
                    </div>
                    <div className="text-green-700">
                      Attendance record permanently stored on IOTA blockchain
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-green-800">Notarization ID:</span>
                      <span className="font-mono text-green-700 text-xs">{notarizationResult.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-green-800">Network:</span>
                      <span className="text-green-700">{notarizationResult.blockchainProof?.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-green-800">Created:</span>
                      <span className="text-green-700">{new Date(notarizationResult.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-green-800">Immutable:</span>
                      <span className="text-green-700">✅ Yes</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white bg-opacity-50 rounded text-xs">
                    <p><strong>Session ID:</strong> {notarizationResult.attendanceMetadata?.sessionId}</p>
                    <p><strong>Verification Type:</strong> {notarizationResult.attendanceMetadata?.type}</p>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-4 justify-center mt-8">
                <button
                  onClick={closeResultsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
                <button
                  onClick={resetVerification}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Verify Another
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceVerification; 