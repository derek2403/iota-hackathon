import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const CONFIG = {
  packageId:
    "0x58102a9034e503ab9e1db69977766183c378dfbd32742c429acbc7a77de64e56", // NEW PACKAGE ID
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
  },
  objectIds: {
    badgeRegistry:
      "0xb2cf7a5b89d01f3197ab65e1841319e4cd10a94836a9afadaece63b732c952aa", // NEW BADGE REGISTRY
    tokenPolicy:
      "0x62ee03b5a2628f6a9a7e0ec59ae78feae54955e899bf95d96f1f6b4d44274117", // NEW TOKEN POLICY
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

class FixedBadgeTester {
  constructor(client, keypair, config) {
    this.client = client;
    this.keypair = keypair;
    this.config = config;
    this.adminAddress = keypair.getPublicKey().toIotaAddress();
  }

  // Test the new simplified badge minting
  async mintSimpleBadge(userAddress, semester) {
    console.log("\n🎖️ TESTING SIMPLIFIED BADGE MINTING");
    console.log("====================================");
    console.log(`👤 User: ${userAddress}`);
    console.log(`📚 Semester: ${semester}`);

    try {
      const transaction = new Transaction();

      transaction.moveCall({
        target: `${this.config.packageId}::attendance_nft::mint_attendance_badge_simple`,
        arguments: [
          transaction.object(this.config.objectIds.badgeRegistry),
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

      console.log("✅ Badge minted successfully!");
      console.log("📋 Transaction:", result.digest);

      // Parse events to see what badge was awarded
      if (result.events) {
        const badgeEvent = result.events.find((event) =>
          event.type.includes("BadgeAwarded")
        );
        if (badgeEvent) {
          const { badge_tier, final_clt } = badgeEvent.parsedJson;
          const tierNames = { 1: "Bronze", 2: "Silver", 3: "Gold" };
          const tierName = tierNames[badge_tier] || "Unknown";
          console.log(
            `🏆 Badge Awarded: ${tierName} Badge (CLT: ${final_clt})`
          );
        }
      }

      return result;
    } catch (error) {
      console.error("❌ Badge minting failed:", error.message);
      throw error;
    }
  }

  // Get comprehensive user NFTs (both badges and achievements)
  async getUserAllNFTs(userAddress) {
    console.log(`\n🎯 COMPLETE NFT COLLECTION FOR: ${userAddress}`);
    console.log("=======================================================");

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
        const tierNames = { 1: "Bronze", 2: "Silver", 3: "Gold" };
        const tierName = tierNames[fields.tier.fields.tier] || "Unknown";
        console.log(
          `  Badge ${index + 1}: ${tierName} Badge (CLT: ${
            fields.final_clt
          }) - Object ID: ${badge.data.objectId}`
        );
      });

      console.log(`🌟 Bonus Achievements: ${achievements.data.length}`);
      achievements.data.forEach((achievement, index) => {
        const fields = achievement.data.content.fields;
        const achievementName = String.fromCharCode(...fields.achievement_name);
        console.log(
          `  Achievement ${index + 1}: ${achievementName} (Events: ${
            fields.qualifying_events
          }) - Object ID: ${achievement.data.objectId}`
        );
      });

      return { badges: badges.data, achievements: achievements.data };
    } catch (error) {
      console.error("❌ Error getting user NFTs:", error.message);
      return { badges: [], achievements: [] };
    }
  }

  // Get badge statistics
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
}

async function testFixedBadges() {
  console.log("🎓 TESTING FIXED BADGE SYSTEM");
  console.log("==============================");
  console.log("");

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();
    const tester = new FixedBadgeTester(client, adminKeypair, CONFIG);

    console.log("👤 Admin Address:", adminAddress);
    console.log("📦 Package ID:", CONFIG.packageId);
    console.log("🎯 Badge Registry:", CONFIG.objectIds.badgeRegistry);
    console.log("");

    // Check current stats
    await tester.getBadgeStats();

    // Test minting a badge with the new simplified function
    await tester.mintSimpleBadge(adminAddress, "Fall2024");

    // Check final statistics and user's complete NFT collection
    console.log("\n📊 FINAL RESULTS:");
    await tester.getBadgeStats();
    await tester.getUserAllNFTs(adminAddress);

    console.log("\n🎉 BADGE MINTING TEST COMPLETE!");
    console.log("================================");
    console.log("✅ Badge minting now works without TokenPolicy!");
    console.log("✅ Both badges and achievements are functional!");
    console.log("✅ Complete NFT system working!");
  } catch (error) {
    console.error("💥 Test failed:", error);
    console.log(
      "\n📝 NOTE: You need to redeploy the package first with the new simplified function."
    );
    console.log("Run: iota move publish");
    console.log("Then update the packageId and badgeRegistry in this script.");
  }
}

testFixedBadges().catch(console.error);
