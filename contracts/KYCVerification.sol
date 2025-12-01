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

