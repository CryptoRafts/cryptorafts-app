/**
 * Test CryptoRafts Contracts on BSC Testnet
 * 
 * This script runs comprehensive tests on deployed contracts.
 * Run this after deploying to testnet.
 * 
 * Usage:
 *   npx hardhat run scripts/testnet-test.js --network bscTestnet
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing CryptoRafts contracts on BSC Testnet...\n");

  // Load contract addresses
  const addressesPath = path.join(__dirname, "..", "testnet-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error("❌ testnet-addresses.json not found!");
    console.error("   Run testnet-deploy.js first");
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const [deployer] = await ethers.getSigners();

  console.log("📝 Testing with account:", deployer.address);
  console.log("📋 Contract addresses:", JSON.stringify(addresses.contracts, null, 2));
  console.log();

  const testResults = {
    kyc: {},
    kyb: {},
    errors: [],
  };

  try {
    // Test KYC Contract
    console.log("🔍 Testing KYCVerification contract...\n");
    const KYCVerification = await ethers.getContractAt(
      "KYCVerification",
      addresses.contracts.kycVerification
    );

    // Test 1: Store KYC
    console.log("Test 1: Store KYC data...");
    try {
      const testUserId = "test-user-" + Date.now();
      const frontIdHash = "0x" + "a".repeat(64);
      const backIdHash = "0x" + "b".repeat(64);
      const proofHash = "0x" + "c".repeat(64);
      const liveSnapHash = "0x" + "d".repeat(64);

      const storeTx = await KYCVerification.storeKYCVerification(
        testUserId,
        frontIdHash,
        backIdHash,
        proofHash,
        liveSnapHash,
        true
      );
      await storeTx.wait();
      console.log("✅ KYC stored:", storeTx.hash);
      testResults.kyc.store = "PASS";

      // Verify storage
      const [frontId, backId, proof, liveSnap, approved, deleted, timestamp] =
        await KYCVerification.getKYCVerification(testUserId);
      
      if (frontId === frontIdHash && !deleted) {
        console.log("✅ KYC data verified");
      } else {
        throw new Error("KYC data mismatch");
      }

      // Test 2: Delete KYC
      console.log("\nTest 2: Delete KYC data...");
      const deleteTx = await KYCVerification.deleteKYCVerification(testUserId);
      await deleteTx.wait();
      console.log("✅ KYC deleted:", deleteTx.hash);
      testResults.kyc.delete = "PASS";

      // Verify deletion
      const [frontId2, backId2, proof2, liveSnap2, approved2, deleted2, timestamp2] =
        await KYCVerification.getKYCVerification(testUserId);
      
      if (deleted2 && frontId2 === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("✅ KYC deletion verified (hashes are zero)");
      } else {
        throw new Error("KYC deletion failed");
      }

      // Test 3: Check status
      console.log("\nTest 3: Check KYC status...");
      const [exists, approvedStatus, deletedStatus] = await KYCVerification.checkKYCStatus(testUserId);
      if (exists && deletedStatus) {
        console.log("✅ Status check passed");
        testResults.kyc.status = "PASS";
      } else {
        throw new Error("Status check failed");
      }

    } catch (error) {
      console.error("❌ KYC test failed:", error.message);
      testResults.kyc.error = error.message;
      testResults.errors.push(`KYC: ${error.message}`);
    }

    // Test KYB Contract
    console.log("\n🔍 Testing KYBVerification contract...\n");
    const KYBVerification = await ethers.getContractAt(
      "KYBVerification",
      addresses.contracts.kybVerification
    );

    // Test 1: Store KYB
    console.log("Test 1: Store KYB data...");
    try {
      const testOrgId = "test-org-" + Date.now();
      const phoneHash = "0x" + "1".repeat(64);
      const emailHash = "0x" + "2".repeat(64);

      const storeTx = await KYBVerification.storeKYBVerification(
        testOrgId,
        phoneHash,
        emailHash,
        true
      );
      await storeTx.wait();
      console.log("✅ KYB stored:", storeTx.hash);
      testResults.kyb.store = "PASS";

      // Verify storage
      const [phone, email, approved, deleted, timestamp] =
        await KYBVerification.getKYBVerification(testOrgId);
      
      if (phone === phoneHash && !deleted) {
        console.log("✅ KYB data verified");
      } else {
        throw new Error("KYB data mismatch");
      }

      // Test 2: Delete KYB
      console.log("\nTest 2: Delete KYB data...");
      const deleteTx = await KYBVerification.deleteKYBVerification(testOrgId);
      await deleteTx.wait();
      console.log("✅ KYB deleted:", deleteTx.hash);
      testResults.kyb.delete = "PASS";

      // Verify deletion
      const [phone2, email2, approved2, deleted2, timestamp2] =
        await KYBVerification.getKYBVerification(testOrgId);
      
      if (deleted2 && phone2 === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("✅ KYB deletion verified (hashes are zero)");
      } else {
        throw new Error("KYB deletion failed");
      }

      // Test 3: Check status
      console.log("\nTest 3: Check KYB status...");
      const [exists, approvedStatus, deletedStatus] = await KYBVerification.checkKYBStatus(testOrgId);
      if (exists && deletedStatus) {
        console.log("✅ Status check passed");
        testResults.kyb.status = "PASS";
      } else {
        throw new Error("Status check failed");
      }

    } catch (error) {
      console.error("❌ KYB test failed:", error.message);
      testResults.kyb.error = error.message;
      testResults.errors.push(`KYB: ${error.message}`);
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Results Summary");
    console.log("=".repeat(50));
    console.log("\nKYC Contract:");
    console.log("  Store:", testResults.kyc.store || "NOT TESTED");
    console.log("  Delete:", testResults.kyc.delete || "NOT TESTED");
    console.log("  Status:", testResults.kyc.status || "NOT TESTED");

    console.log("\nKYB Contract:");
    console.log("  Store:", testResults.kyb.store || "NOT TESTED");
    console.log("  Delete:", testResults.kyb.delete || "NOT TESTED");
    console.log("  Status:", testResults.kyb.status || "NOT TESTED");

    if (testResults.errors.length > 0) {
      console.log("\n❌ Errors:");
      testResults.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
      console.log("\n⚠️  Some tests failed. Fix issues before deploying to mainnet.");
    } else {
      console.log("\n✅ All contract tests passed!");
      console.log("✅ Ready for integration testing with backend");
    }

    // Save test results
    const resultsPath = path.join(__dirname, "..", "testnet-test-results.json");
    testResults.testedAt = new Date().toISOString();
    testResults.contractAddresses = addresses.contracts;
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log("\n📝 Test results saved to:", resultsPath);

  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


