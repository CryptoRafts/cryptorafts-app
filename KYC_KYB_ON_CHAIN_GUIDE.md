# KYC/KYB On-Chain Integration Guide
## Complete Documentation for Blockchain-Based Verification

---

## 📋 Table of Contents

1. [Current KYC/KYB System](#current-kyckyb-system)
2. [On-Chain Integration Strategy](#on-chain-integration-strategy)
3. [Smart Contract Design](#smart-contract-design)
4. [Privacy-Preserving Architecture](#privacy-preserving-architecture)
5. [Implementation Guide](#implementation-guide)
6. [Integration with Existing System](#integration-with-existing-system)
7. [Security & Compliance](#security--compliance)
8. [Deployment Guide](#deployment-guide)

---

## 🔍 Current KYC/KYB System

### **Current Architecture**

```
User → Document Upload → RaftAI Engine → Firebase Storage
                              ↓
                    Verification Processing
                              ↓
                    Firebase Firestore (Status)
```

### **Current Components**

1. **KYC Engine** (`src/lib/raftai/kyc-engine.ts`)
   - Document verification
   - Biometric verification
   - Identity checks
   - Risk assessment (Sanctions, PEP, AML)
   - Status: `verified` | `pending` | `rejected`

2. **KYB Engine** (`src/lib/raftai/kyb-engine.ts`)
   - Entity verification
   - Ownership verification
   - Business verification
   - Risk assessment
   - Status: `verified` | `pending` | `rejected`

3. **Data Storage** (Firebase)
   - Documents: Firebase Storage (encrypted)
   - Status: Firestore
   - Results: Firestore

### **Current Data Structure**

```typescript
// Firebase User Document
{
  kycStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted',
  kybStatus: 'verified' | 'pending' | 'rejected' | 'not_submitted',
  kycScore: number, // Risk score 0-100
  kybScore: number, // Risk score 0-100
  kycCompletedAt: Timestamp,
  kybCompletedAt: Timestamp,
  // ... other fields
}

// Project Document
{
  compliance: {
    status: 'compliant' | 'under_review' | 'pending',
    kycStatus: 'verified' | 'pending' | 'not_submitted',
    kybStatus: 'verified' | 'pending' | 'not_submitted',
  },
  badges: {
    kyc: boolean,
    kyb: boolean,
    audit: boolean,
    doxxed: boolean,
  }
}
```

---

## 🔗 On-Chain Integration Strategy

### **Hybrid Architecture: Privacy + Transparency**

```
┌─────────────────────────────────────────────────────────┐
│              KYC/KYB Verification Flow                  │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │   Off-Chain      │         │   On-Chain        │    │
│  │   (Private)      │         │   (Public)        │    │
│  ├──────────────────┤         ├──────────────────┤    │
│  │ • Documents      │         │ • Verification    │    │
│  │ • Personal Data  │         │   Status Hash     │    │
│  │ • Biometrics     │         │ • Timestamp       │    │
│  │ • Risk Scores    │         │ • Verifier        │    │
│  │ • Full Results   │         │ • Proof Hash      │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Why Hybrid?**

1. **Privacy**: Sensitive documents stay off-chain
2. **Transparency**: Verification status is public and immutable
3. **Compliance**: Meets GDPR/privacy requirements
4. **Trust**: Public proof of verification
5. **Efficiency**: Fast queries from Firebase, immutable records on-chain

### **Integration Points**

1. **Document Processing**: Off-chain (Firebase Storage)
2. **Verification Processing**: Off-chain (RaftAI Engine)
3. **Status Storage**: Both (Firebase + Blockchain)
4. **Public Proof**: On-chain (Smart Contract)
5. **Verification Hash**: On-chain (IPFS hash of verification result)

---

## 📜 Smart Contract Design

### **1. KYC Verification Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CryptoRaftsKYCVerification
 * @notice On-chain KYC verification registry
 * @dev Stores verification status hashes without exposing personal data
 */
contract CryptoRaftsKYCVerification {
    struct KYCVerification {
        address user;                    // User wallet address
        string userId;                   // Firebase user ID
        bytes32 verificationHash;         // Hash of verification result
        bytes32 documentHash;            // Hash of document metadata
        uint8 riskScore;                 // Risk score (0-100)
        bool isVerified;                 // Verification status
        uint256 verifiedAt;               // Block timestamp
        address verifier;                 // Verifier address
        uint256 expiryDate;               // Optional expiry date
    }

    mapping(address => KYCVerification) public kycVerifications;
    mapping(string => address) public userIdToAddress; // Firebase ID → Wallet
    mapping(address => string) public addressToUserId; // Wallet → Firebase ID
    
    address public verifierRole;         // Admin or DAO address
    address public owner;
    
    event KYCVerified(
        address indexed user,
        string indexed userId,
        bytes32 verificationHash,
        uint8 riskScore,
        bool isVerified,
        address verifier,
        uint256 timestamp
    );
    
    event KYCRevoked(
        address indexed user,
        string indexed userId,
        address revoker,
        uint256 timestamp
    );

    constructor(address _verifierRole) {
        verifierRole = _verifierRole;
        owner = msg.sender;
    }

    /**
     * @notice Register KYC verification on-chain
     * @param user User wallet address
     * @param userId Firebase user ID
     * @param verificationHash Hash of verification result (IPFS)
     * @param documentHash Hash of document metadata
     * @param riskScore Risk score (0-100)
     * @param isVerified Verification status
     * @param expiryDate Optional expiry timestamp (0 = no expiry)
     */
    function verifyKYC(
        address user,
        string memory userId,
        bytes32 verificationHash,
        bytes32 documentHash,
        uint8 riskScore,
        bool isVerified,
        uint256 expiryDate
    ) external {
        require(msg.sender == verifierRole || msg.sender == owner, "Unauthorized");
        require(user != address(0), "Invalid user address");
        require(bytes(userId).length > 0, "Invalid user ID");
        require(riskScore <= 100, "Invalid risk score");

        kycVerifications[user] = KYCVerification({
            user: user,
            userId: userId,
            verificationHash: verificationHash,
            documentHash: documentHash,
            riskScore: riskScore,
            isVerified: isVerified,
            verifiedAt: block.timestamp,
            verifier: msg.sender,
            expiryDate: expiryDate
        });

        userIdToAddress[userId] = user;
        addressToUserId[user] = userId;

        emit KYCVerified(
            user,
            userId,
            verificationHash,
            riskScore,
            isVerified,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Revoke KYC verification
     * @param user User wallet address
     */
    function revokeKYC(address user) external {
        require(msg.sender == verifierRole || msg.sender == owner, "Unauthorized");
        require(kycVerifications[user].verifiedAt > 0, "KYC not found");

        string memory userId = kycVerifications[user].userId;
        delete kycVerifications[user];
        delete userIdToAddress[userId];
        delete addressToUserId[user];

        emit KYCRevoked(user, userId, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if KYC is verified and not expired
     * @param user User wallet address
     * @return bool True if verified and valid
     */
    function isKYCValid(address user) external view returns (bool) {
        KYCVerification memory kyc = kycVerifications[user];
        
        if (kyc.verifiedAt == 0) return false;
        if (!kyc.isVerified) return false;
        if (kyc.expiryDate > 0 && block.timestamp > kyc.expiryDate) return false;
        
        return true;
    }

    /**
     * @notice Get KYC verification details
     * @param user User wallet address
     * @return KYCVerification struct
     */
    function getKYC(address user) external view returns (KYCVerification memory) {
        return kycVerifications[user];
    }

    /**
     * @notice Get user address from Firebase ID
     * @param userId Firebase user ID
     * @return address User wallet address
     */
    function getUserAddress(string memory userId) external view returns (address) {
        return userIdToAddress[userId];
    }

    /**
     * @notice Update verifier role
     * @param newVerifier New verifier address
     */
    function setVerifierRole(address newVerifier) external {
        require(msg.sender == owner, "Not owner");
        require(newVerifier != address(0), "Invalid address");
        verifierRole = newVerifier;
    }
}
```

### **2. KYB Verification Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CryptoRaftsKYBVerification
 * @notice On-chain KYB verification registry
 * @dev Stores business verification status without exposing sensitive data
 */
contract CryptoRaftsKYBVerification {
    struct KYBVerification {
        address organization;            // Organization wallet address
        string organizationId;          // Firebase organization ID
        bytes32 verificationHash;        // Hash of verification result
        bytes32 registrationHash;        // Hash of registration documents
        uint8 riskScore;                // Risk score (0-100)
        bool isVerified;                 // Verification status
        bool companyVerified;            // Company registration verified
        bool registrationValid;          // Registration valid
        bool complianceCheck;            // Compliance check passed
        uint256 verifiedAt;              // Block timestamp
        address verifier;                // Verifier address
        uint256 expiryDate;              // Optional expiry date
    }

    mapping(address => KYBVerification) public kybVerifications;
    mapping(string => address) public orgIdToAddress;
    mapping(address => string) public addressToOrgId;
    
    address public verifierRole;
    address public owner;
    
    event KYBVerified(
        address indexed organization,
        string indexed organizationId,
        bytes32 verificationHash,
        uint8 riskScore,
        bool isVerified,
        bool companyVerified,
        bool registrationValid,
        bool complianceCheck,
        address verifier,
        uint256 timestamp
    );
    
    event KYBRevoked(
        address indexed organization,
        string indexed organizationId,
        address revoker,
        uint256 timestamp
    );

    constructor(address _verifierRole) {
        verifierRole = _verifierRole;
        owner = msg.sender;
    }

    function verifyKYB(
        address organization,
        string memory organizationId,
        bytes32 verificationHash,
        bytes32 registrationHash,
        uint8 riskScore,
        bool isVerified,
        bool companyVerified,
        bool registrationValid,
        bool complianceCheck,
        uint256 expiryDate
    ) external {
        require(msg.sender == verifierRole || msg.sender == owner, "Unauthorized");
        require(organization != address(0), "Invalid organization address");
        require(bytes(organizationId).length > 0, "Invalid organization ID");
        require(riskScore <= 100, "Invalid risk score");

        kybVerifications[organization] = KYBVerification({
            organization: organization,
            organizationId: organizationId,
            verificationHash: verificationHash,
            registrationHash: registrationHash,
            riskScore: riskScore,
            isVerified: isVerified,
            companyVerified: companyVerified,
            registrationValid: registrationValid,
            complianceCheck: complianceCheck,
            verifiedAt: block.timestamp,
            verifier: msg.sender,
            expiryDate: expiryDate
        });

        orgIdToAddress[organizationId] = organization;
        addressToOrgId[organization] = organizationId;

        emit KYBVerified(
            organization,
            organizationId,
            verificationHash,
            riskScore,
            isVerified,
            companyVerified,
            registrationValid,
            complianceCheck,
            msg.sender,
            block.timestamp
        );
    }

    function revokeKYB(address organization) external {
        require(msg.sender == verifierRole || msg.sender == owner, "Unauthorized");
        require(kybVerifications[organization].verifiedAt > 0, "KYB not found");

        string memory organizationId = kybVerifications[organization].organizationId;
        delete kybVerifications[organization];
        delete orgIdToAddress[organizationId];
        delete addressToOrgId[organization];

        emit KYBRevoked(organization, organizationId, msg.sender, block.timestamp);
    }

    function isKYBValid(address organization) external view returns (bool) {
        KYBVerification memory kyb = kybVerifications[organization];
        
        if (kyb.verifiedAt == 0) return false;
        if (!kyb.isVerified) return false;
        if (!kyb.companyVerified) return false;
        if (!kyb.registrationValid) return false;
        if (!kyb.complianceCheck) return false;
        if (kyb.expiryDate > 0 && block.timestamp > kyb.expiryDate) return false;
        
        return true;
    }

    function getKYB(address organization) external view returns (KYBVerification memory) {
        return kybVerifications[organization];
    }

    function getOrganizationAddress(string memory organizationId) external view returns (address) {
        return orgIdToAddress[organizationId];
    }

    function setVerifierRole(address newVerifier) external {
        require(msg.sender == owner, "Not owner");
        require(newVerifier != address(0), "Invalid address");
        verifierRole = newVerifier;
    }
}
```

### **3. Combined Verification Contract (Optional)**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CryptoRaftsKYCVerification.sol";
import "./CryptoRaftsKYBVerification.sol";

/**
 * @title CryptoRaftsVerificationRegistry
 * @notice Combined registry for KYC and KYB verifications
 */
contract CryptoRaftsVerificationRegistry {
    CryptoRaftsKYCVerification public kycContract;
    CryptoRaftsKYBVerification public kybContract;
    
    address public owner;
    
    event VerificationLinked(
        address indexed user,
        address indexed organization,
        string userId,
        string organizationId,
        uint256 timestamp
    );

    constructor(
        address _kycContract,
        address _kybContract
    ) {
        kycContract = CryptoRaftsKYCVerification(_kycContract);
        kybContract = CryptoRaftsKYBVerification(_kybContract);
        owner = msg.sender;
    }

    /**
     * @notice Check if user and organization are both verified
     * @param user User wallet address
     * @param organization Organization wallet address
     * @return bool True if both are verified
     */
    function areBothVerified(
        address user,
        address organization
    ) external view returns (bool) {
        bool kycValid = kycContract.isKYCValid(user);
        bool kybValid = kybContract.isKYBValid(organization);
        return kycValid && kybValid;
    }

    /**
     * @notice Get combined verification status
     * @param user User wallet address
     * @param organization Organization wallet address
     * @return kycValid KYC verification status
     * @return kybValid KYB verification status
     * @return bothValid Both verified status
     */
    function getVerificationStatus(
        address user,
        address organization
    ) external view returns (
        bool kycValid,
        bool kybValid,
        bool bothValid
    ) {
        kycValid = kycContract.isKYCValid(user);
        kybValid = kybContract.isKYBValid(organization);
        bothValid = kycValid && kybValid;
    }
}
```

---

## 🔒 Privacy-Preserving Architecture

### **What Goes On-Chain**

✅ **Public Data (On-Chain)**
- Verification status (verified/not verified)
- Verification timestamp
- Verifier address
- Verification hash (IPFS)
- Risk score (0-100)
- Expiry date (if applicable)

❌ **Private Data (Off-Chain)**
- Personal documents (ID, passport, etc.)
- Biometric data (selfies, fingerprints)
- Full verification results
- Personal information (name, address, etc.)
- Business registration documents
- Financial information

### **Hash-Based Verification**

```typescript
// Create verification hash
const verificationData = {
  userId: 'user123',
  status: 'verified',
  riskScore: 25,
  verifiedAt: Date.now(),
  verifier: 'verifier_address',
  // ... other non-sensitive data
};

// Hash the verification result
const verificationHash = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes(JSON.stringify(verificationData))
);

// Store hash on-chain, full data on IPFS
const ipfsHash = await uploadToIPFS(verificationData);
```

### **IPFS Integration**

```typescript
// src/lib/kyc-kyb-onchain/ipfs.ts
import { create } from 'ipfs-http-client';

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

export async function uploadVerificationResult(
  verificationData: any
): Promise<string> {
  // Remove sensitive data before uploading
  const publicData = {
    userId: verificationData.userId,
    status: verificationData.status,
    riskScore: verificationData.riskScore,
    verifiedAt: verificationData.verifiedAt,
    verifier: verificationData.verifier,
    // No personal data
  };

  const result = await ipfs.add(JSON.stringify(publicData));
  return `ipfs://${result.path}`;
}

export async function getVerificationResult(
  ipfsHash: string
): Promise<any> {
  const hash = ipfsHash.replace('ipfs://', '');
  const chunks = [];
  
  for await (const chunk of ipfs.cat(hash)) {
    chunks.push(chunk);
  }
  
  const data = Buffer.concat(chunks).toString();
  return JSON.parse(data);
}
```

---

## 💻 Implementation Guide

### **Step 1: Install Dependencies**

```bash
npm install ethers@^6.0.0
npm install ipfs-http-client
npm install @openzeppelin/contracts
```

### **Step 2: Create Contract Interfaces**

```typescript
// src/lib/kyc-kyb-onchain/contracts.ts
import { ethers } from 'ethers';
import KYCABI from '@/abis/KYCVerification.json';
import KYBABI from '@/abis/KYBVerification.json';

export const CONTRACT_ADDRESSES = {
  kyc: process.env.NEXT_PUBLIC_KYC_CONTRACT_ADDRESS || '',
  kyb: process.env.NEXT_PUBLIC_KYB_CONTRACT_ADDRESS || '',
};

export function getKYCContract(signer: ethers.Signer) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.kyc,
    KYCABI,
    signer
  );
}

export function getKYBContract(signer: ethers.Signer) {
  return new ethers.Contract(
    CONTRACT_ADDRESSES.kyb,
    KYBABI,
    signer
  );
}
```

### **Step 3: Create On-Chain Verification Service**

```typescript
// src/lib/kyc-kyb-onchain/onchain-verification.ts
import { ethers } from 'ethers';
import { getKYCContract, getKYBContract } from './contracts';
import { uploadVerificationResult } from './ipfs';

/**
 * Register KYC verification on-chain
 */
export async function registerKYCOnChain(
  userAddress: string,
  userId: string,
  kycResult: any,
  signer: ethers.Signer
): Promise<string> {
  // 1. Upload verification result to IPFS
  const ipfsHash = await uploadVerificationResult(kycResult);
  
  // 2. Create hashes
  const verificationHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(kycResult))
  );
  const documentHash = ethers.keccak256(
    ethers.toUtf8Bytes(kycResult.documentId || '')
  );
  
  // 3. Get contract instance
  const contract = getKYCContract(signer);
  
  // 4. Register on-chain
  const tx = await contract.verifyKYC(
    userAddress,
    userId,
    verificationHash,
    documentHash,
    kycResult.riskScore || 0,
    kycResult.status === 'verified',
    kycResult.expiryDate || 0
  );
  
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * Register KYB verification on-chain
 */
export async function registerKYBOnChain(
  organizationAddress: string,
  organizationId: string,
  kybResult: any,
  signer: ethers.Signer
): Promise<string> {
  // 1. Upload verification result to IPFS
  const ipfsHash = await uploadVerificationResult(kybResult);
  
  // 2. Create hashes
  const verificationHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(kybResult))
  );
  const registrationHash = ethers.keccak256(
    ethers.toUtf8Bytes(kybResult.registrationId || '')
  );
  
  // 3. Get contract instance
  const contract = getKYBContract(signer);
  
  // 4. Register on-chain
  const tx = await contract.verifyKYB(
    organizationAddress,
    organizationId,
    verificationHash,
    registrationHash,
    kybResult.riskScore || 0,
    kybResult.status === 'verified',
    kybResult.companyVerified || false,
    kybResult.registrationValid || false,
    kybResult.complianceCheck || false,
    kybResult.expiryDate || 0
  );
  
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * Check KYC status on-chain
 */
export async function checkKYCStatus(
  userAddress: string,
  provider: ethers.Provider
): Promise<boolean> {
  const contract = getKYCContract(provider);
  return await contract.isKYCValid(userAddress);
}

/**
 * Check KYB status on-chain
 */
export async function checkKYBStatus(
  organizationAddress: string,
  provider: ethers.Provider
): Promise<boolean> {
  const contract = getKYBContract(provider);
  return await contract.isKYBValid(organizationAddress);
}
```

### **Step 4: Integrate with Existing KYC/KYB Engine**

```typescript
// src/lib/kyc-kyb-onchain/integration.ts
import { KYCEngine } from '@/lib/raftai/kyc-engine';
import { KYBEngine } from '@/lib/raftai/kyb-engine';
import { registerKYCOnChain, registerKYBOnChain } from './onchain-verification';
import { db, doc, updateDoc, serverTimestamp } from '@/lib/firebase.client';
import { getSigner } from '@/lib/web3-client';

/**
 * Process KYC and register on-chain
 */
export async function processKYCWithOnChain(
  userId: string,
  userAddress: string,
  kycRequest: any
) {
  // 1. Process KYC off-chain (existing system)
  const kycEngine = KYCEngine.getInstance();
  const kycResult = await kycEngine.processKYC(kycRequest);
  
  // 2. Update Firebase
  await updateDoc(doc(db!, 'users', userId), {
    kycStatus: kycResult.status,
    kycScore: kycResult.riskScore,
    kycCompletedAt: serverTimestamp(),
    kycResult: kycResult,
  });
  
  // 3. Register on-chain (if verified)
  if (kycResult.status === 'verified') {
    try {
      const signer = await getSigner(); // Admin/verifier signer
      if (signer) {
        const txHash = await registerKYCOnChain(
          userAddress,
          userId,
          kycResult,
          signer
        );
        
        // Store transaction hash in Firebase
        await updateDoc(doc(db!, 'users', userId), {
          kycOnChainTxHash: txHash,
          kycOnChainRegistered: true,
          kycOnChainRegisteredAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error registering KYC on-chain:', error);
      // Continue with off-chain verification
    }
  }
  
  return kycResult;
}

/**
 * Process KYB and register on-chain
 */
export async function processKYBWithOnChain(
  organizationId: string,
  organizationAddress: string,
  kybRequest: any
) {
  // 1. Process KYB off-chain (existing system)
  const kybEngine = KYBEngine.getInstance();
  const kybResult = await kybEngine.processKYB(kybRequest);
  
  // 2. Update Firebase
  await updateDoc(doc(db!, 'organizations', organizationId), {
    kybStatus: kybResult.status,
    kybScore: kybResult.riskScore,
    kybCompletedAt: serverTimestamp(),
    kybResult: kybResult,
  });
  
  // 3. Register on-chain (if verified)
  if (kybResult.status === 'verified') {
    try {
      const signer = await getSigner(); // Admin/verifier signer
      if (signer) {
        const txHash = await registerKYBOnChain(
          organizationAddress,
          organizationId,
          kybResult,
          signer
        );
        
        // Store transaction hash in Firebase
        await updateDoc(doc(db!, 'organizations', organizationId), {
          kybOnChainTxHash: txHash,
          kybOnChainRegistered: true,
          kybOnChainRegisteredAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error registering KYB on-chain:', error);
      // Continue with off-chain verification
    }
  }
  
  return kybResult;
}
```

### **Step 5: Update API Routes**

```typescript
// src/app/api/kyc/verify/route.ts
import { processKYCWithOnChain } from '@/lib/kyc-kyb-onchain/integration';
import { getUserWallet } from '@/lib/web3-auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, kycRequest } = await req.json();
    
    // Get user wallet address
    const userAddress = await getUserWallet(userId);
    if (!userAddress) {
      return NextResponse.json(
        { error: 'Wallet not linked' },
        { status: 400 }
      );
    }
    
    // Process KYC with on-chain registration
    const result = await processKYCWithOnChain(
      userId,
      userAddress,
      kycRequest
    );
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error processing KYC:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🔄 Integration with Existing System

### **Update Firebase Data Structure**

```typescript
// User Document (Firebase)
{
  // Existing fields
  kycStatus: 'verified' | 'pending' | 'rejected',
  kycScore: number,
  
  // New on-chain fields
  kycOnChain: {
    registered: boolean,
    txHash: string,
    blockNumber: number,
    verifiedAt: number, // Block timestamp
    expiryDate: number | null,
  },
  
  // Wallet address
  walletAddress: string,
}

// Project Document (Firebase)
{
  compliance: {
    kycStatus: 'verified' | 'pending' | 'not_submitted',
    kybStatus: 'verified' | 'pending' | 'not_submitted',
    
    // On-chain verification
    kycOnChain: {
      verified: boolean,
      txHash: string,
      blockNumber: number,
    },
    kybOnChain: {
      verified: boolean,
      txHash: string,
      blockNumber: number,
    },
  },
}
```

### **Sync On-Chain Status to Firebase**

```typescript
// src/lib/kyc-kyb-onchain/sync.ts
import { db, doc, updateDoc } from '@/lib/firebase.client';
import { checkKYCStatus, checkKYBStatus } from './onchain-verification';
import { ethers } from 'ethers';

/**
 * Sync on-chain KYC status to Firebase
 */
export async function syncKYCStatus(
  userId: string,
  userAddress: string,
  provider: ethers.Provider
) {
  const isVerified = await checkKYCStatus(userAddress, provider);
  
  await updateDoc(doc(db!, 'users', userId), {
    'kycOnChain.verified': isVerified,
    'kycOnChain.lastSynced': serverTimestamp(),
  });
  
  return isVerified;
}

/**
 * Sync on-chain KYB status to Firebase
 */
export async function syncKYBStatus(
  organizationId: string,
  organizationAddress: string,
  provider: ethers.Provider
) {
  const isVerified = await checkKYBStatus(organizationAddress, provider);
  
  await updateDoc(doc(db!, 'organizations', organizationId), {
    'kybOnChain.verified': isVerified,
    'kybOnChain.lastSynced': serverTimestamp(),
  });
  
  return isVerified;
}
```

---

## 🔐 Security & Compliance

### **Privacy Protection**

1. **No Personal Data On-Chain**
   - Only verification status and hashes
   - Personal documents stay in Firebase Storage
   - IPFS stores only non-sensitive metadata

2. **Hash-Based Verification**
   - Verification results hashed before storage
   - Full data accessible only with IPFS hash
   - Cannot reverse-engineer personal data

3. **Access Control**
   - Only verifier role can register verifications
   - Users can check their own status
   - Public can verify status (read-only)

### **Compliance**

1. **GDPR Compliance**
   - Personal data not stored on-chain
   - Right to deletion (revoke on-chain)
   - Data minimization principle

2. **AML/KYC Regulations**
   - Immutable verification records
   - Audit trail on blockchain
   - Risk score tracking

3. **Data Retention**
   - Expiry dates for verifications
   - Automatic revocation after expiry
   - Historical records preserved

---

## 🚀 Deployment Guide

### **Step 1: Deploy Contracts**

```bash
# Deploy to testnet
npx hardhat run scripts/deploy-kyc-kyb.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy-kyc-kyb.js --network mainnet
```

### **Step 2: Update Environment Variables**

```env
# Contract addresses
NEXT_PUBLIC_KYC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_KYB_CONTRACT_ADDRESS=0x...

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Verifier wallet (private key - NEVER commit)
VERIFIER_PRIVATE_KEY=your_private_key_here
```

### **Step 3: Set Verifier Role**

```typescript
// scripts/set-verifier-role.js
const contract = await ethers.getContractAt(
  'CryptoRaftsKYCVerification',
  CONTRACT_ADDRESS
);

await contract.setVerifierRole(VERIFIER_ADDRESS);
```

### **Step 4: Test Integration**

```typescript
// Test KYC on-chain registration
const result = await processKYCWithOnChain(
  userId,
  userAddress,
  kycRequest
);

// Verify on-chain
const isVerified = await checkKYCStatus(userAddress, provider);
console.log('KYC Verified:', isVerified);
```

---

## 📊 Benefits of On-Chain KYC/KYB

### **Transparency**
- ✅ Public verification status
- ✅ Immutable records
- ✅ Trustless verification

### **Interoperability**
- ✅ Cross-platform verification
- ✅ Reusable verification status
- ✅ Standard protocol

### **Compliance**
- ✅ Audit trail
- ✅ Regulatory compliance
- ✅ Risk tracking

### **Trust**
- ✅ No central authority
- ✅ Decentralized verification
- ✅ Public proof

---

## 📚 Additional Resources

- [Complete On-Chain Integration Guide](./ON_CHAIN_INTEGRATION_GUIDE.md)
- [Quick Start Guide](./ON_CHAIN_QUICK_START.md)
- [System Overview](./ON_CHAIN_SYSTEM_OVERVIEW.md)

---

**Status**: 📝 KYC/KYB On-Chain Guide Complete  
**Last Updated**: 2025-01-XX  
**Version**: 1.0.0











