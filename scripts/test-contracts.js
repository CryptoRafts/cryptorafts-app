const hre = require("hardhat");
const { ethers } = require("ethers");
const crypto = require("crypto");

/**
 * Test KYC and KYB Smart Contracts on BSC Testnet
 * 
 * This script tests the updated contracts with separate hashes for:
 * KYC: Front ID, Back ID, Proof of Address, Live Snap
 * KYB: Phone Number, Email
 */

// Helper function to hash and salt data
function hashAndSalt(data, salt) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(data + generatedSalt)
    .digest('hex');
  return { hash, salt: generatedSalt };
}

// Helper to convert hex string to bytes32
function hexToBytes32(hexString) {
  // Remove '0x' if present
  const cleanHex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
  // Take first 64 characters (32 bytes)
  const truncated = cleanHex.slice(0, 64);
  // Pad to 66 characters (0x + 64 hex chars)
  return '0x' + truncated.padEnd(64, '0');
}

async function main() {
  console.log("🧪 Testing KYC and KYB Contracts on BSC Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Testing with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB\n");

  // Get contract addresses from deployment
  const fs = require("fs");
  const deploymentFile = `deployments/${hre.network.name}.json`;
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please deploy contracts first.");
    console.log("Run: npx hardhat run scripts/deploy.js --network bscTestnet");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const kycAddress = deployment.contracts.kycVerification;
  const kybAddress = deployment.contracts.kybVerification;

  console.log("📋 Contract Addresses:");
  console.log("KYC Verification:", kycAddress);
  console.log("KYB Verification:", kybAddress);
  console.log("");

  // Get contract instances
  const KYCVerification = await hre.ethers.getContractFactory("KYCVerification");
  const KYBVerification = await hre.ethers.getContractFactory("KYBVerification");
  
  const kycContract = KYCVerification.attach(kycAddress);
  const kybContract = KYBVerification.attach(kybAddress);

  // Test KYC Contract
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔐 Testing KYC Contract");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const testUserId = "test-user-" + Date.now();
  
  // Create test data (simulating document content)
  const frontIdData = "FRONT_ID_CARD_DATA_" + testUserId;
  const backIdData = "BACK_ID_CARD_DATA_" + testUserId;
  const proofOfAddressData = "PROOF_OF_ADDRESS_DATA_" + testUserId;
  const liveSnapData = "LIVE_SNAP_SELFIE_DATA_" + testUserId;

  // Hash and salt each document
  const frontIdHash = hashAndSalt(frontIdData);
  const backIdHash = hashAndSalt(backIdData);
  const proofHash = hashAndSalt(proofOfAddressData);
  const liveSnapHash = hashAndSalt(liveSnapData);

  console.log("📄 Hashing KYC documents...");
  console.log("Front ID Hash:", frontIdHash.hash);
  console.log("Back ID Hash:", backIdHash.hash);
  console.log("Proof of Address Hash:", proofHash.hash);
  console.log("Live Snap Hash:", liveSnapHash.hash);
  console.log("");

  // Convert to bytes32
  const frontIdBytes32 = hexToBytes32(frontIdHash.hash);
  const backIdBytes32 = hexToBytes32(backIdHash.hash);
  const proofBytes32 = hexToBytes32(proofHash.hash);
  const liveSnapBytes32 = hexToBytes32(liveSnapHash.hash);

  // Store KYC data
  console.log("💾 Storing KYC data on-chain...");
  const kycTx = await kycContract.storeKYCVerification(
    testUserId,
    frontIdBytes32,
    backIdBytes32,
    proofBytes32,
    liveSnapBytes32,
    true // approved
  );
  console.log("⏳ Waiting for transaction confirmation...");
  await kycTx.wait();
  console.log("✅ KYC data stored! Transaction:", kycTx.hash);
  console.log("");

  // Retrieve and verify KYC data
  console.log("🔍 Retrieving KYC data...");
  const kycData = await kycContract.getKYCVerification(testUserId);
  console.log("Front ID Hash (on-chain):", kycData[0]);
  console.log("Back ID Hash (on-chain):", kycData[1]);
  console.log("Proof of Address Hash (on-chain):", kycData[2]);
  console.log("Live Snap Hash (on-chain):", kycData[3]);
  console.log("Approved:", kycData[4]);
  console.log("Timestamp:", new Date(Number(kycData[5]) * 1000).toISOString());
  console.log("");

  // Verify hashes match
  const hashesMatch = 
    kycData[0].toLowerCase() === frontIdBytes32.toLowerCase() &&
    kycData[1].toLowerCase() === backIdBytes32.toLowerCase() &&
    kycData[2].toLowerCase() === proofBytes32.toLowerCase() &&
    kycData[3].toLowerCase() === liveSnapBytes32.toLowerCase();
  
  console.log(hashesMatch ? "✅ All KYC hashes match!" : "❌ Hash mismatch detected!");
  console.log("");

  // Test KYB Contract
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏢 Testing KYB Contract");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const testVCId = "test-vc-" + Date.now();
  
  // Create test data
  const phoneData = "+1234567890";
  const emailData = "test@example.com";

  // Hash and salt
  const phoneHash = hashAndSalt(phoneData);
  const emailHash = hashAndSalt(emailData);

  console.log("📄 Hashing KYB data...");
  console.log("Phone Hash:", phoneHash.hash);
  console.log("Email Hash:", emailHash.hash);
  console.log("");

  // Convert to bytes32
  const phoneBytes32 = hexToBytes32(phoneHash.hash);
  const emailBytes32 = hexToBytes32(emailHash.hash);

  // Store KYB data
  console.log("💾 Storing KYB data on-chain...");
  const kybTx = await kybContract.storeKYBVerification(
    testVCId,
    phoneBytes32,
    emailBytes32,
    true // approved
  );
  console.log("⏳ Waiting for transaction confirmation...");
  await kybTx.wait();
  console.log("✅ KYB data stored! Transaction:", kybTx.hash);
  console.log("");

  // Retrieve and verify KYB data
  console.log("🔍 Retrieving KYB data...");
  const kybData = await kybContract.getKYBVerification(testVCId);
  console.log("Phone Hash (on-chain):", kybData[0]);
  console.log("Email Hash (on-chain):", kybData[1]);
  console.log("Approved:", kybData[2]);
  console.log("Timestamp:", new Date(Number(kybData[3]) * 1000).toISOString());
  console.log("");

  // Verify hashes match
  const kybHashesMatch = 
    kybData[0].toLowerCase() === phoneBytes32.toLowerCase() &&
    kybData[1].toLowerCase() === emailBytes32.toLowerCase();
  
  console.log(kybHashesMatch ? "✅ All KYB hashes match!" : "❌ Hash mismatch detected!");
  console.log("");

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 TEST SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("KYC Test:", hashesMatch ? "✅ PASSED" : "❌ FAILED");
  console.log("KYB Test:", kybHashesMatch ? "✅ PASSED" : "❌ FAILED");
  console.log("");
  console.log("📊 Test Results:");
  console.log("- KYC stores: Front ID, Back ID, Proof of Address, Live Snap");
  console.log("- KYB stores: Phone Number, Email");
  console.log("- All data is hashed and salted before storage");
  console.log("- Hashes are stored separately on-chain");
  console.log("");

  // View on explorer
  const network = await hre.ethers.provider.getNetwork();
  const explorer = network.chainId === 97n 
    ? "https://testnet.bscscan.com"
    : "https://bscscan.com";
  
  console.log("🔗 View transactions on explorer:");
  console.log(`KYC: ${explorer}/tx/${kycTx.hash}`);
  console.log(`KYB: ${explorer}/tx/${kybTx.hash}`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


