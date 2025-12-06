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
        bytes32 indexed frontIdHash,
        bytes32 indexed backIdHash,
        bytes32 proofOfAddressHash,
        bytes32 liveSnapHash,
        bool approved,
        uint256 timestamp
    );
    
    event KYCUpdated(
        string indexed userId,
        bytes32 indexed newFrontIdHash,
        bytes32 indexed newBackIdHash,
        bytes32 newProofOfAddressHash,
        bytes32 newLiveSnapHash,
        uint256 timestamp
    );
    
    event KYCDeleted(
        string indexed userId,
        uint256 timestamp,
        address deletedBy
    );
    
    // Struct for KYC data
    struct KYCRecord {
        bytes32 frontIdHash;        // Hashed and salted front ID card
        bytes32 backIdHash;         // Hashed and salted back ID card
        bytes32 proofOfAddressHash; // Hashed and salted proof of address
        bytes32 liveSnapHash;       // Hashed and salted live snap (selfie)
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
     * @dev Store KYC verification hashes on BNB Chain after admin approval
     * @param userId - Unique user identifier
     * @param frontIdHash - Hashed and salted front ID card (32 bytes)
     * @param backIdHash - Hashed and salted back ID card (32 bytes)
     * @param proofOfAddressHash - Hashed and salted proof of address (32 bytes)
     * @param liveSnapHash - Hashed and salted live snap/selfie (32 bytes)
     * @param approved - Approval status from admin
     * 
     * This function is called automatically after admin approves KYC.
     * Only ID cards, proof of address, and live snap are stored on-chain as hashes.
     */
    function storeKYCVerification(
        string memory userId,
        bytes32 frontIdHash,
        bytes32 backIdHash,
        bytes32 proofOfAddressHash,
        bytes32 liveSnapHash,
        bool approved
    ) public onlyOwner {
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(frontIdHash != bytes32(0), "Front ID hash cannot be zero");
        require(backIdHash != bytes32(0), "Back ID hash cannot be zero");
        require(proofOfAddressHash != bytes32(0), "Proof of address hash cannot be zero");
        require(liveSnapHash != bytes32(0), "Live snap hash cannot be zero");
        
        KYCRecord memory record = KYCRecord({
            frontIdHash: frontIdHash,
            backIdHash: backIdHash,
            proofOfAddressHash: proofOfAddressHash,
            liveSnapHash: liveSnapHash,
            approved: approved,
            deleted: false,
            timestamp: block.timestamp,
            deletedAt: 0,
            storedBy: msg.sender,
            deletedBy: address(0)
        });
        
        kycRecords[userId] = record;
        hasKYC[userId] = true;
        
        emit KYCStored(userId, frontIdHash, backIdHash, proofOfAddressHash, liveSnapHash, approved, block.timestamp);
    }
    
    /**
     * @dev Update existing KYC verification hashes
     * @param userId - Unique user identifier
     * @param newFrontIdHash - New hashed and salted front ID card
     * @param newBackIdHash - New hashed and salted back ID card
     * @param newProofOfAddressHash - New hashed and salted proof of address
     * @param newLiveSnapHash - New hashed and salted live snap
     */
    function updateKYCVerification(
        string memory userId,
        bytes32 newFrontIdHash,
        bytes32 newBackIdHash,
        bytes32 newProofOfAddressHash,
        bytes32 newLiveSnapHash
    ) public onlyOwner {
        require(hasKYC[userId], "KYC record does not exist");
        require(newFrontIdHash != bytes32(0), "Front ID hash cannot be zero");
        require(newBackIdHash != bytes32(0), "Back ID hash cannot be zero");
        require(newProofOfAddressHash != bytes32(0), "Proof of address hash cannot be zero");
        require(newLiveSnapHash != bytes32(0), "Live snap hash cannot be zero");
        
        kycRecords[userId].frontIdHash = newFrontIdHash;
        kycRecords[userId].backIdHash = newBackIdHash;
        kycRecords[userId].proofOfAddressHash = newProofOfAddressHash;
        kycRecords[userId].liveSnapHash = newLiveSnapHash;
        kycRecords[userId].timestamp = block.timestamp;
        kycRecords[userId].storedBy = msg.sender;
        
        emit KYCUpdated(userId, newFrontIdHash, newBackIdHash, newProofOfAddressHash, newLiveSnapHash, block.timestamp);
    }
    
    /**
     * @dev Get KYC verification record
     * @param userId - Unique user identifier
     * @return frontIdHash - Hashed front ID card
     * @return backIdHash - Hashed back ID card
     * @return proofOfAddressHash - Hashed proof of address
     * @return liveSnapHash - Hashed live snap
     * @return approved - Approval status
     * @return timestamp - When stored on-chain
     */
    function getKYCVerification(string memory userId)
        public
        view
        returns (
            bytes32 frontIdHash,
            bytes32 backIdHash,
            bytes32 proofOfAddressHash,
            bytes32 liveSnapHash,
            bool approved,
            uint256 timestamp
        )
    {
        require(hasKYC[userId], "KYC record does not exist");
        
        KYCRecord memory record = kycRecords[userId];
        return (
            record.frontIdHash,
            record.backIdHash,
            record.proofOfAddressHash,
            record.liveSnapHash,
            record.approved,
            record.timestamp
        );
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
     * @dev Delete KYC verification record after approval
     * This function marks the on-chain data as deleted for user safety
     * The data is not physically removed (blockchain immutability) but marked as deleted
     * @param userId - Unique user identifier
     * 
     * This function is called automatically after admin approval to ensure data privacy.
     */
    function deleteKYCVerification(string memory userId) public onlyOwner {
        require(hasKYC[userId], "KYC record does not exist");
        require(!kycRecords[userId].deleted, "KYC record already deleted");
        
        kycRecords[userId].deleted = true;
        kycRecords[userId].deletedAt = block.timestamp;
        kycRecords[userId].deletedBy = msg.sender;
        
        emit KYCDeleted(userId, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Get KYC verification record (returns empty if deleted)
     * @param userId - Unique user identifier
     * @return frontIdHash - Hashed front ID card
     * @return backIdHash - Hashed back ID card
     * @return proofOfAddressHash - Hashed proof of address
     * @return liveSnapHash - Hashed live snap
     * @return approved - Approval status
     * @return deleted - Whether record is deleted
     * @return timestamp - When stored on-chain
     */
    function getKYCVerification(string memory userId)
        public
        view
        returns (
            bytes32 frontIdHash,
            bytes32 backIdHash,
            bytes32 proofOfAddressHash,
            bytes32 liveSnapHash,
            bool approved,
            bool deleted,
            uint256 timestamp
        )
    {
        require(hasKYC[userId], "KYC record does not exist");
        
        KYCRecord memory record = kycRecords[userId];
        
        // If deleted, return zero hashes for privacy
        if (record.deleted) {
            return (
                bytes32(0),
                bytes32(0),
                bytes32(0),
                bytes32(0),
                record.approved,
                true,
                record.timestamp
            );
        }
        
        return (
            record.frontIdHash,
            record.backIdHash,
            record.proofOfAddressHash,
            record.liveSnapHash,
            record.approved,
            false,
            record.timestamp
        );
    }
    
    /**
     * @dev Check if user has KYC verification (returns false if deleted)
     * @param userId - Unique user identifier
     * @return exists - Whether KYC record exists
     * @return approved - Approval status (if exists and not deleted)
     * @return deleted - Whether record is deleted
     */
    function checkKYCStatus(string memory userId)
        public
        view
        returns (bool exists, bool approved, bool deleted)
    {
        exists = hasKYC[userId];
        if (exists) {
            deleted = kycRecords[userId].deleted;
            approved = !deleted && kycRecords[userId].approved;
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


