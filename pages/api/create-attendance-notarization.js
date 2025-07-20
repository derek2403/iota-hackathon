import { createLocked } from '../../examples/createLocked.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { attendanceRecord } = req.body;

    if (!attendanceRecord) {
      return res.status(400).json({
        success: false,
        error: 'Attendance record is required'
      });
    }

    console.log('Creating attendance notarization for:', attendanceRecord.userName);

    // Prepare the attendance data for blockchain storage
    const blockchainAttendanceData = {
      // Core identity information
      userId: attendanceRecord.profileId,
      userName: attendanceRecord.userName,
      userEmail: attendanceRecord.userEmail,
      
      // Verification details
      event: 'Biometric Attendance Verification',
      timestamp: attendanceRecord.timestamp,
      checkInTime: attendanceRecord.timestamp,
      status: attendanceRecord.success ? 'verified' : 'failed',
      
      // Location and device info
      location: attendanceRecord.location || 'Office/Remote Location',
      device: attendanceRecord.device || 'Web Browser',
      
      // Biometric verification data
      verificationSuccess: attendanceRecord.success,
      confidence: attendanceRecord.confidence,
      verificationDetails: attendanceRecord.verificationDetails,
      biometricHash: attendanceRecord.biometricHash,
      
      // Session information
      sessionId: `ATT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Additional metadata
      verificationMethod: 'Multi-factor Biometric Analysis',
      securityLevel: 'High',
      immutableRecord: true,
      blockchainNetwork: 'IOTA Testnet'
    };

    // Create the notarization with actual attendance data
    const notarization = await createLocked(blockchainAttendanceData);
    
    // Prepare response metadata (keeping the original structure for compatibility)
    const attendanceMetadata = {
      type: 'ATTENDANCE_VERIFICATION',
      userName: attendanceRecord.userName,
      userEmail: attendanceRecord.userEmail,
      timestamp: attendanceRecord.timestamp,
      verificationSuccess: attendanceRecord.success,
      confidenceScore: attendanceRecord.confidence,
      profileId: attendanceRecord.profileId,
      verificationDetails: attendanceRecord.verificationDetails,
      biometricHash: attendanceRecord.biometricHash || 'hash_not_provided',
      location: attendanceRecord.location || 'Not specified',
      device: attendanceRecord.device || 'Web Browser',
      sessionId: blockchainAttendanceData.sessionId
    };

    res.status(200).json({
      success: true,
      notarization: {
        id: notarization.id,
        method: notarization.method,
        stateData: notarization.state.data.toString(),
        stateMetadata: notarization.state.metadata,
        description: notarization.immutableMetadata.description,
        attendanceMetadata: attendanceMetadata,
        blockchainData: blockchainAttendanceData,
        createdAt: new Date().toISOString(),
        locking: notarization.immutableMetadata.locking,
        blockchainProof: {
          network: 'IOTA Testnet',
          notarizationId: notarization.id,
          timestamp: new Date().toISOString(),
          immutable: true,
          dataStored: 'Complete attendance verification record with biometric proof'
        }
      },
      attendanceRecord: attendanceRecord
    });
  } catch (error) {
    console.error('Error creating attendance notarization:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to create blockchain notarization for attendance record'
    });
  }
} 