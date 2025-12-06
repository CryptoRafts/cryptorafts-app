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
        bytes32 indexed phoneHash,
        bytes32 indexed emailHash,
        bool approved,
        uint256 timestamp
    );
    
    event KYBUpdated(
        string indexed userId,
        bytes32 indexed newPhoneHash,
        bytes32 indexed newEmailHash,
        uint256 timestamp
    );
    
    event KYBDeleted(
        string indexed userId,
        uint256 timestamp,
        address deletedBy
    );
    
    // Struct for KYB data
    struct KYBRecord {
        bytes32 phoneHash;          // Hashed and salted phone number
        bytes32 emailHash;          // Hashed and salted email address
        bool approved;             // Approval status
        bool deleted;              // Deletion flag - marks data as deleted after approval
        uint256 timestamp;          // When stored on-chain
        uint256 deletedAt;          // When deleted (0 if not deleted)
        address storedBy;           // Admin who stored it
        address deletedBy;          // Admin who deleted it (address(0) if not deleted)
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
     * @dev Store KYB verification hashes on BNB Chain after admin approval
     * @param userId - Unique user identifier (VC or influencer)
     * @param phoneHash - Hashed and salted phone number (32 bytes)
     * @param emailHash - Hashed and salted email address (32 bytes)
     * @param approved - Approval status from admin
     * 
     * This function is called automatically after admin approves KYB.
     * Only phone number and email are hashed and stored on-chain.
     */
    function storeKYBVerification(
        string memory userId,
        bytes32 phoneHash,
        bytes32 emailHash,
        bool approved
    ) public onlyOwner {
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(phoneHash != bytes32(0), "Phone hash cannot be zero");
        require(emailHash != bytes32(0), "Email hash cannot be zero");
        
        KYBRecord memory record = KYBRecord({
            phoneHash: phoneHash,
            emailHash: emailHash,
            approved: approved,
            deleted: false,
            timestamp: block.timestamp,
            deletedAt: 0,
            storedBy: msg.sender,
            deletedBy: address(0)
        });
        
        kybRecords[userId] = record;
        hasKYB[userId] = true;
        
        emit KYBStored(userId, phoneHash, emailHash, approved, block.timestamp);
    }
    
    /**
     * @dev Update existing KYB verification hashes
     * @param userId - Unique user identifier
     * @param newPhoneHash - New hashed and salted phone number
     * @param newEmailHash - New hashed and salted email address
     */
    function updateKYBVerification(
        string memory userId,
        bytes32 newPhoneHash,
        bytes32 newEmailHash
    ) public onlyOwner {
        require(hasKYB[userId], "KYB record does not exist");
        require(newPhoneHash != bytes32(0), "Phone hash cannot be zero");
        require(newEmailHash != bytes32(0), "Email hash cannot be zero");
        
        kybRecords[userId].phoneHash = newPhoneHash;
        kybRecords[userId].emailHash = newEmailHash;
        kybRecords[userId].timestamp = block.timestamp;
        kybRecords[userId].storedBy = msg.sender;
        
        emit KYBUpdated(userId, newPhoneHash, newEmailHash, block.timestamp);
    }
    
    /**
     * @dev Delete KYB verification record after approval
     * This function marks the on-chain data as deleted for user safety
     * The data is not physically removed (blockchain immutability) but marked as deleted
     * @param userId - Unique user identifier
     * 
     * This function is called automatically after admin approval to ensure data privacy.
     */
    function deleteKYBVerification(string memory userId) public onlyOwner {
        require(hasKYB[userId], "KYB record does not exist");
        require(!kybRecords[userId].deleted, "KYB record already deleted");
        
        kybRecords[userId].deleted = true;
        kybRecords[userId].deletedAt = block.timestamp;
        kybRecords[userId].deletedBy = msg.sender;
        
        emit KYBDeleted(userId, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Get KYB verification record (returns empty if deleted)
     * @param userId - Unique user identifier
     * @return phoneHash - Hashed phone number
     * @return emailHash - Hashed email address
     * @return approved - Approval status
     * @return deleted - Whether record is deleted
     * @return timestamp - When stored on-chain
     */
    function getKYBVerification(string memory userId)
        public
        view
        returns (
            bytes32 phoneHash,
            bytes32 emailHash,
            bool approved,
            bool deleted,
            uint256 timestamp
        )
    {
        require(hasKYB[userId], "KYB record does not exist");
        
        KYBRecord memory record = kybRecords[userId];
        
        // If deleted, return zero hashes for privacy
        if (record.deleted) {
            return (
                bytes32(0),
                bytes32(0),
                record.approved,
                true,
                record.timestamp
            );
        }
        
        return (record.phoneHash, record.emailHash, record.approved, false, record.timestamp);
    }
    
    /**
     * @dev Check if user has KYB verification (returns false if deleted)
     * @param userId - Unique user identifier
     * @return exists - Whether KYB record exists
     * @return approved - Approval status (if exists and not deleted)
     * @return deleted - Whether record is deleted
     */
    function checkKYBStatus(string memory userId)
        public
        view
        returns (bool exists, bool approved, bool deleted)
    {
        exists = hasKYB[userId];
        if (exists) {
            deleted = kybRecords[userId].deleted;
            approved = !deleted && kybRecords[userId].approved;
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


