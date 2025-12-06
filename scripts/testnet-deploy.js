/**
 * Deploy CryptoRafts Contracts to BSC Testnet
 * 
 * This script deploys all contracts to BSC Testnet for testing.
 * Run this before deploying to mainnet.
 * 
 * Usage:
 *   npx hardhat run scripts/testnet-deploy.js --network bscTestnet
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Deploying CryptoRafts contracts to BSC Testnet...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "BNB");
  
  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance! Get testnet BNB from:");
    console.error("   https://testnet.bnbchain.org/faucet-smart");
    process.exit(1);
  }
  console.log();

  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name);
  console.log("🔗 Chain ID:", Number(network.chainId));
  
  if (Number(network.chainId) !== 97) {
    console.error("❌ Wrong network! This script is for BSC Testnet (Chain ID 97)");
    process.exit(1);
  }
  console.log();

  const addresses = {
    network: "BSC Testnet",
    chainId: 97,
    deployer: deployer.address,
    contracts: {},
    deployedAt: new Date().toISOString(),
  };

  try {
    // Deploy KYCVerification
    console.log("📄 Deploying KYCVerification contract...");
    const KYCVerification = await ethers.getContractFactory("KYCVerification");
    const kycContract = await KYCVerification.deploy();
    await kycContract.waitForDeployment();
    const kycAddress = await kycContract.getAddress();
    addresses.contracts.kycVerification = kycAddress;
    console.log("✅ KYCVerification deployed to:", kycAddress);
    console.log("🔗 View on BSCScan Testnet:", `https://testnet.bscscan.com/address/${kycAddress}\n`);

    // Deploy KYBVerification
    console.log("📄 Deploying KYBVerification contract...");
    const KYBVerification = await ethers.getContractFactory("KYBVerification");
    const kybContract = await KYBVerification.deploy();
    await kybContract.waitForDeployment();
    const kybAddress = await kybContract.getAddress();
    addresses.contracts.kybVerification = kybAddress;
    console.log("✅ KYBVerification deployed to:", kybAddress);
    console.log("🔗 View on BSCScan Testnet:", `https://testnet.bscscan.com/address/${kybAddress}\n`);

    // Deploy ProjectRegistry
    console.log("📄 Deploying ProjectRegistry contract...");
    const ProjectRegistry = await ethers.getContractFactory("ProjectRegistry");
    const projectContract = await ProjectRegistry.deploy();
    await projectContract.waitForDeployment();
    const projectAddress = await projectContract.getAddress();
    addresses.contracts.projectRegistry = projectAddress;
    console.log("✅ ProjectRegistry deployed to:", projectAddress);
    console.log("🔗 View on BSCScan Testnet:", `https://testnet.bscscan.com/address/${projectAddress}\n`);

    // Verify ownership
    console.log("🔍 Verifying contract ownership...");
    const kycOwner = await kycContract.owner();
    const kybOwner = await kybContract.owner();
    const projectOwner = await projectContract.owner();
    
    if (kycOwner === deployer.address && kybOwner === deployer.address && projectOwner === deployer.address) {
      console.log("✅ All contracts owned by deployer\n");
    } else {
      console.error("❌ Ownership verification failed!");
      process.exit(1);
    }

    // Save addresses
    const addressesPath = path.join(__dirname, "..", "testnet-addresses.json");
    fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
    console.log("📋 Contract addresses saved to:", addressesPath);
    console.log("\n📋 Contract Addresses:");
    console.log(JSON.stringify(addresses, null, 2));

    console.log("\n🎉 All contracts deployed successfully to BSC Testnet!");
    console.log("\n📝 Next Steps:");
    console.log("1. Verify contracts on BSCScan Testnet");
    console.log("2. Update .env.testnet with contract addresses");
    console.log("3. Run complete test suite (see TESTNET_TESTING_GUIDE.md)");
    console.log("4. After all tests pass, deploy to mainnet");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


