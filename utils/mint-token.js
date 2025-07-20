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
    treasuryCap:
      "0xb6167580a389592a05ca549094b0a9ff108eb206be42601f5ae826c07b4fc3c5",
  },
};

// Add export statement for initializeSystem
export async function initializeSystem() {
  const client = new IotaClient({ url: getFullnodeUrl("testnet") });
  const adminKeyBytes = Buffer.from(CONFIG.keys.adminPrivateKey, "base64");
  const adminPrivateKeyBytes = adminKeyBytes.slice(1);
  const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyBytes);
  const adminAddress = adminKeypair.getPublicKey().toIotaAddress();
  return { client, adminKeypair, adminAddress };
}

// Add export statement for showCurrentTokens
export async function showCurrentTokens() {
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

// Add export statement for mintAttendanceToken
export async function mintAttendanceToken(recipientAddress, courseId = "CS101") {
  console.log("\n🪙 MINTING ATTENDANCE TOKEN");
  console.log("===========================");
  console.log(`Recipient: ${recipientAddress}, Course: ${courseId}`);

  try {
    const { client, adminKeypair } = await initializeSystem();
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${CONFIG.packageId}::attendance_system::manual_attendance_entry`,
      arguments: [
        transaction.object(CONFIG.objectIds.attendanceSystem),
        transaction.object(CONFIG.objectIds.tokenPolicy),
        transaction.pure.address(recipientAddress),
        transaction.pure.vector(
          "u8",
          Array.from(new TextEncoder().encode(courseId))
        ),
        transaction.pure.vector(
          "u8",
          Array.from(new TextEncoder().encode("Manual mint for testing"))
        ),
      ],
    });
    const result = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction,
    });
    console.log("✅ Token minted and issued successfully!");
    console.log(`📋 Transaction: ${result.digest}`);
    return result;
  } catch (error) {
    console.error("❌ Minting failed:", error.message);
    return null;
  }
}

// Add export statement for mintMultipleTokens
export async function mintMultipleTokens(
  recipientAddress,
  count = 1,
  courseId = "CS101"
) {
  console.log("\n🪙 MINTING MULTIPLE ATTENDANCE TOKENS");
  console.log("===================================");
  console.log(`Recipient: ${recipientAddress}`);
  console.log(`Number of tokens: ${count}`);
  console.log(`Course: ${courseId}`);
  console.log("");

  let successCount = 0;
  for (let i = 0; i < count; i++) {
    try {
      console.log(`Minting token ${i + 1} of ${count}...`);
      const result = await mintAttendanceToken(recipientAddress, courseId);
      if (result) successCount++;
      // Small delay between mints to avoid rate limiting
      if (i < count - 1)
        await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to mint token ${i + 1}:`, error.message);
    }
  }

  console.log(
    `\n✨ Successfully minted ${successCount} out of ${count} tokens`
  );
  return successCount;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let tokenCount = 1;
  let courseId = "CS101";

  // Check for --count or -n argument
  const countIndex = args.findIndex((arg) => arg === "--count" || arg === "-n");
  if (countIndex !== -1 && args[countIndex + 1]) {
    tokenCount = parseInt(args[countIndex + 1]);
    if (isNaN(tokenCount) || tokenCount < 1) {
      console.error("❌ Invalid token count. Using default count of 1.");
      tokenCount = 1;
    }
  }

  // Check for --course or -c argument
  const courseIndex = args.findIndex(
    (arg) => arg === "--course" || arg === "-c"
  );
  if (courseIndex !== -1 && args[courseIndex + 1]) {
    courseId = args[courseIndex + 1];
  }

  console.log("🏆 UNIVERSITY ATTENDANCE TOKEN - MINTING DEMO");
  console.log("============================================");
  console.log("");

  try {
    // Step 1: Show current tokens
    const currentTokens = await showCurrentTokens();

    // Step 2: Mint new tokens
    console.log(`\n🪙 Minting ${tokenCount} new token(s)...`);
    const { adminAddress } = await initializeSystem();
    await mintMultipleTokens(adminAddress, tokenCount, courseId);

    // Step 3: Show updated balance
    console.log("\n📊 UPDATED BALANCE:");
    console.log("==================");
    await showCurrentTokens();
  } catch (error) {
    console.error("💥 Operation failed:", error);
  }
}

// Show usage instructions if --help or -h is provided
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: node mint-token.js [options]

Options:
  --count, -n <number>   Number of tokens to mint (default: 1)
  --course, -c <id>      Course ID (default: CS101)
  --help, -h             Show this help message

Examples:
  node mint-token.js
  node mint-token.js --count 3
  node mint-token.js -n 5 -c CS202
  `);
  process.exit(0);
}

// Run the demo
main().catch(console.error);
