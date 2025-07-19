// Copyright 2025 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import { TimeLock } from "@iota/notarization/node/index.js";
import { getFundedClient } from "../utils/utils.js";

/** Demonstrate how to create a Locked Notarization and publish it. */
export async function createLocked(attendanceData = null) {
    console.log("Creating an attendance record notarization");

    // create a new client that offers notarization related functions
    const notarizationClient = await getFundedClient();

    const utf8Encode = new TextEncoder();

    // Use provided attendance data or fallback to default
    const attendanceRecord = attendanceData || {
        userId: "emp_001",
        studentName: "Liew Qi Jian",
        event: "Class Attendance",
        timestamp: Date.now(),
        location: "Xsullin Curine Academy",
        checkInTime: "2025-01-15T09:00:00Z",
        checkOutTime: "2025-01-15T10:30:00Z",
        status: "present",
        school: "Computer Science",
    };

    // Convert attendance record to JSON string, then to bytes
    const attendanceJson = JSON.stringify(attendanceRecord, null, 2);
    const attendanceBytes = utf8Encode.encode(attendanceJson);

    // create a new Locked Notarization with attendance data
    console.log("Building attendance notarization and publishing to IOTA network");
    console.log("Attendance data:", attendanceRecord);
    
    const { output: notarization } = await notarizationClient
        .createLocked()
        .withBytesState(
            attendanceBytes,
            `Attendance-${attendanceRecord.userId || attendanceRecord.profileId}-${attendanceRecord.event || 'Verification'}`
        )
        .withImmutableDescription(`Attendance record for ${attendanceRecord.studentName || attendanceRecord.userName} (${attendanceRecord.userId || attendanceRecord.profileId}) at ${attendanceRecord.event || attendanceRecord.location || 'Biometric Verification'}`)
        .finish()
        .buildAndExecute(notarizationClient);

    console.log("\n✅ Attendance notarization created successfully!");

    // check some important properties of the received OnChainNotarization
    console.log("\n----------------------------------------------------");
    console.log("----- Important Notarization Properties ------------");
    console.log("----------------------------------------------------");
    console.log("Notarization ID: ", notarization.id);
    console.log("Notarization Method: ", notarization.method);
    console.log(
        `State data as string: "${notarization.state.data.toString()}" or as bytes: [${notarization.state.data.toBytes()}]`,
    );
    console.log("State metadata: ", notarization.state.metadata);
    console.log("Immutable description: ", notarization.immutableMetadata.description);
    console.log("Immutable locking metadata: ", notarization.immutableMetadata.locking);
    console.log("Updatable metadata: ", notarization.updatableMetadata);
    console.log("State version count: ", notarization.stateVersionCount);

    // This is what the complete OnChainNotarization looks like
    console.log("\n----------------------------------------------------");
    console.log("----- All Notarization Properties      -------------");
    console.log("----------------------------------------------------");
    console.log("Notarization: ", notarization);

    // Verify the notarization method is Locked
    if (notarization.method !== "Locked") {
        throw new Error("Expected notarization method to be 'Locked'");
    }

    // Check if it has locking metadata and `updateLock` + `transferLock` are set to `UntilDestroyed`
    if (!notarization.immutableMetadata.locking) {
        throw new Error("Expected locking metadata to be present");
    }
    
    if (notarization.immutableMetadata.locking.updateLock.type !== "UntilDestroyed") {
        throw new Error("Expected updateLock type to be 'UntilDestroyed'");
    }
    
    if (notarization.immutableMetadata.locking.transferLock.type !== "UntilDestroyed") {
        throw new Error("Expected transferLock type to be 'UntilDestroyed'");
    }

    console.log("\n🔒 The notarization is Locked and cannot be updated or transferred until it is destroyed");
    console.log("🗑️ The notarization can only be destroyed after the delete lock expires");

    // Parse and display the attendance data from the notarization
    console.log("\n----------------------------------------------------");
    console.log("----- Stored Attendance Data -------------------");
    console.log("----------------------------------------------------");
    
    try {
        const storedData = JSON.parse(notarization.state.data.toString());
        console.log("User:", storedData.studentName || storedData.userName);
        console.log("User ID:", storedData.userId || storedData.profileId);
        console.log("Event:", storedData.event || 'Biometric Verification');
        console.log("Status:", storedData.status || (storedData.success ? 'verified' : 'failed'));
        console.log("Location:", storedData.location);
        console.log("Check-in:", storedData.checkInTime || storedData.timestamp);
        console.log("Check-out:", storedData.checkOutTime || 'N/A');
        console.log("Department/School:", storedData.school || storedData.department || 'N/A');
        
        // Log biometric verification specific data if available
        if (storedData.confidence) {
            console.log("Verification Confidence:", storedData.confidence + '%');
        }
        if (storedData.verificationDetails) {
            console.log("Verification Details:", storedData.verificationDetails);
        }
        if (storedData.biometricHash) {
            console.log("Biometric Hash:", storedData.biometricHash.substring(0, 50) + '...');
        }
    } catch (e) {
        console.log("Raw attendance data:", notarization.state.data.toString());
    }

    console.log("\n🔒 The attendance record is permanently locked on the IOTA blockchain");
    console.log("📋 This creates an immutable, timestamped proof of attendance");

    return notarization;
} 