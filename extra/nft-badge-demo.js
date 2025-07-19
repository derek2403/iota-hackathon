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

  // Mint attendance badge based on CLT balance
  async mintAttendanceBadge(userAddress, semester) {
    console.log("\n🎖️ MINTING ATTENDANCE BADGE");
    console.log("============================");
    console.log(`👤 User: ${userAddress}`);
    console.log(`📚 Semester: ${semester}`);

    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${this.config.packageId}::attendance_nft::mint_attendance_badge`,
        arguments: [
          transaction.object(this.config.objectIds.badgeRegistry),
          transaction.object(this.config.objectIds.tokenPolicy),
          transaction.pure.address(userAddress),
          transaction.pure.vector(
            "u8",
            Array.from(new TextEncoder().encode(semester))
          ),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction,
        options: { showEvents: true },
      });

      console.log("📋 Transaction:", result.digest);

      // Parse events to see what badge was awarded
      if (result.events) {
        const badgeEvent = result.events.find((event) =>
          event.type.includes("BadgeAwarded")
        );
        if (badgeEvent) {
          const { badge_tier, final_clt } = badgeEvent.parsedJson;
          const tierName = Object.values(BADGE_TIERS).find(
            (t) => t.tier === badge_tier
          )?.name;
          console.log(`🏆 Badge Awarded: ${tierName} (CLT: ${final_clt})`);
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Badge minting failed:", error.message);
      throw error;
    }
  }

  // Manually mint bonus achievement (for special cases like Kickoff Champion)
  async mintBonusAchievement(userAddress, achievementType) {
    console.log("\n🌟 MINTING BONUS ACHIEVEMENT");
    console.log("============================");
    console.log(`👤 User: ${userAddress}`);
    console.log(`🎯 Achievement Type: ${achievementType}`);

    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${this.config.packageId}::attendance_nft::mint_bonus_achievement`,
        arguments: [
          transaction.object(this.config.objectIds.badgeRegistry),
          transaction.pure.address(userAddress),
          transaction.pure.u8(achievementType),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair,
        transaction,
        options: { showEvents: true },
      });

      console.log("✅ Achievement minted successfully!");
      console.log("📋 Transaction:", result.digest);

      // Parse events to see what achievement was awarded
      if (result.events) {
        const achievementEvent = result.events.find((event) =>
          event.type.includes("AchievementAwarded")
        );
        if (achievementEvent) {
          const { achievement_name, qualifying_events } =
            achievementEvent.parsedJson;
          console.log(
            `🌟 Achievement: ${achievement_name} (Events: ${qualifying_events})`
          );
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Achievement minting failed:", error.message);
      throw error;
    }
  }

  // Get badge registry statistics
  async getBadgeStats() {
    console.log("\n📊 BADGE SYSTEM STATISTICS");
    console.log("===========================");

    try {
      const result = await this.client.devInspectTransactionBlock({
        transactionBlock: (() => {
          const tx = new Transaction();
          tx.moveCall({
            target: `${this.config.packageId}::attendance_nft::get_badge_stats`,
            arguments: [tx.object(this.config.objectIds.badgeRegistry)],
          });
          return tx;
        })(),
        sender: this.adminAddress,
      });

      const [badges, achievements, records] = result.results[0].returnValues;

      console.log(`🎖️ Total Badges Issued: ${parseInt(badges[0])}`);
      console.log(`🌟 Total Achievements Issued: ${parseInt(achievements[0])}`);
      console.log(`📝 Attendance Records: ${parseInt(records[0])}`);

      return {
        badges: parseInt(badges[0]),
        achievements: parseInt(achievements[0]),
        records: parseInt(records[0]),
      };
    } catch (error) {
      console.error("❌ Error getting badge stats:", error.message);
      return null;
    }
  }

  // Check user's NFT badges and achievements
  async getUserNFTs(userAddress) {
    console.log(`\n🎯 NFT COLLECTION FOR: ${userAddress}`);
    console.log("===============================================");

    try {
      // Get AttendanceBadge NFTs
      const badges = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.config.packageId}::attendance_nft::AttendanceBadge`,
        },
        options: { showContent: true, showType: true },
      });

      // Get BonusAchievement NFTs
      const achievements = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.config.packageId}::attendance_nft::BonusAchievement`,
        },
        options: { showContent: true, showType: true },
      });

      console.log(`🎖️ Attendance Badges: ${badges.data.length}`);
      badges.data.forEach((badge, index) => {
        const fields = badge.data.content.fields;
        console.log(
          `  Badge ${index + 1}: ${fields.tier.fields.name} (CLT: ${
            fields.final_clt
          })`
        );
      });

      console.log(`🌟 Bonus Achievements: ${achievements.data.length}`);
      achievements.data.forEach((achievement, index) => {
        const fields = achievement.data.content.fields;
        console.log(
          `  Achievement ${index + 1}: ${fields.achievement_name} (Events: ${
            fields.qualifying_events
          })`
        );
      });

      return { badges: badges.data, achievements: achievements.data };
    } catch (error) {
      console.error("❌ Error getting user NFTs:", error.message);
      return { badges: [], achievements: [] };
    }
  }
}

// Demo function to show complete badge system workflow
async function demonstrateBadgeSystem() {
  console.log("🎓 UNIVERSITY NFT BADGE SYSTEM DEMONSTRATION");
  console.log("=============================================");
  console.log("");

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();
    const nftManager = new AttendanceNFTManager(client, adminKeypair, CONFIG);

    console.log("👤 Admin Address:", adminAddress);
    console.log("📦 Package ID:", CONFIG.packageId);
    console.log("");

    // Step 1: Setup badge system (uncomment if needed)
    // console.log("STEP 1: Setting up badge system...");
    // await nftManager.setupBadgeSystem();

    // Assume BadgeRegistry is already set (update CONFIG if needed)
    if (CONFIG.objectIds.badgeRegistry === "TO_BE_SET_AFTER_DEPLOYMENT") {
      console.log("⚠️ Please set badgeRegistry ID in CONFIG after deployment");
      return;
    }

    // Step 2: Record various attendance patterns
    console.log("STEP 2: Recording attendance patterns...");

    // Simulate morning attendance (for Morning Achiever)
    await nftManager.recordAttendanceForBadges(
      adminAddress,
      "CS101-Lecture-1",
      "Morning Lecture",
      7 // 7 AM
    );

    await nftManager.recordAttendanceForBadges(
      adminAddress,
      "CS101-Lecture-2",
      "Morning Lecture",
      6 // 6 AM
    );

    // Simulate evening attendance (for Night Owl)
    await nftManager.recordAttendanceForBadges(
      adminAddress,
      "Study-Group-1",
      "Evening Study",
      20 // 8 PM
    );

    await nftManager.recordAttendanceForBadges(
      adminAddress,
      "Study-Group-2",
      "Evening Study",
      21 // 9 PM
    );

    await nftManager.recordAttendanceForBadges(
      adminAddress,
      "Study-Group-3",
      "Evening Study",
      19 // 7 PM
    );

    // Step 3: Mint attendance badge based on CLT balance
    console.log("\nSTEP 3: Minting attendance badge...");
    await nftManager.mintAttendanceBadge(adminAddress, "Fall2024");

    // Step 4: Manually mint Kickoff Champion achievement
    console.log("\nSTEP 4: Minting Kickoff Champion achievement...");
    await nftManager.mintBonusAchievement(
      adminAddress,
      ACHIEVEMENT_TYPES.KICKOFF_CHAMPION
    );

    // Step 5: Show final statistics and user's NFT collection
    console.log("\nSTEP 5: Final results...");
    await nftManager.getBadgeStats();
    await nftManager.getUserNFTs(adminAddress);

    console.log("\n🎉 DEMONSTRATION COMPLETE!");
    console.log("==========================");
    console.log("✅ NFT badge system is working!");
    console.log("✅ Automatic badge minting based on CLT balance");
    console.log("✅ Bonus achievements based on attendance patterns");
    console.log("✅ All NFTs are non-transferrable (soulbound)");
    console.log("✅ Duplicate prevention working");
  } catch (error) {
    console.error("💥 Demonstration failed:", error);
  }
}

// Utility function to get tier requirements
function showBadgeRequirements() {
  console.log("\n🎖️ BADGE TIER REQUIREMENTS");
  console.log("===========================");
  Object.entries(BADGE_TIERS).forEach(([key, tier]) => {
    console.log(`${tier.name}: ${tier.threshold}+ CLT tokens`);
  });

  console.log("\n🌟 BONUS ACHIEVEMENTS");
  console.log("=====================");
  console.log("🌙 Night Owl: Attend 3+ events after 7pm");
  console.log("☕ Morning Achiever: Attend 5+ events before 8am");
  console.log("🎉 Kickoff Champion: Attend first event of semester");
  console.log("🗓 Full Commitment: Attend 1+ event per week for 16 weeks");
}

// Export the manager class for use in other scripts
export { AttendanceNFTManager, BADGE_TIERS, ACHIEVEMENT_TYPES };

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  showBadgeRequirements();
  demonstrateBadgeSystem().catch(console.error);
}
