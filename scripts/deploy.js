const hre = require("hardhat");

/**
 * Deploy CryptoRafts Smart Contracts to BNB Chain
 * 
 * This script deploys all three contracts:
 * 1. KYCVerification - For KYC data storage
 * 2. KYBVerification - For KYB data storage (VCs/influencers)
 * 3. ProjectRegistry - For project data storage after success
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */

async function main() {
  console.log("🚀 Deploying CryptoRafts Smart Contracts to BNB Chain...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

  // Deploy KYCVerification contract
  console.log("📄 Deploying KYCVerification contract...");
  const KYCVerification = await hre.ethers.getContractFactory("KYCVerification");
  const kycContract = await KYCVerification.deploy();
  await kycContract.waitForDeployment();
  const kycAddress = await kycContract.getAddress();
  console.log("✅ KYCVerification deployed to:", kycAddress);

  // Deploy KYBVerification contract
  console.log("\n📄 Deploying KYBVerification contract...");
  const KYBVerification = await hre.ethers.getContractFactory("KYBVerification");
  const kybContract = await KYBVerification.deploy();
  await kybContract.waitForDeployment();
  const kybAddress = await kybContract.getAddress();
  console.log("✅ KYBVerification deployed to:", kybAddress);

  // Deploy ProjectRegistry contract
  console.log("\n📄 Deploying ProjectRegistry contract...");
  const ProjectRegistry = await hre.ethers.getContractFactory("ProjectRegistry");
  const projectContract = await ProjectRegistry.deploy();
  await projectContract.waitForDeployment();
  const projectAddress = await projectContract.getAddress();
  console.log("✅ ProjectRegistry deployed to:", projectAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("KYC Verification:    ", kycAddress);
  console.log("KYB Verification:    ", kybAddress);
  console.log("Project Registry:    ", projectAddress);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Save addresses to file
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      kycVerification: kycAddress,
      kybVerification: kybAddress,
      projectRegistry: projectAddress,
    },
  };

  fs.writeFileSync(
    `deployments/${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("💾 Deployment info saved to:", `deployments/${hre.network.name}.json`);
  console.log("\n⚠️  IMPORTANT: Update your .env.local with these addresses:");
  console.log(`NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS=${kycAddress}`);
  console.log(`NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS=${kybAddress}`);
  console.log(`NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS=${projectAddress}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

