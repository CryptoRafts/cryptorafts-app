/**
 * BNB Chain On-Chain Data Storage Utilities
 * 
 * This module provides functions for storing hashed and salted data on BNB Smart Chain (BSC).
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 * 
 * Data Storage Strategy:
 * - Public data: Off-chain (backend database)
 * - Sensitive KYC/KYB data: Hashed and stored on BNB Chain
 * - Project data (after success): Hashed and stored on BNB Chain
 * - Raw data: Deleted after on-chain storage
 */

import { getBNBChainRPC, getBNBChainConfig, PRIMARY_BNB_CHAIN } from './bnb-chain';
import { ethers } from 'ethers';
import crypto from 'crypto';
import { 
  KYC_VERIFICATION_ABI, 
  KYB_VERIFICATION_ABI, 
  PROJECT_REGISTRY_ABI 
} from './contracts/abis';

/**
 * Hash and salt sensitive data for on-chain storage on BNB Chain
 * @param data - Sensitive data to hash
 * @param salt - Optional salt (generated if not provided)
 * @returns Object containing hash and salt
 */
export function hashAndSaltForBNBChain(data: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(data + generatedSalt)
    .digest('hex');
  
  return { hash, salt: generatedSalt };
}

/**
 * Store KYC verification hash on BNB Smart Chain
 * @param kycHash - Hashed KYC data (hex string)
 * @param userId - User ID
 * @param approvalStatus - Approval status
 * @param signer - Ethers signer (admin wallet) - required for on-chain storage
 * @returns Transaction hash on BNB Chain
 */
export async function storeKYCOnBNBChain(
  kycHash: string,
  userId: string,
  approvalStatus: boolean,
  signer?: ethers.Signer
): Promise<string> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYC contract address not configured');
  }

  // If no signer provided, this is a read-only operation
  if (!signer) {
    throw new Error('Signer required for on-chain storage. This function must be called from backend with admin wallet.');
  }

  // Connect signer to BNB Chain network
  const connectedSigner = signer.connect(provider);
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, KYC_VERIFICATION_ABI, connectedSigner);
  
  // Convert hash string to bytes32
  const kycHashBytes32 = ethers.hexlify(ethers.toUtf8Bytes(kycHash.slice(0, 32))).padEnd(66, '0');
  
  // Store on BNB Smart Chain
  const tx = await contract.storeKYCVerification(userId, kycHashBytes32, approvalStatus);
  
  // Wait for transaction confirmation
  await tx.wait();
  
  return tx.hash;
}

/**
 * Store KYB verification hash on BNB Smart Chain
 * @param emailHash - Hashed email address (hex string)
 * @param userId - User ID
 * @param approvalStatus - Approval status
 * @param signer - Ethers signer (admin wallet) - required for on-chain storage
 * @returns Transaction hash on BNB Chain
 */
export async function storeKYBOnBNBChain(
  emailHash: string,
  userId: string,
  approvalStatus: boolean,
  signer?: ethers.Signer
): Promise<string> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain KYB contract address not configured');
  }

  // If no signer provided, this is a read-only operation
  if (!signer) {
    throw new Error('Signer required for on-chain storage. This function must be called from backend with admin wallet.');
  }

  // Connect signer to BNB Chain network
  const connectedSigner = signer.connect(provider);
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, KYB_VERIFICATION_ABI, connectedSigner);
  
  // Convert hash string to bytes32
  const emailHashBytes32 = ethers.hexlify(ethers.toUtf8Bytes(emailHash.slice(0, 32))).padEnd(66, '0');
  
  // Store on BNB Smart Chain
  const tx = await contract.storeKYBVerification(userId, emailHashBytes32, approvalStatus);
  
  // Wait for transaction confirmation
  await tx.wait();
  
  return tx.hash;
}

/**
 * Store project data hash on BNB Smart Chain after successful funding/launch
 * @param projectHash - Hashed project data (pitch, deal flow, etc.) - hex string
 * @param projectId - Project ID
 * @param launchDate - Confirmed launch date (Unix timestamp)
 * @param signer - Ethers signer (admin wallet) - required for on-chain storage
 * @returns Transaction hash on BNB Chain
 */
export async function storeProjectDataOnBNBChain(
  projectHash: string,
  projectId: string,
  launchDate: number | Date,
  signer?: ethers.Signer
): Promise<string> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get contract address from environment (deployed on BNB Chain)
  const contractAddress = process.env.NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS;
  if (!contractAddress) {
    throw new Error('BNB Chain Project Registry contract address not configured');
  }

  // If no signer provided, this is a read-only operation
  if (!signer) {
    throw new Error('Signer required for on-chain storage. This function must be called from backend with admin wallet.');
  }

  // Connect signer to BNB Chain network
  const connectedSigner = signer.connect(provider);
  
  // Create contract instance
  const contract = new ethers.Contract(contractAddress, PROJECT_REGISTRY_ABI, connectedSigner);
  
  // Convert hash string to bytes32
  const projectHashBytes32 = ethers.hexlify(ethers.toUtf8Bytes(projectHash.slice(0, 32))).padEnd(66, '0');
  
  // Convert launch date to Unix timestamp
  const launchTimestamp = typeof launchDate === 'number' 
    ? launchDate 
    : Math.floor(launchDate.getTime() / 1000);
  
  // Store on BNB Smart Chain
  const tx = await contract.storeProjectData(projectId, projectHashBytes32, launchTimestamp);
  
  // Wait for transaction confirmation
  await tx.wait();
  
  return tx.hash;
}

/**
 * Verify data hash exists on BNB Smart Chain
 * @param hash - Hash to verify
 * @param contractType - Type of contract (KYC, KYB, or Project)
 * @returns Verification result
 */
export async function verifyHashOnBNBChain(
  hash: string,
  contractType: 'KYC' | 'KYB' | 'Project'
): Promise<boolean> {
  // Connect to BNB Smart Chain (BSC)
  const provider = new ethers.JsonRpcProvider(getBNBChainRPC());
  
  // Get appropriate contract address based on type
  let contractAddress: string | undefined;
  switch (contractType) {
    case 'KYC':
      contractAddress = process.env.NEXT_PUBLIC_BNB_KYC_CONTRACT_ADDRESS;
      break;
    case 'KYB':
      contractAddress = process.env.NEXT_PUBLIC_BNB_KYB_CONTRACT_ADDRESS;
      break;
    case 'Project':
      contractAddress = process.env.NEXT_PUBLIC_BNB_PROJECT_REGISTRY_ADDRESS;
      break;
  }

  if (!contractAddress) {
    throw new Error(`BNB Chain ${contractType} contract address not configured`);
  }

  // TODO: Implement smart contract verification
  // const contract = new ethers.Contract(contractAddress, ABI, provider);
  // const exists = await contract.verifyHash(hash);
  // return exists;

  // Placeholder: Return mock verification
  return true;
}

/**
 * Get BNB Chain transaction URL for verification
 * @param txHash - Transaction hash on BNB Chain
 * @returns Block explorer URL
 */
export function getBNBChainTransactionUrl(txHash: string): string {
  const config = getBNBChainConfig('bsc');
  return `${config.blockExplorerUrls[0]}/tx/${txHash}`;
}

/**
 * Process KYC data for on-chain storage on BNB Chain
 * This function implements the KYC data storage strategy:
 * 1. Hash and salt sensitive documents
 * 2. Store hash on BNB Smart Chain
 * 3. Return transaction hash
 */
export async function processKYCForBNBChain(
  frontId: string,
  backId: string,
  proofOfAddress: string,
  selfie: string,
  userId: string
): Promise<{ txHash: string; hashes: Record<string, string> }> {
  // Hash and salt each document
  const frontIdHash = hashAndSaltForBNBChain(frontId);
  const backIdHash = hashAndSaltForBNBChain(backId);
  const proofHash = hashAndSaltForBNBChain(proofOfAddress);
  const selfieHash = hashAndSaltForBNBChain(selfie);

  // Store on BNB Smart Chain
  const txHash = await storeKYCOnBNBChain(
    `${frontIdHash.hash}${backIdHash.hash}${proofHash.hash}${selfieHash.hash}`,
    userId,
    true // Approved by admin
  );

  return {
    txHash,
    hashes: {
      frontId: frontIdHash.hash,
      backId: backIdHash.hash,
      proofOfAddress: proofHash.hash,
      selfie: selfieHash.hash,
    },
  };
}

/**
 * Process project data for on-chain storage on BNB Chain after success
 * This function implements the project data storage strategy:
 * 1. Hash and salt project data
 * 2. Store hash on BNB Smart Chain
 * 3. Return transaction hash
 */
export async function processProjectDataForBNBChain(
  projectData: {
    pitch: string;
    dealFlow: string;
    fundingInfo: string;
    projectDetails: string;
  },
  projectId: string,
  launchDate: Date
): Promise<{ txHash: string; hash: string }> {
  // Combine all project data
  const combinedData = JSON.stringify(projectData);
  
  // Hash and salt
  const { hash } = hashAndSaltForBNBChain(combinedData);

  // Store on BNB Smart Chain
  const txHash = await storeProjectDataOnBNBChain(hash, projectId, launchDate);

  return { txHash, hash };
}

