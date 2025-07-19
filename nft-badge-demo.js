import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const CONFIG = {
  packageId:
    "0x742564b9dd2e370b9a9631be3f5c70b383b319dd8a598af5ab7e3c0b3b3d6261",
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
  },
  objectIds: {
    tokenPolicy:
      "0x6076b8cf9033f2c7cb7cc6625c8042bbe6890a3bf371e9d5413e507c8a62b677",
    attendanceSystem: "0x6ad36b1f43446d4df45e5bc7a9b4ea52d6fe847f",
    // BadgeRegistry created from setup
    badgeRegistry:
      "0x313c30464641b98823d81cfc9bbfc8a9ff6ea3077dd50c984d9b425ef688d05d",
  },
};

// Badge tier constants
const BADGE_TIERS = {
  BRONZE: { tier: 1, name: "Bronze Badge", threshold: 50 },
  SILVER: { tier: 2, name: "Silver Badge", threshold: 100 },
  GOLD: { tier: 3, name: "Gold Badge", threshold: 150 },
};

// Achievement types
const ACHIEVEMENT_TYPES = {
  NIGHT_OWL: 1,
  MORNING_ACHIEVER: 2,
  KICKOFF_CHAMPION: 3,
  FULL_COMMITMENT: 4,
};

async function initializeSystem() {
  const client = new IotaClient({ url: getFullnodeUrl("testnet") });
  const adminKeyBytes = Buffer.from(CONFIG.keys.adminPrivateKey, "base64");
  const adminPrivateKeyBytes = adminKeyBytes.slice(1);
  const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyBytes);
  const adminAddress = adminKeypair.getPublicKey().toIotaAddress();
  return { client, adminKeypair, adminAddress };
}

class AttendanceNFTManager {
  constructor(client, keypair, config) {
    this.client = client;
    this.keypair = keypair;
    this.config = config;
    this.adminAddress = keypair.getPublicKey().toIotaAddress();
  }

  // Deploy NFT badge system and create BadgeRegistry
  async setupBadgeSystem() {
    console.log("🎖️ SETTING UP NFT BADGE SYSTEM");
    console.log("===============================");

    try {
      const transaction = new Transaction();

      // Setup badge system with admin
      transaction.moveCall({
        target: `${this.config.packageId}::attendance_nft::setup_badge_system`,
        arguments: [transaction.pure.address(this.adminAddress)],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction,
        options: { showEvents: true, showObjectChanges: true },
      });

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
          this.config.objectIds.badgeRegistry = badgeRegistry.objectId;
          return badgeRegistry.objectId;
        }
      }

      throw new Error("BadgeRegistry not found in object changes");
    } catch (error) {
      console.error("❌ Badge system setup failed:", error.message);
      throw error;
    }
  }

  // Record attendance with pattern tracking for bonus achievements
  async recordAttendanceForBadges(
    userAddress,
    eventId,
    eventType,
    checkInHour
  ) {
    console.log("\n📝 RECORDING ATTENDANCE FOR BADGE SYSTEM");
    console.log("=========================================");
    console.log(`👤 User: ${userAddress}`);
    console.log(`🎯 Event: ${eventId}`);
    console.log(`⏰ Check-in Hour: ${checkInHour}`);

    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${this.config.packageId}::attendance_nft::record_attendance_for_badges`,
        arguments: [
          transaction.object(this.config.objectIds.badgeRegistry),
          transaction.pure.address(userAddress),
          transaction.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(eventId))
          ),
          transaction.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(eventType))
          ),
          transaction.pure.u64(checkInHour),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction,
      });

      console.log("✅ Attendance recorded successfully!");
      console.log("📋 Transaction:", result.digest);

      return result;
    } catch (error) {
      console.error("❌ Recording attendance failed:", error.message);
      throw error;
    }
  }
}
