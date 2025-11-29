# On-Chain Integration Quick Start Guide
## Step-by-Step Implementation

---

## 🚀 Quick Start Checklist

### **Prerequisites**
- [ ] Node.js 18+ installed
- [ ] MetaMask or other Web3 wallet installed
- [ ] Testnet tokens (for testing)
- [ ] Firebase project configured
- [ ] Basic understanding of Solidity and Web3

---

## 📦 Step 1: Install Dependencies

```bash
# Install Web3 libraries
npm install ethers@^6.0.0
npm install @web3modal/wagmi@^2.0.0
npm install @wagmi/core@^2.0.0
npm install wagmi@^2.0.0
npm install viem@^2.0.0

# Install IPFS client
npm install ipfs-http-client

# Install Hardhat for smart contract development
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install --save-dev @openzeppelin/contracts
```

---

## 🔧 Step 2: Set Up Hardhat

```bash
# Initialize Hardhat
npx hardhat init

# Choose: Create a JavaScript project
```

### **hardhat.config.js**

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
    },
  },
};
```

### **.env**

```env
# Private key (NEVER commit this to git)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_API_KEY
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

---

## 📜 Step 3: Create Smart Contracts

### **contracts/ProjectRegistry.sol**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoRaftsProjectRegistry {
    struct Project {
        string projectId;
        address founder;
        string metadataHash;
        uint256 createdAt;
        bool isVerified;
        bool isActive;
    }

    mapping(string => Project) public projects;
    mapping(address => string[]) public founderProjects;
    
    address public owner;
    
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

    constructor() {
        owner = msg.sender;
    }

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
            msg.sender == owner || msg.sender == projects[projectId].founder,
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
}
```

### **contracts/Funding.sol**

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

    mapping(string => uint256) public projectFunding;
    mapping(string => address[]) public projectInvestors;
    mapping(string => mapping(address => uint256)) public investorAmounts;
    
    Investment[] public investments;
    
    address public paymentToken;
    address public treasury;
    
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
            require(msg.value == amount, "Incorrect payment amount");
            (bool success, ) = treasury.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
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

---

## 🚀 Step 4: Deploy Contracts

### **scripts/deploy.js**

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy ProjectRegistry
  const ProjectRegistry = await hre.ethers.getContractFactory("CryptoRaftsProjectRegistry");
  const projectRegistry = await ProjectRegistry.deploy();
  await projectRegistry.waitForDeployment();
  console.log("ProjectRegistry deployed to:", await projectRegistry.getAddress());

  // Deploy Funding (using native token, address(0))
  const Funding = await hre.ethers.getContractFactory("CryptoRaftsFunding");
  const treasury = "0xYourTreasuryAddress"; // Replace with your treasury address
  const funding = await Funding.deploy("0x0000000000000000000000000000000000000000", treasury);
  await funding.waitForDeployment();
  console.log("Funding deployed to:", await funding.getAddress());

  // Save addresses to .env or config file
  console.log("\nContract Addresses:");
  console.log("ProjectRegistry:", await projectRegistry.getAddress());
  console.log("Funding:", await funding.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### **Deploy to Testnet**

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia

# Or deploy to Polygon testnet
npx hardhat run scripts/deploy.js --network polygon
```

---

## 💻 Step 5: Create Frontend Integration

### **src/lib/web3-client.ts**

```typescript
import { ethers } from 'ethers';

// Contract addresses (from deployment)
export const CONTRACT_ADDRESSES = {
  projectRegistry: process.env.NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS || '',
  funding: process.env.NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS || '',
};

// Get provider
export function getProvider() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
}

// Get signer
export async function getSigner() {
  const provider = getProvider();
  if (provider) {
    return await provider.getSigner();
  }
  return null;
}

// Connect wallet
export async function connectWallet() {
  if (typeof window !== 'undefined' && window.ethereum) {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return true;
  }
  return false;
}
```

### **src/lib/contracts/project-registry.ts**

```typescript
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, getSigner } from '@/lib/web3-client';
import ProjectRegistryABI from '@/abis/ProjectRegistry.json';

export async function registerProjectOnChain(
  projectId: string,
  metadataHash: string
): Promise<string> {
  const signer = await getSigner();
  if (!signer) throw new Error('Wallet not connected');

  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.projectRegistry,
    ProjectRegistryABI,
    signer
  );

  const tx = await contract.registerProject(projectId, metadataHash);
  const receipt = await tx.wait();
  
  return receipt.transactionHash;
}

export async function getProjectFromChain(projectId: string) {
  const provider = getProvider();
  if (!provider) throw new Error('Provider not available');

  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.projectRegistry,
    ProjectRegistryABI,
    provider
  );

  return await contract.getProject(projectId);
}
```

---

## 🔗 Step 6: Link Wallet to User

### **src/components/WalletConnect.tsx**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { connectWallet, getSigner } from '@/lib/web3-client';
import { linkWalletToUser } from '@/lib/web3-auth';
import { useAuth } from '@/providers/EnhancedAuthProvider';

export default function WalletConnect() {
  const { user } = useAuth();
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  async function checkWalletConnection() {
    const signer = await getSigner();
    if (signer) {
      const addr = await signer.getAddress();
      setAddress(addr);
    }
  }

  async function handleConnect() {
    setLoading(true);
    try {
      await connectWallet();
      const signer = await getSigner();
      if (signer && user) {
        const addr = await signer.getAddress();
        setAddress(addr);
        
        // Link wallet to Firebase user
        await linkWalletToUser(user.uid, addr);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {address ? (
        <div>
          <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
        </div>
      ) : (
        <button onClick={handleConnect} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}
```

---

## 📝 Step 7: Update Environment Variables

### **.env.local**

```env
# Contract addresses (from deployment)
NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS=0x...

# WalletConnect
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

---

## ✅ Step 8: Test Integration

### **Test Project Registration**

```typescript
// src/app/test/onchain/page.tsx
'use client';

import { useState } from 'react';
import { registerProjectOnChain } from '@/lib/contracts/project-registry';
import { uploadToIPFS } from '@/lib/ipfs';

export default function TestOnChain() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleRegister() {
    setLoading(true);
    try {
      // 1. Upload metadata to IPFS
      const metadata = {
        title: 'Test Project',
        description: 'This is a test project',
      };
      const metadataHash = await uploadToIPFS(metadata);

      // 2. Register on-chain
      const hash = await registerProjectOnChain('test-project-1', metadataHash);
      setTxHash(hash);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleRegister} disabled={loading}>
        {loading ? 'Registering...' : 'Register Project'}
      </button>
      {txHash && <p>Transaction: {txHash}</p>}
    </div>
  );
}
```

---

## 🎯 Next Steps

1. **Deploy to Testnet**: Test all functionality on testnet
2. **Security Audit**: Get smart contracts audited
3. **Deploy to Mainnet**: Deploy to production network
4. **Monitor**: Set up monitoring and alerts
5. **Documentation**: Create user documentation

---

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.io)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [IPFS Documentation](https://docs.ipfs.io)

---

**Status**: ✅ Quick Start Guide Complete  
**Last Updated**: 2025-01-XX











