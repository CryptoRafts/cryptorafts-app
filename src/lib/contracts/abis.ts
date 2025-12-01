/**
 * Smart Contract ABIs for BNB Chain Integration
 * 
 * These ABIs are generated from the deployed contracts on BNB Smart Chain (BSC)
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */

// KYC Verification Contract ABI
export const KYC_VERIFICATION_ABI = [
  "function storeKYCVerification(string memory userId, bytes32 kycHash, bool approved)",
  "function updateKYCVerification(string memory userId, bytes32 newKycHash)",
  "function getKYCVerification(string memory userId) view returns (bytes32 kycHash, bool approved, uint256 timestamp)",
  "function checkKYCStatus(string memory userId) view returns (bool exists, bool approved)",
  "function owner() view returns (address)",
  "event KYCStored(string indexed userId, bytes32 indexed kycHash, bool approved, uint256 timestamp)",
  "event KYCUpdated(string indexed userId, bytes32 indexed newKycHash, uint256 timestamp)",
] as const;

// KYB Verification Contract ABI
export const KYB_VERIFICATION_ABI = [
  "function storeKYBVerification(string memory userId, bytes32 emailHash, bool approved)",
  "function updateKYBVerification(string memory userId, bytes32 newEmailHash)",
  "function getKYBVerification(string memory userId) view returns (bytes32 emailHash, bool approved, uint256 timestamp)",
  "function checkKYBStatus(string memory userId) view returns (bool exists, bool approved)",
  "function owner() view returns (address)",
  "event KYBStored(string indexed userId, bytes32 indexed emailHash, bool approved, uint256 timestamp)",
  "event KYBUpdated(string indexed userId, bytes32 indexed newEmailHash, uint256 timestamp)",
] as const;

// Project Registry Contract ABI
export const PROJECT_REGISTRY_ABI = [
  "function storeProjectData(string memory projectId, bytes32 projectHash, uint256 launchDate)",
  "function confirmLaunchDate(string memory projectId, uint256 launchDate)",
  "function markProjectLaunched(string memory projectId)",
  "function updateProjectData(string memory projectId, bytes32 newProjectHash)",
  "function getProjectData(string memory projectId) view returns (bytes32 projectHash, uint256 launchDate, uint256 timestamp, bool launched)",
  "function getLaunchConfirmers(string memory projectId) view returns (address[] memory confirmers)",
  "function checkProjectStatus(string memory projectId) view returns (bool exists, bool launched)",
  "function owner() view returns (address)",
  "event ProjectStored(string indexed projectId, bytes32 indexed projectHash, uint256 launchDate, uint256 timestamp)",
  "event LaunchDateConfirmed(string indexed projectId, uint256 launchDate, address confirmedBy)",
] as const;

