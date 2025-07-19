// not needed

import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

// New package configuration (updated with fix)
const CONFIG = {
  packageId:
    "0x4a667c9e87ac840f721c2ff27db84b9c1da273f25cc33027831047d7e02b7525",
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
  },
  objectIds: {
    tokenPolicy:
      "0x6076b8cf9033f2c7cb7cc6625c8042bbe6890a3bf371e9d5413e507c8a62b677",
    tokenPolicyCap:
      "0xb6dba17a568307acda3e748de51f0f39801e10316d4bfe7fb90e3367760ce7e1",
    treasuryCap:
      "0xb6167580a389592a05ca549094b0a9ff108eb206be42601f5ae826c07b4fc3c5",
  },
};

async function initializeSystem() {
  const client = new IotaClient({ url: getFullnodeUrl("testnet") });
  const adminKeyBytes = Buffer.from(CONFIG.keys.adminPrivateKey, "base64");
  const adminPrivateKeyBytes = adminKeyBytes.slice(1);
  const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyBytes);
  const adminAddress = adminKeypair.getPublicKey().toIotaAddress();
  return { client, adminKeypair, adminAddress };
}

async function setupAttendanceSystem() {
  console.log("🏗️ SETTING UP NEW ATTENDANCE SYSTEM");
  console.log("===================================");

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();

    console.log("📦 Package ID:", CONFIG.packageId);
    console.log("👤 Admin Address:", adminAddress);
    console.log("🏛️ Token Policy:", CONFIG.objectIds.tokenPolicy);
    console.log("");

    const transaction = new Transaction();

    // Create the AttendanceSystem object
    console.log("🔧 Creating AttendanceSystem...");
    transaction.moveCall({
      target: `${CONFIG.packageId}::attendance_system::setup_system`,
      arguments: [
        transaction.object(CONFIG.objectIds.treasuryCap),
        transaction.object(CONFIG.objectIds.tokenPolicyCap),
        transaction.pure.address(adminAddress),
        transaction.pure.vector("address", []), // Empty initial verifiers
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction,
      options: { showEvents: true, showObjectChanges: true },
    });

    console.log("✅ AttendanceSystem created successfully!");
    console.log("📋 Transaction:", result.digest);

    // Find the new AttendanceSystem object
    if (result.objectChanges) {
      const attendanceSystem = result.objectChanges.find(
        (change) =>
          change.type === "created" &&
          change.objectType.includes("AttendanceSystem")
      );

      if (attendanceSystem) {
        console.log("");
        console.log("🎯 NEW ATTENDANCE SYSTEM CREATED:");
        console.log("=================================");
        console.log("AttendanceSystem ID:", attendanceSystem.objectId);

        // Create updated config
        const newConfig = {
          packageId: CONFIG.packageId,
          keys: CONFIG.keys,
          objectIds: {
            tokenPolicy: CONFIG.objectIds.tokenPolicy,
            attendanceSystem: attendanceSystem.objectId,
          },
        };

        console.log("");
        console.log("📋 UPDATED CONFIG FOR TOKEN DEMO:");
        console.log("=================================");
        console.log(JSON.stringify(newConfig, null, 2));

        return {
          success: true,
          config: newConfig,
          attendanceSystemId: attendanceSystem.objectId,
        };
      }
    }

    console.log("❌ Could not find AttendanceSystem in object changes");
    return { success: false };
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    return { success: false, error };
  }
}

async function main() {
  console.log("🎓 UNIVERSITY ATTENDANCE SYSTEM - NEW SETUP");
  console.log("===========================================");
  console.log("");
  console.log(
    "This will create a new AttendanceSystem with admin authorization fix!"
  );
  console.log("");

  const result = await setupAttendanceSystem();

  if (result.success) {
    console.log("");
    console.log("🎉 SUCCESS! Your system is ready!");
    console.log("================================");
    console.log("");
    console.log("✅ Package deployed with admin authorization fix");
    console.log("✅ AttendanceSystem created and configured");
    console.log("✅ Admin can now receive tokens directly");
    console.log("");
    console.log("🚀 Next: Update token-op-fixed.js with new config and test!");
  } else {
    console.log("");
    console.log("❌ Setup failed. Please check the error above.");
  }
}

main().catch(console.error);
