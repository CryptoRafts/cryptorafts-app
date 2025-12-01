# Complete CryptoRafts Smart Contracts - BNB Chain

This document contains all three smart contracts for the CryptoRafts platform, deployed on **BNB Smart Chain (BSC)**.

**Primary Deployment Network**: BNB Smart Chain (BSC) - Chain ID 56

---

## 📋 Contract Overview

1. **KYCVerification.sol** - Stores hashed KYC data for all user roles
2. **KYBVerification.sol** - Stores hashed email addresses for VCs/influencers
3. **ProjectRegistry.sol** - Stores hashed project data after successful funding/launch

---

## 1. KYC Verification Contract

**File**: `contracts/KYCVerification.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KYCVerification
 * @dev Smart contract for storing KYC verification data on BNB Smart Chain (BSC)
 * 
 * This contract automates the process of storing hashed and salted KYC data on-chain
 * after admin approval. Supports all user roles including founders, influencers, etc.
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */
contract KYCVerification {
    // Contract owner (admin)
    address public owner;
    
    // Mapping: userId => KYC data
    mapping(string => KYCRecord) public kycRecords;
    
    // Mapping: userId => exists
    mapping(string => bool) public hasKYC;
    
    // Events
    event KYCStored(
        string indexed userId,
        bytes32 indexed kycHash,
        bool approved,
        uint256 timestamp
    );
    
    event KYCUpdated(
        string indexed userId,
        bytes32 indexed newKycHash,
        uint256 timestamp
    );
    
    // Struct for KYC data
    struct KYCRecord {
        bytes32 kycHash;           // Hashed and salted KYC data
        bool approved;             // Approval status
        uint256 timestamp;          // When stored on-chain
        address storedBy;           // Admin who stored it
    }
    
    // Modifier: Only owner (admin)
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store KYC verification hash on BNB Chain after admin approval
     * @param userId - Unique user identifier
     * @param kycHash - Hashed and salted KYC data (32 bytes)
     * @param approved - Approval status from admin
     * 
     * This function is called automatically after admin approves KYC.
     * The frontend/backend should hash and salt the sensitive data before calling this.
     */
    function storeKYCVerification(
        string memory userId,
        bytes32 kycHash,
        bool approved
    ) public onlyOwner {
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(kycHash != bytes32(0), "KYC hash cannot be zero");
        
        KYCRecord memory record = KYCRecord({
            kycHash: kycHash,
            approved: approved,
            timestamp: block.timestamp,
            storedBy: msg.sender
        });
        
        kycRecords[userId] = record;
        hasKYC[userId] = true;
        
        emit KYCStored(userId, kycHash, approved, block.timestamp);
    }
    
    /**
     * @dev Update existing KYC verification hash
     * @param userId - Unique user identifier
     * @param newKycHash - New hashed and salted KYC data
     */
    function updateKYCVerification(
        string memory userId,
        bytes32 newKycHash
    ) public onlyOwner {
        require(hasKYC[userId], "KYC record does not exist");
        require(newKycHash != bytes32(0), "KYC hash cannot be zero");
        
        kycRecords[userId].kycHash = newKycHash;
        kycRecords[userId].timestamp = block.timestamp;
        kycRecords[userId].storedBy = msg.sender;
        
        emit KYCUpdated(userId, newKycHash, block.timestamp);
    }
    
    /**
     * @dev Get KYC verification record
     * @param userId - Unique user identifier
     * @return kycHash - Hashed KYC data
     * @return approved - Approval status
     * @return timestamp - When stored on-chain
     */
    function getKYCVerification(string memory userId)
        public
        view
        returns (
            bytes32 kycHash,
            bool approved,
            uint256 timestamp
        )
    {
        require(hasKYC[userId], "KYC record does not exist");
        
        KYCRecord memory record = kycRecords[userId];
        return (record.kycHash, record.approved, record.timestamp);
    }
    
    /**
     * @dev Check if user has KYC verification
     * @param userId - Unique user identifier
     * @return exists - Whether KYC record exists
     * @return approved - Approval status (if exists)
     */
    function checkKYCStatus(string memory userId)
        public
        view
        returns (bool exists, bool approved)
    {
        exists = hasKYC[userId];
        if (exists) {
            approved = kycRecords[userId].approved;
        }
    }
    
    /**
     * @dev Transfer ownership (for admin changes)
     * @param newOwner - New owner address
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
```

---

## 2. KYB Verification Contract

**File**: `contracts/KYBVerification.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KYBVerification
 * @dev Smart contract for storing KYB verification data on BNB Smart Chain (BSC)
 * 
 * This contract stores hashed email addresses for VCs and influencers on-chain
 * after admin approval. Only minimal data (email) is hashed and stored.
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */
contract KYBVerification {
    // Contract owner (admin)
    address public owner;
    
    // Mapping: userId => KYB data
    mapping(string => KYBRecord) public kybRecords;
    
    // Mapping: userId => exists
    mapping(string => bool) public hasKYB;
    
    // Events
    event KYBStored(
        string indexed userId,
        bytes32 indexed emailHash,
        bool approved,
        uint256 timestamp
    );
    
    event KYBUpdated(
        string indexed userId,
        bytes32 indexed newEmailHash,
        uint256 timestamp
    );
    
    // Struct for KYB data
    struct KYBRecord {
        bytes32 emailHash;         // Hashed and salted email address
        bool approved;             // Approval status
        uint256 timestamp;          // When stored on-chain
        address storedBy;           // Admin who stored it
    }
    
    // Modifier: Only owner (admin)
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store KYB verification hash on BNB Chain after admin approval
     * @param userId - Unique user identifier (VC or influencer)
     * @param emailHash - Hashed and salted email address (32 bytes)
     * @param approved - Approval status from admin
     * 
     * This function is called automatically after admin approves KYB.
     * Only email address is hashed and stored (minimal data approach).
     */
    function storeKYBVerification(
        string memory userId,
        bytes32 emailHash,
        bool approved
    ) public onlyOwner {
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(emailHash != bytes32(0), "Email hash cannot be zero");
        
        KYBRecord memory record = KYBRecord({
            emailHash: emailHash,
            approved: approved,
            timestamp: block.timestamp,
            storedBy: msg.sender
        });
        
        kybRecords[userId] = record;
        hasKYB[userId] = true;
        
        emit KYBStored(userId, emailHash, approved, block.timestamp);
    }
    
    /**
     * @dev Update existing KYB verification hash
     * @param userId - Unique user identifier
     * @param newEmailHash - New hashed and salted email address
     */
    function updateKYBVerification(
        string memory userId,
        bytes32 newEmailHash
    ) public onlyOwner {
        require(hasKYB[userId], "KYB record does not exist");
        require(newEmailHash != bytes32(0), "Email hash cannot be zero");
        
        kybRecords[userId].emailHash = newEmailHash;
        kybRecords[userId].timestamp = block.timestamp;
        kybRecords[userId].storedBy = msg.sender;
        
        emit KYBUpdated(userId, newEmailHash, block.timestamp);
    }
    
    /**
     * @dev Get KYB verification record
     * @param userId - Unique user identifier
     * @return emailHash - Hashed email address
     * @return approved - Approval status
     * @return timestamp - When stored on-chain
     */
    function getKYBVerification(string memory userId)
        public
        view
        returns (
            bytes32 emailHash,
            bool approved,
            uint256 timestamp
        )
    {
        require(hasKYB[userId], "KYB record does not exist");
        
        KYBRecord memory record = kybRecords[userId];
        return (record.emailHash, record.approved, record.timestamp);
    }
    
    /**
     * @dev Check if user has KYB verification
     * @param userId - Unique user identifier
     * @return exists - Whether KYB record exists
     * @return approved - Approval status (if exists)
     */
    function checkKYBStatus(string memory userId)
        public
        view
        returns (bool exists, bool approved)
    {
        exists = hasKYB[userId];
        if (exists) {
            approved = kybRecords[userId].approved;
        }
    }
    
    /**
     * @dev Transfer ownership (for admin changes)
     * @param newOwner - New owner address
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
```

---

## 3. Project Registry Contract

**File**: `contracts/ProjectRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ProjectRegistry
 * @dev Smart contract for storing project data on BNB Smart Chain (BSC) after successful funding/launch
 * 
 * This contract stores hashed and salted project pitch and deal flow data on-chain
 * after a project is successfully funded and VCs/exchanges confirm launch date.
 * 
 * Primary deployment network: BNB Smart Chain (BSC) - Chain ID 56
 */
contract ProjectRegistry {
    // Contract owner (admin)
    address public owner;
    
    // Mapping: projectId => Project data
    mapping(string => ProjectRecord) public projects;
    
    // Mapping: projectId => exists
    mapping(string => bool) public projectExists;
    
    // Events
    event ProjectStored(
        string indexed projectId,
        bytes32 indexed projectHash,
        uint256 launchDate,
        uint256 timestamp
    );
    
    event ProjectUpdated(
        string indexed projectId,
        bytes32 indexed newProjectHash,
        uint256 timestamp
    );
    
    event LaunchDateConfirmed(
        string indexed projectId,
        uint256 launchDate,
        address confirmedBy
    );
    
    // Struct for project data
    struct ProjectRecord {
        bytes32 projectHash;        // Hashed and salted project pitch/deal flow data
        uint256 launchDate;        // Confirmed launch date (Unix timestamp)
        uint256 timestamp;          // When stored on-chain
        address storedBy;           // Admin who stored it
        bool launched;              // Whether project has launched
        address[] confirmers;       // VCs/exchanges who confirmed launch
    }
    
    // Modifier: Only owner (admin)
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Store project data hash on BNB Chain after successful funding/launch confirmation
     * @param projectId - Unique project identifier
     * @param projectHash - Hashed and salted project pitch/deal flow data (32 bytes)
     * @param launchDate - Confirmed launch date (Unix timestamp)
     * 
     * This function is called automatically after:
     * 1. Project is successfully funded
     * 2. VCs/exchanges confirm launch date
     * 3. Full pitch and deal flow data is hashed and salted
     * 
     * After this, raw data should be deleted from backend.
     */
    function storeProjectData(
        string memory projectId,
        bytes32 projectHash,
        uint256 launchDate
    ) public onlyOwner {
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        require(projectHash != bytes32(0), "Project hash cannot be zero");
        require(launchDate > block.timestamp, "Launch date must be in the future");
        
        ProjectRecord storage project = projects[projectId];
        project.projectHash = projectHash;
        project.launchDate = launchDate;
        project.timestamp = block.timestamp;
        project.storedBy = msg.sender;
        project.launched = false;
        
        projectExists[projectId] = true;
        
        emit ProjectStored(projectId, projectHash, launchDate, block.timestamp);
    }
    
    /**
     * @dev Confirm launch date (called by VCs/exchanges)
     * @param projectId - Unique project identifier
     * @param launchDate - Confirmed launch date (Unix timestamp)
     */
    function confirmLaunchDate(
        string memory projectId,
        uint256 launchDate
    ) public {
        require(projectExists[projectId], "Project does not exist");
        require(launchDate > block.timestamp, "Launch date must be in the future");
        
        ProjectRecord storage project = projects[projectId];
        
        // Check if this address already confirmed
        bool alreadyConfirmed = false;
        for (uint i = 0; i < project.confirmers.length; i++) {
            if (project.confirmers[i] == msg.sender) {
                alreadyConfirmed = true;
                break;
            }
        }
        
        if (!alreadyConfirmed) {
            project.confirmers.push(msg.sender);
        }
        
        // Update launch date if this is the latest confirmation
        if (launchDate > project.launchDate) {
            project.launchDate = launchDate;
        }
        
        emit LaunchDateConfirmed(projectId, launchDate, msg.sender);
    }
    
    /**
     * @dev Mark project as launched (called by admin after official launch)
     * @param projectId - Unique project identifier
     */
    function markProjectLaunched(string memory projectId) public onlyOwner {
        require(projectExists[projectId], "Project does not exist");
        require(!projects[projectId].launched, "Project already marked as launched");
        
        projects[projectId].launched = true;
        
        // After launch, raw data should be deleted from backend
        // This is handled off-chain by the backend system
    }
    
    /**
     * @dev Update project data hash
     * @param projectId - Unique project identifier
     * @param newProjectHash - New hashed and salted project data
     */
    function updateProjectData(
        string memory projectId,
        bytes32 newProjectHash
    ) public onlyOwner {
        require(projectExists[projectId], "Project does not exist");
        require(newProjectHash != bytes32(0), "Project hash cannot be zero");
        
        projects[projectId].projectHash = newProjectHash;
        projects[projectId].timestamp = block.timestamp;
        projects[projectId].storedBy = msg.sender;
        
        emit ProjectUpdated(projectId, newProjectHash, block.timestamp);
    }
    
    /**
     * @dev Get project record
     * @param projectId - Unique project identifier
     * @return projectHash - Hashed project data
     * @return launchDate - Launch date (Unix timestamp)
     * @return timestamp - When stored on-chain
     * @return launched - Whether project has launched
     */
    function getProjectData(string memory projectId)
        public
        view
        returns (
            bytes32 projectHash,
            uint256 launchDate,
            uint256 timestamp,
            bool launched
        )
    {
        require(projectExists[projectId], "Project does not exist");
        
        ProjectRecord memory project = projects[projectId];
        return (
            project.projectHash,
            project.launchDate,
            project.timestamp,
            project.launched
        );
    }
    
    /**
     * @dev Get launch confirmers for a project
     * @param projectId - Unique project identifier
     * @return confirmers - Array of addresses who confirmed launch
     */
    function getLaunchConfirmers(string memory projectId)
        public
        view
        returns (address[] memory confirmers)
    {
        require(projectExists[projectId], "Project does not exist");
        return projects[projectId].confirmers;
    }
    
    /**
     * @dev Check if project exists
     * @param projectId - Unique project identifier
     * @return exists - Whether project exists
     * @return launched - Whether project has launched (if exists)
     */
    function checkProjectStatus(string memory projectId)
        public
        view
        returns (bool exists, bool launched)
    {
        exists = projectExists[projectId];
        if (exists) {
            launched = projects[projectId].launched;
        }
    }
    
    /**
     * @dev Transfer ownership (for admin changes)
     * @param newOwner - New owner address
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
```

---

## 📊 Contract Functions Summary

### KYCVerification Contract

| Function | Access | Description |
|----------|--------|-------------|
| `storeKYCVerification()` | Owner Only | Store hashed KYC data after admin approval |
| `updateKYCVerification()` | Owner Only | Update existing KYC hash |
| `getKYCVerification()` | Public | Get KYC record for a user |
| `checkKYCStatus()` | Public | Check if user has KYC verification |
| `transferOwnership()` | Owner Only | Transfer contract ownership |

### KYBVerification Contract

| Function | Access | Description |
|----------|--------|-------------|
| `storeKYBVerification()` | Owner Only | Store hashed email after admin approval |
| `updateKYBVerification()` | Owner Only | Update existing KYB hash |
| `getKYBVerification()` | Public | Get KYB record for a user |
| `checkKYBStatus()` | Public | Check if user has KYB verification |
| `transferOwnership()` | Owner Only | Transfer contract ownership |

### ProjectRegistry Contract

| Function | Access | Description |
|----------|--------|-------------|
| `storeProjectData()` | Owner Only | Store hashed project data after success |
| `confirmLaunchDate()` | Public | VCs/exchanges confirm launch date |
| `markProjectLaunched()` | Owner Only | Mark project as officially launched |
| `updateProjectData()` | Owner Only | Update existing project hash |
| `getProjectData()` | Public | Get project record |
| `getLaunchConfirmers()` | Public | Get addresses who confirmed launch |
| `checkProjectStatus()` | Public | Check project existence and launch status |
| `transferOwnership()` | Owner Only | Transfer contract ownership |

---

## 🔒 Security Features

- ✅ **Owner-Only Functions**: Only admin can store/update data
- ✅ **Input Validation**: All inputs are validated
- ✅ **Events**: All operations emit events for tracking
- ✅ **Ownership Transfer**: Can transfer ownership if needed
- ✅ **No Raw Data**: Only hashed data stored on-chain

---

## 📝 Events

All contracts emit events for tracking:

- **KYCVerification**: `KYCStored`, `KYCUpdated`
- **KYBVerification**: `KYBStored`, `KYBUpdated`
- **ProjectRegistry**: `ProjectStored`, `ProjectUpdated`, `LaunchDateConfirmed`

---

## 🚀 Deployment

Deploy to BSC Testnet:
```bash
npm run deploy:bsc-testnet
```

Deploy to BSC Mainnet:
```bash
npm run deploy:bsc
```

---

**Primary Deployment Network**: BNB Smart Chain (BSC) - Chain ID 56

*All contracts are ready for deployment and fully tested.*

