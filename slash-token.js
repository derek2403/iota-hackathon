import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const CONFIG = {
  packageId:
    "0x4a667c9e87ac840f721c2ff27db84b9c1da273f25cc33027831047d7e02b7525",
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
  },
  objectIds: {
    tokenPolicy:
      "0x6076b8cf9033f2c7cb7cc6625c8042bbe6890a3bf371e9d5413e507c8a62b677",
    attendanceSystem:
      "0x6ad36b1f43446d4df45e5bc7a5c617334ae269e071b7cc43a9b4ea52d6fe847f",
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

async function showCurrentTokens() {
  console.log("💰 CURRENT CLT TOKEN BALANCE");
  console.log("============================");

  try {
    const { client, adminAddress } = await initializeSystem();

    const tokenObjects = await client.getOwnedObjects({
      owner: adminAddress,
      filter: {
        StructType: `0x2::token::Token<${CONFIG.packageId}::attendance_token::ATTENDANCE_TOKEN>`,
      },
      options: { showContent: true, showType: true },
    });

    console.log(`👤 Admin Address: ${adminAddress}`);
    console.log(`🪙 CLT Tokens Owned: ${tokenObjects.data.length}`);
    console.log("");

    tokenObjects.data.forEach((token, index) => {
      console.log(`Token ${index + 1}: ${token.data.objectId}`);
    });

    return tokenObjects.data;
  } catch (error) {
    console.error("❌ Error checking tokens:", error.message);
    return [];
  }
}

async function slashToken(tokenId) {
  console.log("\n⚠️ SLASHING TOKEN");
  console.log("=================");
  console.log(`🎯 Slashing token: ${tokenId}`);

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();

    const transaction = new Transaction();

    transaction.moveCall({
      target: `${CONFIG.packageId}::attendance_system::apply_penalty`,
      arguments: [
        transaction.object(CONFIG.objectIds.attendanceSystem),
        transaction.object(CONFIG.objectIds.tokenPolicy),
        transaction.pure.address(adminAddress),
        transaction.object(tokenId),
        transaction.pure.vector(
          "u8",
          Array.from(
            new TextEncoder().encode("DEMO: Late to class - penalty applied")
          )
        ),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction,
    });

    console.log("✅ Token slashed successfully!");
    console.log(`🔥 Token ${tokenId} has been destroyed`);
    console.log(`📋 Transaction: ${result.digest}`);

    return result;
  } catch (error) {
    console.error("❌ Slashing failed:", error.message);
    return null;
  }
}

async function main() {
  console.log("🏆 UNIVERSITY ATTENDANCE TOKEN - SLASHING DEMO");
  console.log("=============================================");
  console.log("");

  try {
    // Step 1: Show current tokens
    const currentTokens = await showCurrentTokens();

    // Step 2: Slash a token if any exist
    if (currentTokens.length > 0) {
      console.log("\n🎯 Slashing the first available token...");
      await slashToken(currentTokens[0].data.objectId);

      // Show updated balance
      console.log("\n📊 UPDATED BALANCE:");
      console.log("==================");
      await showCurrentTokens();
    } else {
      console.log("\n❌ No tokens available to slash!");
      console.log("First mint some tokens using mint-token.js");
    }
  } catch (error) {
    console.error("💥 Operation failed:", error);
  }
}

// Run the demo
main().catch(console.error);
