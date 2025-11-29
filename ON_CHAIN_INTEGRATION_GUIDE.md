# Complete On-Chain Integration Guide
## CryptoRafts Blockchain System Architecture

---

## 📋 Table of Contents

1. [Current System Architecture](#current-system-architecture)
2. [Blockchain Integration Strategy](#blockchain-integration-strategy)
3. [Smart Contract Design](#smart-contract-design)
4. [Web3 Wallet Integration](#web3-wallet-integration)
5. [On-Chain Data Storage](#on-chain-data-storage)
6. [Transaction Handling](#transaction-handling)
7. [Token & NFT Integration](#token--nft-integration)
8. [Decentralized Identity](#decentralized-identity)
9. [On-Chain Verification](#on-chain-verification)
10. [Implementation Roadmap](#implementation-roadmap)

---

## 🏗️ Current System Architecture

### **Current Stack**
- **Frontend**: Next.js 16 (React 18)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Authentication**: Firebase Auth (Email/Password, Google OAuth)
- **Database**: Firestore (NoSQL)
- **Storage**: Firebase Storage
- **Real-time**: Firestore `onSnapshot` listeners

### **Data Flow**
```
User → Next.js Frontend → Firebase Auth → Firestore → Real-time Updates
```

### **Key Components**
1. **Authentication System** (`src/providers/EnhancedAuthProvider.tsx`)
   - Firebase Auth integration
   - Role-based access control
   - Custom claims management

2. **Project Management** (`src/lib/founder-state.ts`)
   - Project creation/updates
   - KYC/KYB verification
   - Funding tracking

3. **Dealflow System** (`src/app/dealflow/page.tsx`)
   - Public project discovery
   - Real-time updates
   - Analytics and filtering

4. **Data Isolation** (`src/lib/security/data-isolation.ts`)
   - User data isolation
   - Security rules enforcement

---

## 🔗 Blockchain Integration Strategy

### **Hybrid Architecture: Off-Chain + On-Chain**

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                      │
│                  (Next.js Frontend)                     │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌─────────▼─────────┐
│  Firebase       │    │  Blockchain        │
│  (Off-Chain)    │    │  (On-Chain)        │
├─────────────────┤    ├───────────────────┤
│ • User Auth     │    │ • Smart Contracts │
│ • Fast Queries  │    │ • Transactions     │
│ • File Storage  │    │ • Token/NFT        │
│ • Real-time     │    │ • Verification     │
│ • Analytics     │    │ • Immutable Data  │
└─────────────────┘    └───────────────────┘
```

### **Why Hybrid?**
- **Firebase**: Fast queries, real-time updates, file storage, user-friendly
- **Blockchain**: Immutable records, trustless verification, tokenization, transparency

### **Integration Points**

1. **User Authentication**
   - Firebase Auth (existing) + Web3 wallet signature
   - Link wallet address to Firebase user

2. **Project Registration**
   - Store metadata in Firebase (fast queries)
   - Register hash on-chain (immutable proof)

3. **KYC/KYB Verification**
   - Process documents off-chain (privacy)
   - Store verification status on-chain (public proof)

4. **Funding & Investments**
   - Track amounts in Firebase (real-time)
   - Execute transactions on-chain (trustless)

5. **Token/NFT Issuance**
   - Mint tokens/NFTs on-chain
   - Track ownership in Firebase

---

## 📜 Smart Contract Design

### **1. Project Registry Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoRaftsProjectRegistry {
    struct Project {
        string projectId;           // Firebase project ID
        address founder;            // Founder wallet address
        string metadataHash;        // IPFS hash of project metadata
        uint256 createdAt;          // Block timestamp
        bool isVerified;            // KYC/KYB verification status
        bool isActive;              // Project status
    }

    mapping(string => Project) public projects;
    mapping(address => string[]) public founderProjects;
    
    event ProjectRegistered(
        string indexed projectId,
        address indexed founder,
        string metadataHash,
        uint256 timestamp
    );
    
    event ProjectVerified(
        string indexed projectId,
        bool isVerified,
        uint256 timestamp
    );

    function registerProject(
        string memory projectId,
        string memory metadataHash
    ) external {
        require(bytes(projectId).length > 0, "Invalid project ID");
        require(bytes(metadataHash).length > 0, "Invalid metadata hash");
        require(projects[projectId].createdAt == 0, "Project already exists");

        projects[projectId] = Project({
            projectId: projectId,
            founder: msg.sender,
            metadataHash: metadataHash,
            createdAt: block.timestamp,
            isVerified: false,
            isActive: true
        });

        founderProjects[msg.sender].push(projectId);

        emit ProjectRegistered(
            projectId,
            msg.sender,
            metadataHash,
            block.timestamp
        );
    }

    function verifyProject(string memory projectId, bool verified) external {
        require(
            msg.sender == owner() || msg.sender == projects[projectId].founder,
            "Unauthorized"
        );
        require(projects[projectId].createdAt > 0, "Project not found");

        projects[projectId].isVerified = verified;

        emit ProjectVerified(projectId, verified, block.timestamp);
    }

    function getProject(string memory projectId) external view returns (Project memory) {
        return projects[projectId];
    }

    function getFounderProjects(address founder) external view returns (string[] memory) {
        return founderProjects[founder];
    }

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}
```

### **2. Funding Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CryptoRaftsFunding {
    struct Investment {
        string projectId;
        address investor;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(string => uint256) public projectFunding;      // projectId => total raised
    mapping(string => address[]) public projectInvestors; // projectId => investors[]
    mapping(string => mapping(address => uint256)) public investorAmounts; // projectId => investor => amount
    
    Investment[] public investments;
    
    address public paymentToken; // USDC, USDT, or native token
    address public treasury;     // Treasury wallet
    
    event InvestmentMade(
        string indexed projectId,
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    constructor(address _paymentToken, address _treasury) {
        paymentToken = _paymentToken;
        treasury = _treasury;
    }

    function invest(
        string memory projectId,
        uint256 amount
    ) external payable {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(projectId).length > 0, "Invalid project ID");

        if (paymentToken == address(0)) {
            // Native token (ETH, BNB, etc.)
            require(msg.value == amount, "Incorrect payment amount");
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            // ERC20 token (USDC, USDT, etc.)
            IERC20 token = IERC20(paymentToken);
            require(token.balanceOf(msg.sender) >= amount, "Insufficient balance");
            require(token.transfer(treasury, amount), "Transfer failed");
        }

        projectFunding[projectId] += amount;
        
        if (investorAmounts[projectId][msg.sender] == 0) {
            projectInvestors[projectId].push(msg.sender);
        }
        
        investorAmounts[projectId][msg.sender] += amount;

        investments.push(Investment({
            projectId: projectId,
            investor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit InvestmentMade(projectId, msg.sender, amount, block.timestamp);
    }

    function getProjectFunding(string memory projectId) external view returns (uint256) {
        return projectFunding[projectId];
    }

    function getProjectInvestors(string memory projectId) external view returns (address[] memory) {
        return projectInvestors[projectId];
    }

    function getInvestorAmount(string memory projectId, address investor) external view returns (uint256) {
        return investorAmounts[projectId][investor];
    }
}
```

### **3. Verification Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoRaftsVerification {
    struct Verification {
        string projectId;
        bool kycVerified;
        bool kybVerified;
        bool auditVerified;
        uint256 verifiedAt;
        address verifier;
    }

    mapping(string => Verification) public verifications;
    
    address public verifierRole; // Admin or DAO address
    
    event ProjectVerified(
        string indexed projectId,
        bool kycVerified,
        bool kybVerified,
        bool auditVerified,
        address verifier,
        uint256 timestamp
    );

    constructor(address _verifierRole) {
        verifierRole = _verifierRole;
    }

    function verifyProject(
        string memory projectId,
        bool kycVerified,
        bool kybVerified,
        bool auditVerified
    ) external {
        require(msg.sender == verifierRole, "Unauthorized");
        require(bytes(projectId).length > 0, "Invalid project ID");

        verifications[projectId] = Verification({
            projectId: projectId,
            kycVerified: kycVerified,
            kybVerified: kybVerified,
            auditVerified: auditVerified,
            verifiedAt: block.timestamp,
            verifier: msg.sender
        });

        emit ProjectVerified(
            projectId,
            kycVerified,
            kybVerified,
            auditVerified,
            msg.sender,
            block.timestamp
        );
    }

    function getVerification(string memory projectId) external view returns (Verification memory) {
        return verifications[projectId];
    }
}
```

### **4. Token/NFT Contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CryptoRaftsProjectNFT is ERC721, Ownable {
    struct ProjectNFT {
        string projectId;
        string metadataURI;
        uint256 mintedAt;
    }

    mapping(uint256 => ProjectNFT) public projectNFTs;
    mapping(string => uint256) public projectToTokenId;
    
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("CryptoRafts Project NFT", "CRNFT") {}

    function mintProjectNFT(
        address to,
        string memory projectId,
        string memory metadataURI
    ) external onlyOwner returns (uint256) {
        require(bytes(projectId).length > 0, "Invalid project ID");
        require(projectToTokenId[projectId] == 0, "NFT already minted");

        uint256 tokenId = ++_tokenIdCounter;
        
        _safeMint(to, tokenId);
        
        projectNFTs[tokenId] = ProjectNFT({
            projectId: projectId,
            metadataURI: metadataURI,
            mintedAt: block.timestamp
        });
        
        projectToTokenId[projectId] = tokenId;

        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return projectNFTs[tokenId].metadataURI;
    }
}
```

---

## 💼 Web3 Wallet Integration

### **1. Install Dependencies**

```bash
npm install ethers@^6.0.0
npm install @web3modal/ethers@^2.0.0
npm install @web3modal/react@^2.0.0
```

### **2. Create Web3 Provider**

```typescript
// src/lib/web3.ts
import { ethers } from 'ethers';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { mainnet, polygon, bsc } from '@web3modal/wagmi/chains';

// Wallet configuration
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const chains = [mainnet, polygon, bsc];
const wagmiConfig = defaultWagmiConfig({ chains, projectId });

createWeb3Modal({ wagmiConfig, projectId, chains });

export { wagmiConfig };

// Contract addresses (deploy to your chosen network)
export const CONTRACT_ADDRESSES = {
  projectRegistry: process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS || '',
  funding: process.env.NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS || '',
  verification: process.env.NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS || '',
  nft: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '',
};

// Network configuration
export const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY',
  },
  bsc: {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
  },
};
```

### **3. Create Wallet Context**

```typescript
// src/contexts/Web3Context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { ethers } from 'ethers';

interface Web3ContextType {
  address: string | undefined;
  isConnected: boolean;
  chainId: number | undefined;
  connect: () => void;
  disconnect: () => void;
  switchNetwork: (chainId: number) => void;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    if (isConnected && address && chain) {
      const rpcUrl = getRpcUrl(chain.id);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      setProvider(provider);

      // Get signer from wallet
      if (window.ethereum) {
        const walletProvider = new ethers.BrowserProvider(window.ethereum);
        walletProvider.getSigner().then(setSigner);
      }
    } else {
      setProvider(null);
      setSigner(null);
    }
  }, [isConnected, address, chain]);

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = (chainId: number) => {
    switchNetwork?.(chainId);
  };

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        chainId: chain?.id,
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchNetwork: handleSwitchNetwork,
        provider,
        signer,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
}

function getRpcUrl(chainId: number): string {
  // Return RPC URL based on chain ID
  // Implementation depends on your network configuration
  return '';
}
```

### **4. Link Wallet to Firebase User**

```typescript
// src/lib/web3-auth.ts
import { db, doc, setDoc, getDoc, serverTimestamp } from '@/lib/firebase.client';
import { useAuth } from '@/providers/EnhancedAuthProvider';

export async function linkWalletToUser(
  userId: string,
  walletAddress: string,
  signature: string
) {
  if (!db) throw new Error('Firebase not initialized');

  // Verify signature
  const message = `Link wallet ${walletAddress} to CryptoRafts account`;
  const isValid = await verifySignature(message, signature, walletAddress);
  
  if (!isValid) {
    throw new Error('Invalid signature');
  }

  // Store wallet link in Firestore
  await setDoc(doc(db, 'users', userId), {
    walletAddress,
    walletLinkedAt: serverTimestamp(),
    walletSignature: signature,
  }, { merge: true });

  return true;
}

export async function getUserWallet(userId: string): Promise<string | null> {
  if (!db) return null;

  const userDoc = await getDoc(doc(db, 'users', userId));
  if (userDoc.exists()) {
    return userDoc.data().walletAddress || null;
  }
  return null;
}

async function verifySignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  // Implement signature verification using ethers
  // This ensures the user owns the wallet
  return true; // Placeholder
}
```

---

## 💾 On-Chain Data Storage

### **1. IPFS Integration for Metadata**

```typescript
// src/lib/ipfs.ts
import { create } from 'ipfs-http-client';

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.NEXT_PUBLIC_INFURA_PROJECT_ID}:${process.env.NEXT_PUBLIC_INFURA_PROJECT_SECRET}`
    ).toString('base64')}`,
  },
});

export async function uploadToIPFS(data: any): Promise<string> {
  const result = await ipfs.add(JSON.stringify(data));
  return `ipfs://${result.path}`;
}

export async function getFromIPFS(hash: string): Promise<any> {
  const chunks = [];
  for await (const chunk of ipfs.cat(hash.replace('ipfs://', ''))) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks).toString();
  return JSON.parse(data);
}
```

### **2. Project Registration Flow**

```typescript
// src/lib/onchain/project-registry.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import { uploadToIPFS } from '@/lib/ipfs';
import ProjectRegistryABI from '@/abis/ProjectRegistry.json';

export async function registerProjectOnChain(
  projectId: string,
  projectData: any,
  signer: ethers.Signer
): Promise<string> {
  // 1. Upload project metadata to IPFS
  const metadataHash = await uploadToIPFS(projectData);

  // 2. Get contract instance
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.projectRegistry,
    ProjectRegistryABI,
    signer
  );

  // 3. Register project on-chain
  const tx = await contract.registerProject(projectId, metadataHash);
  await tx.wait();

  return metadataHash;
}
```

### **3. Sync On-Chain Data to Firebase**

```typescript
// src/lib/onchain/sync.ts
import { db, doc, updateDoc } from '@/lib/firebase.client';
import { ethers } from 'ethers';
import ProjectRegistryABI from '@/abis/ProjectRegistry.json';

export async function syncProjectFromChain(
  projectId: string,
  provider: ethers.Provider
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.projectRegistry,
    ProjectRegistryABI,
    provider
  );

  const project = await contract.getProject(projectId);
  
  // Update Firebase with on-chain data
  await updateDoc(doc(db!, 'projects', projectId), {
    onChain: {
      registered: true,
      founder: project.founder,
      metadataHash: project.metadataHash,
      createdAt: project.createdAt,
      isVerified: project.isVerified,
      blockNumber: project.blockNumber,
    },
    updatedAt: serverTimestamp(),
  });
}
```

---

## 🔄 Transaction Handling

### **1. Investment Transaction**

```typescript
// src/lib/onchain/funding.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import FundingABI from '@/abis/Funding.json';

export async function investInProject(
  projectId: string,
  amount: string, // Amount in wei or token units
  signer: ethers.Signer,
  isNativeToken: boolean = false
): Promise<string> {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.funding,
    FundingABI,
    signer
  );

  let tx;
  
  if (isNativeToken) {
    // Native token (ETH, BNB, etc.)
    tx = await contract.invest(projectId, { value: amount });
  } else {
    // ERC20 token
    tx = await contract.invest(projectId, amount);
  }

  const receipt = await tx.wait();
  return receipt.transactionHash;
}
```

### **2. Transaction Status Tracking**

```typescript
// src/lib/onchain/transaction-tracker.ts
import { db, collection, doc, setDoc, updateDoc } from '@/lib/firebase.client';
import { ethers } from 'ethers';

export async function trackTransaction(
  txHash: string,
  projectId: string,
  userId: string,
  type: 'investment' | 'registration' | 'verification'
) {
  if (!db) return;

  await setDoc(doc(db, 'transactions', txHash), {
    txHash,
    projectId,
    userId,
    type,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Poll for transaction confirmation
  pollTransactionStatus(txHash);
}

async function pollTransactionStatus(txHash: string) {
  const provider = new ethers.JsonRpcProvider(getRpcUrl());
  
  const checkStatus = async () => {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      
      if (receipt) {
        await updateDoc(doc(db!, 'transactions', txHash), {
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          blockNumber: receipt.blockNumber,
          confirmedAt: serverTimestamp(),
        });
      } else {
        // Still pending, check again in 5 seconds
        setTimeout(checkStatus, 5000);
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
    }
  };

  checkStatus();
}
```

---

## 🪙 Token & NFT Integration

### **1. Mint Project NFT**

```typescript
// src/lib/onchain/nft.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import { uploadToIPFS } from '@/lib/ipfs';
import NFTABI from '@/abis/ProjectNFT.json';

export async function mintProjectNFT(
  projectId: string,
  projectData: any,
  signer: ethers.Signer
): Promise<number> {
  // 1. Create NFT metadata
  const metadata = {
    name: projectData.title,
    description: projectData.description,
    image: projectData.logo,
    attributes: [
      { trait_type: 'Sector', value: projectData.sector },
      { trait_type: 'Chain', value: projectData.chain },
      { trait_type: 'Verified', value: projectData.isVerified },
    ],
  };

  // 2. Upload to IPFS
  const metadataURI = await uploadToIPFS(metadata);

  // 3. Get contract instance
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.nft,
    NFTABI,
    signer
  );

  // 4. Mint NFT (requires owner role)
  const address = await signer.getAddress();
  const tx = await contract.mintProjectNFT(address, projectId, metadataURI);
  await tx.wait();

  // 5. Get token ID
  const tokenId = await contract.projectToTokenId(projectId);
  return Number(tokenId);
}
```

### **2. Display User NFTs**

```typescript
// src/lib/onchain/nft-balance.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import NFTABI from '@/abis/ProjectNFT.json';

export async function getUserNFTs(
  address: string,
  provider: ethers.Provider
): Promise<any[]> {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.nft,
    NFTABI,
    provider
  );

  // Get balance
  const balance = await contract.balanceOf(address);
  
  // Get all token IDs owned by user
  const tokenIds = [];
  for (let i = 0; i < balance; i++) {
    const tokenId = await contract.tokenOfOwnerByIndex(address, i);
    tokenIds.push(Number(tokenId));
  }

  // Get metadata for each NFT
  const nfts = await Promise.all(
    tokenIds.map(async (tokenId) => {
      const uri = await contract.tokenURI(tokenId);
      const projectNFT = await contract.projectNFTs(tokenId);
      
      return {
        tokenId,
        projectId: projectNFT.projectId,
        metadataURI: uri,
        mintedAt: Number(projectNFT.mintedAt),
      };
    })
  );

  return nfts;
}
```

---

## 🆔 Decentralized Identity

### **1. DID Integration**

```typescript
// src/lib/did.ts
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

export async function createDID(seed: Uint8Array): Promise<DID> {
  const provider = new Ed25519Provider(seed);
  const did = new DID({ provider, resolver: getResolver() });
  await did.authenticate();
  return did;
}

export async function createVerifiableCredential(
  did: DID,
  subject: string,
  claims: any
) {
  const vc = await did.createVerifiableCredential({
    credential: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'CryptoRaftsVerification'],
      issuer: did.id,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subject,
        ...claims,
      },
    },
  });

  return vc;
}
```

### **2. Link DID to User**

```typescript
// src/lib/did-auth.ts
import { db, doc, setDoc } from '@/lib/firebase.client';
import { createDID } from './did';

export async function linkDIDToUser(
  userId: string,
  did: string,
  vc: any
) {
  if (!db) throw new Error('Firebase not initialized');

  await setDoc(doc(db, 'users', userId), {
    did,
    verifiableCredential: vc,
    didLinkedAt: serverTimestamp(),
  }, { merge: true });
}
```

---

## ✅ On-Chain Verification

### **1. Verify Project On-Chain**

```typescript
// src/lib/onchain/verification.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import VerificationABI from '@/abis/Verification.json';

export async function verifyProjectOnChain(
  projectId: string,
  kycVerified: boolean,
  kybVerified: boolean,
  auditVerified: boolean,
  signer: ethers.Signer // Must be verifier role
): Promise<string> {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.verification,
    VerificationABI,
    signer
  );

  const tx = await contract.verifyProject(
    projectId,
    kycVerified,
    kybVerified,
    auditVerified
  );

  const receipt = await tx.wait();
  return receipt.transactionHash;
}
```

### **2. Check Verification Status**

```typescript
// src/lib/onchain/check-verification.ts
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/lib/web3';
import VerificationABI from '@/abis/Verification.json';

export async function getVerificationStatus(
  projectId: string,
  provider: ethers.Provider
) {
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.verification,
    VerificationABI,
    provider
  );

  const verification = await contract.getVerification(projectId);
  
  return {
    kycVerified: verification.kycVerified,
    kybVerified: verification.kybVerified,
    auditVerified: verification.auditVerified,
    verifiedAt: Number(verification.verifiedAt),
    verifier: verification.verifier,
  };
}
```

---

## 🗺️ Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Set up Web3 wallet integration
- [ ] Deploy smart contracts to testnet
- [ ] Create contract ABIs and interfaces
- [ ] Link wallet addresses to Firebase users

### **Phase 2: Core Features (Weeks 3-4)**
- [ ] Implement project registration on-chain
- [ ] Set up IPFS for metadata storage
- [ ] Create funding contract integration
- [ ] Build transaction tracking system

### **Phase 3: Verification (Weeks 5-6)**
- [ ] Implement on-chain verification
- [ ] Sync verification status to Firebase
- [ ] Create verification dashboard
- [ ] Add verification badges

### **Phase 4: Tokenization (Weeks 7-8)**
- [ ] Deploy NFT contract
- [ ] Implement NFT minting
- [ ] Create NFT gallery
- [ ] Add NFT ownership tracking

### **Phase 5: Advanced Features (Weeks 9-10)**
- [ ] Implement DID integration
- [ ] Add verifiable credentials
- [ ] Create on-chain analytics
- [ ] Build governance features

### **Phase 6: Testing & Deployment (Weeks 11-12)**
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Deploy to mainnet
- [ ] User documentation

---

## 🔐 Security Considerations

### **1. Smart Contract Security**
- Use OpenZeppelin libraries
- Conduct security audits
- Implement access controls
- Add pause mechanisms

### **2. Frontend Security**
- Validate all user inputs
- Sanitize wallet addresses
- Verify signatures
- Implement rate limiting

### **3. Data Privacy**
- Store sensitive data off-chain
- Use IPFS for public metadata
- Encrypt private data
- Implement access controls

---

## 📚 Additional Resources

### **Smart Contract Development**
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org)

### **Web3 Integration**
- [Ethers.js Documentation](https://docs.ethers.io)
- [Wagmi Documentation](https://wagmi.sh)
- [Web3Modal Documentation](https://docs.walletconnect.com/web3modal)

### **IPFS**
- [IPFS Documentation](https://docs.ipfs.io)
- [Pinata (IPFS Pinning Service)](https://www.pinata.cloud)

### **DID & Verifiable Credentials**
- [DID Specification](https://www.w3.org/TR/did-core/)
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

---

## 🎯 Next Steps

1. **Choose Blockchain Network**: Ethereum, Polygon, BSC, or other
2. **Set Up Development Environment**: Install Hardhat, configure networks
3. **Deploy Contracts**: Deploy to testnet first, then mainnet
4. **Integrate Web3**: Add wallet connection to frontend
5. **Test Integration**: Test all on-chain features
6. **Deploy to Production**: Move to mainnet after testing

---

**Status**: 📝 Documentation Complete  
**Last Updated**: 2025-01-XX  
**Version**: 1.0.0











