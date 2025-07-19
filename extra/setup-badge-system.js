// optional setup file

import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const CONFIG = {
  packageId:
    "0x742564b9dd2e370b9a9631be3f5c70b383b319dd8a598af5ab7e3c0b3b3d6261",
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
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

async function setupBadgeSystem() {
  console.log("🎖️ SETTING UP NFT BADGE SYSTEM");
  console.log("===============================");

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();

    console.log("👤 Admin Address:", adminAddress);
    console.log("📦 Package ID:", CONFIG.packageId);
    console.log("");

    const transaction = new Transaction();

    // Setup badge system with admin
    transaction.moveCall({
      target: `${CONFIG.packageId}::attendance_nft::setup_badge_system`,
      arguments: [transaction.pure.address(adminAddress)],
    });

    const result = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction,
      options: { showEvents: true, showObjectChanges: true },
    });

    console.log("✅ Badge system setup successful!");
    console.log("📋 Transaction:", result.digest);

    // Find the BadgeRegistry object
    if (result.objectChanges) {
      const badgeRegistry = result.objectChanges.find(
        (change) =>
          change.type === "created" &&
          change.objectType.includes("BadgeRegistry")
      );

      if (badgeRegistry) {
        console.log("🎯 BadgeRegistry ID:", badgeRegistry.objectId);
        console.log("");
        console.log("🔧 UPDATE YOUR CONFIG:");
        console.log("======================");
        console.log(`badgeRegistry: "${badgeRegistry.objectId}",`);
        console.log("");
        console.log("✅ Badge system is ready for use!");
        return badgeRegistry.objectId;
      }
    }

    throw new Error("BadgeRegistry not found in object changes");
  } catch (error) {
    console.error("❌ Badge system setup failed:", error.message);
    throw error;
  }
}

// Run the setup
setupBadgeSystem().catch(console.error);
