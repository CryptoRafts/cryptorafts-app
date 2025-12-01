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

