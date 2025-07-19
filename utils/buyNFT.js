import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const TOKEN_CONFIG = {
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

const NFT_CONFIG = {
  packageId:
    "0xa3e446eecba022d0c60d6243e8dfe8763820764e23c3a2870fa6b324f411fc64",
  keys: {
    adminPrivateKey: "ADbUxGsOWXMH52/NQ7/ZL+urTGpNzJ8lpCfiVRV95EGV",
  },
};

// Add export statement for initializeSystem
export async function initializeSystem() {
  const client = new IotaClient({ url: getFullnodeUrl("testnet") });
  const adminKeyBytes = Buffer.from(
    TOKEN_CONFIG.keys.adminPrivateKey,
    "base64"
  );
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
        StructType: `0x2::token::Token<${TOKEN_CONFIG.packageId}::attendance_token::ATTENDANCE_TOKEN>`,
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

// Add export statement for slashToken
export async function slashToken(tokenId) {
  console.log("\n⚠️ SLASHING TOKEN");
  console.log("=================");
  console.log(`🎯 Slashing token: ${tokenId}`);

  try {
    const { client, adminKeypair, adminAddress } = await initializeSystem();
    const transaction = new Transaction();

    transaction.moveCall({
      target: `${TOKEN_CONFIG.packageId}::attendance_system::apply_penalty`,
      arguments: [
        transaction.object(TOKEN_CONFIG.objectIds.attendanceSystem),
        transaction.object(TOKEN_CONFIG.objectIds.tokenPolicy),
        transaction.pure.address(adminAddress),
        transaction.object(tokenId),
        transaction.pure.vector(
          "u8",
          Array.from(
            new TextEncoder().encode("Token slashed for NFT conversion")
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

// Add export statement for mintNFT
export async function mintNFT(name, description, imageUrl) {
  console.log("\n🎨 MINTING NEW NFT");
  console.log("=================");
  console.log(`Name: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`Image URL: ${imageUrl}`);

  try {
    const { client, adminKeypair } = await initializeSystem();
    const transaction = new Transaction();

    transaction.moveCall({
      target: `${NFT_CONFIG.packageId}::devnet_nft::mint_to_sender`,
      arguments: [
        transaction.pure.vector(
          "u8",
          Array.from(new TextEncoder().encode(name))
        ),
        transaction.pure.vector(
          "u8",
          Array.from(new TextEncoder().encode(description))
        ),
        transaction.pure.vector(
          "u8",
          Array.from(new TextEncoder().encode(imageUrl))
        ),
      ],
    });

    const result = await client.signAndExecuteTransaction({
      signer: adminKeypair,
      transaction,
    });

    console.log("✅ NFT minted successfully!");
    console.log(`📋 Transaction: ${result.digest}`);
    return result;
  } catch (error) {
    console.error("❌ Minting failed:", error.message);
    return null;
  }
}

// Add export statement for showMyNFTs
export async function showMyNFTs() {
  console.log("🖼️ MY NFT COLLECTION");
  console.log("===================");

  try {
    const { client, adminAddress } = await initializeSystem();

    const nftObjects = await client.getOwnedObjects({
      owner: adminAddress,
      filter: {
        StructType: `${NFT_CONFIG.packageId}::devnet_nft::DevNetNFT`,
      },
      options: { showContent: true, showType: true },
    });

    console.log(`👤 Address: ${adminAddress}`);
    console.log(`🎨 NFTs Owned: ${nftObjects.data.length}`);
    console.log("");

    nftObjects.data.forEach((nft, index) => {
      console.log(`NFT ${index + 1}: ${nft.data.objectId}`);
      if (nft.data.content) {
        console.log(`  Name: ${nft.data.content.name || "Unnamed"}`);
        console.log(
          `  Description: ${nft.data.content.description || "No description"}`
        );
        console.log(`  URL: ${nft.data.content.url || "No URL"}`);
        console.log("");
      }
    });

    return nftObjects.data;
  } catch (error) {
    console.error("❌ Error checking NFTs:", error.message);
    return [];
  }
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let nftName = "Converted Token NFT";
  let nftDescription = "NFT created from slashed token";
  let nftImageUrl = "https://example.com/nft.jpg";

  // Parse arguments for NFT details
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--name":
      case "-n":
        nftName = args[++i] || nftName;
        break;
      case "--description":
      case "-d":
        nftDescription = args[++i] || nftDescription;
        break;
      case "--url":
      case "-u":
        nftImageUrl = args[++i] || nftImageUrl;
        break;
    }
  }

  console.log("🔄 TOKEN TO NFT CONVERSION FLOW");
  console.log("==============================");
  console.log("");

  try {
    // Step 1: Check for tokens
    console.log("Step 1: Checking for tokens...");
    const currentTokens = await showCurrentTokens();

    if (currentTokens.length === 0) {
      console.log("\n❌ No tokens available to convert!");
      console.log("Please mint some tokens using mint-token.js first");
      return;
    }

    // Step 2: Slash the first available token
    console.log("\nStep 2: Slashing token for conversion...");
    const slashResult = await slashToken(currentTokens[0].data.objectId);

    if (!slashResult) {
      console.log("❌ Failed to slash token. Aborting conversion.");
      return;
    }

    // Step 3: Mint new NFT
    console.log("\nStep 3: Minting commemorative NFT...");
    const mintResult = await mintNFT(nftName, nftDescription, nftImageUrl);

    if (!mintResult) {
      console.log("❌ Failed to mint NFT.");
      return;
    }

    // Step 4: Show final NFT collection
    console.log("\nStep 4: Showing updated NFT collection...");
    await showMyNFTs();
  } catch (error) {
    console.error("💥 Operation failed:", error);
  }
}

// Show usage instructions if --help or -h is provided
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: node token-to-nft-flow.js [options]

Options:
  --name, -n <text>         NFT name (default: "Converted Token NFT")
  --description, -d <text>  NFT description (default: "NFT created from slashed token")
  --url, -u <url>          Image URL (default: "https://example.com/nft.jpg")
  --help, -h               Show this help message

Examples:
  node token-to-nft-flow.js
  node token-to-nft-flow.js --name "My Converted NFT" --description "Special NFT from token conversion"
  node token-to-nft-flow.js -n "Achievement NFT" -u "https://my-nft-image.com/1.jpg"
  `);
  process.exit(0);
}

// Run the flow
main().catch(console.error);
