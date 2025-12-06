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



