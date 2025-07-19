import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client";
import { Ed25519Keypair } from "@iota/iota-sdk/keypairs/ed25519";
import { Transaction } from "@iota/iota-sdk/transactions";

const CONFIG = {
  packageId:
    "0xa3e446eecba022d0c60d6243e8dfe8763820764e23c3a2870fa6b324f411fc64",
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

async function showMyNFTs() {
  console.log("🖼️ MY NFT COLLECTION");
  console.log("===================");

  try {
    const { client, adminAddress } = await initializeSystem();

    const nftObjects = await client.getOwnedObjects({
      owner: adminAddress,
      filter: {
        StructType: `${CONFIG.packageId}::devnet_nft::DevNetNFT`,
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

async function mintNFT(name, description, imageUrl) {
  console.log("\n🎨 MINTING NEW NFT");
  console.log("=================");
  console.log(`Name: ${name}`);
  console.log(`Description: ${description}`);
  console.log(`Image URL: ${imageUrl}`);

  try {
    const { client, adminKeypair } = await initializeSystem();
    const transaction = new Transaction();

    transaction.moveCall({
      target: `${CONFIG.packageId}::devnet_nft::mint_to_sender`,
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

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let name = "IOTA DevNet NFT #1";
  let description = "A unique NFT on IOTA DevNet";
  let imageUrl = "https://example.com/nft.jpg";

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--name":
      case "-n":
        name = args[++i] || name;
        break;
      case "--description":
      case "-d":
        description = args[++i] || description;
        break;
      case "--url":
      case "-u":
        imageUrl = args[++i] || imageUrl;
        break;
    }
  }

  console.log("🎨 IOTA DEVNET NFT - MINTING DEMO");
  console.log("=================================");
  console.log("");

  try {
    // Step 1: Show current NFTs
    await showMyNFTs();

    // Step 2: Mint new NFT
    await mintNFT(name, description, imageUrl);

    // Step 3: Show updated collection
    console.log("\n📊 UPDATED COLLECTION:");
    console.log("====================");
    await showMyNFTs();
  } catch (error) {
    console.error("💥 Operation failed:", error);
  }
}

// Show usage instructions if --help or -h is provided
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Usage: node mint-nft.js [options]

Options:
  --name, -n <text>         NFT name (default: "IOTA DevNet NFT #1")
  --description, -d <text>  NFT description (default: "A unique NFT on IOTA DevNet")
  --url, -u <url>          Image URL (default: "https://example.com/nft.jpg")
  --help, -h               Show this help message

Examples:
  node mint-nft.js
  node mint-nft.js --name "Cool NFT" --description "My awesome NFT"
  node mint-nft.js -n "Rare NFT" -u "https://my-nft-image.com/1.jpg"
  `);
  process.exit(0);
}

// Run the demo
main().catch(console.error);
