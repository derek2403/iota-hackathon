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
            biometricHash: selectedProfile.data.faceData.substring(0, 100), // First 100 chars of biometric hash
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
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🏢 Biometric Attendance Verification
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Verify your identity using your registered biometric profile for secure attendance tracking.
        </p>
      </div>

      <AttendanceSummary attendanceRecords={attendanceRecords} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera and Verification Section */}
        <div className="space-y-6">
          {/* Camera */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📷 Identity Verification</h2>
            
            {!modelsLoaded && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                Loading face recognition models... This may take a moment.
              </div>
            )}
            
            <div className="text-center mb-6">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  width: 720,
                  height: 560,
                  facingMode: "user"
                }}
                className="rounded-lg mx-auto w-full"
              />
            </div>

            {/* Profile Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Profile:
              </label>
              <select
                value={selectedProfile?.id || ''}
                onChange={(e) => {
                  const profile = storedProfiles.find(p => p.id === e.target.value);
                  setSelectedProfile(profile || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a registered profile...</option>
                {storedProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.email})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={verifyAttendance}
              disabled={loading || !modelsLoaded || !selectedProfile}
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Verifying Identity...' : '🔍 Verify Attendance'}
            </button>

            {notarizing && (
              <div className="mt-2 text-center py-2 px-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                🔗 Creating blockchain notarization...
              </div>
            )}

            <button
              onClick={resetVerification}
              className="w-full mt-2 bg-gray-500 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Verification Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">🔐 Verification Results</h3>

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Verifying your identity...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {verificationResult && (
              <div className={`border-2 px-4 py-4 rounded-lg ${
                verificationResult.success 
                  ? 'bg-green-100 border-green-500 text-green-800'
                  : 'bg-red-100 border-red-500 text-red-800'
              }`}>
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">
                    {verificationResult.success ? '✅' : '❌'}
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {verificationResult.success ? 'ATTENDANCE VERIFIED' : 'VERIFICATION FAILED'}
                  </div>
                  <div className="text-lg">
                    Confidence: {verificationResult.confidence}%
                  </div>
                  <div className="text-sm mt-2">
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

                <div className="text-xs bg-white bg-opacity-50 p-2 rounded">
                  <p><strong>Timestamp:</strong> {verificationResult.timestamp}</p>
                </div>
              </div>
            )}

            {/* Blockchain Notarization Results */}
            {notarizationResult && verificationResult?.success && (
              <div className="border-2 border-green-400 bg-green-50 px-4 py-4 rounded-lg mt-4">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">🔗</div>
                  <div className="text-lg font-bold text-green-800 mb-2">
                    BLOCKCHAIN NOTARIZATION CREATED
                  </div>
                  <div className="text-sm text-green-700">
                    Attendance record permanently stored on IOTA blockchain
                  </div>
                </div>

                <div className="space-y-2 text-sm">
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

                <div className="mt-3 p-2 bg-white bg-opacity-50 rounded text-xs">
                  <p><strong>Session ID:</strong> {notarizationResult.attendanceMetadata?.sessionId}</p>
                  <p><strong>Verification Type:</strong> {notarizationResult.attendanceMetadata?.type}</p>
                </div>
              </div>
            )}

            {verificationResult?.success && notarizing && (
              <div className="border-2 border-yellow-400 bg-yellow-50 px-4 py-4 rounded-lg mt-4">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mb-2"></div>
                  <p className="text-yellow-800 font-medium">Creating blockchain notarization...</p>
                  <p className="text-yellow-700 text-sm mt-1">Securing attendance record on IOTA network</p>
                </div>
              </div>
            )}

            {!verificationResult && !loading && !error && (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">
                  Select your profile and verify your attendance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceVerification; 