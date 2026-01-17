// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IHauskaStructs.sol";

interface IHauskaLicenseMetadata {
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

/**
 * @title HauskaLicenseNFT
 * @dev ERC-721 based license management system for Hauska platform
 * Each license is represented as an NFT that can be transferred and traded
 */
contract HauskaLicenseNFT is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    Counters.Counter private _tokenIdCounter;
    address public metadataContract;

    struct LicenseData {
        uint256 assetId;
        address orgContract;
        address originalCreator;
        uint256 issuedAt;
        uint256 expirationTime; // 0 for perpetual
        uint8 permissions; // Bitmap: bit 0 = resell, bit 1 = view
        uint256 resellerFee;
        bool isActive;
    }

    // Mapping from token ID to license data
    mapping(uint256 => LicenseData) public licenseData;
    
    // Mapping to track if a user has a license for an asset
    mapping(address => mapping(uint256 => mapping(address => bool))) public hasLicense; // orgContract => assetId => user => bool
    
    // Mapping to track user's license for an asset
    mapping(address => mapping(uint256 => mapping(address => uint256))) public userLicenseToken; // orgContract => assetId => user => tokenId

    // Events
    event LicenseMinted(
        uint256 indexed tokenId,
        address indexed orgContract,
        uint256 indexed assetId,
        address licensee,
        uint256 expirationTime
    );
    
    event LicenseTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 assetId
    );
    
    event LicenseRevoked(uint256 indexed tokenId);
    event LicenseExpired(uint256 indexed tokenId);

    constructor() ERC721("Hauska License", "HLICENSE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Set the metadata contract address
     * @param _metadataContract Address of the metadata contract
     */
    function setMetadataContract(address _metadataContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_metadataContract != address(0), "Invalid metadata contract");
        metadataContract = _metadataContract;
    }

    /**
     * @dev Mint a new license NFT
     * @param to Address to receive the license
     * @param orgContract Organization contract address
     * @param assetId Asset ID being licensed
     * @param creator Original creator of the asset
     * @param permissions Permission bitmap
     * @param resellerFee Fee for reselling
     * @param duration License duration in seconds (0 for perpetual)
     * @return tokenId The ID of the minted license NFT
     */
    function mintLicense(
        address to,
        address orgContract,
        uint256 assetId,
        address creator,
        uint8 permissions,
        uint256 resellerFee,
        uint256 duration
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(orgContract != address(0), "Invalid org contract");
        require(!hasLicense[orgContract][assetId][to], "User already has license");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        uint256 expirationTime = duration > 0 ? block.timestamp + duration : 0;
        
        licenseData[tokenId] = LicenseData({
            assetId: assetId,
            orgContract: orgContract,
            originalCreator: creator,
            issuedAt: block.timestamp,
            expirationTime: expirationTime,
            permissions: permissions,
            resellerFee: resellerFee,
            isActive: true
        });
        
        hasLicense[orgContract][assetId][to] = true;
        userLicenseToken[orgContract][assetId][to] = tokenId;
        
        emit LicenseMinted(tokenId, orgContract, assetId, to, expirationTime);
        
        return tokenId;
    }

    /**
     * @dev Set token URI for a license
     * @param tokenId License token ID
     * @param uri Metadata URI
     */
    function setLicenseURI(uint256 tokenId, string memory uri) 
        public 
        onlyRole(MINTER_ROLE) 
    {
        require(_exists(tokenId), "License does not exist");
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Revoke a license
     * @param tokenId License token ID
     */
    function revokeLicense(uint256 tokenId) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "License does not exist");
        
        LicenseData storage license = licenseData[tokenId];
        license.isActive = false;
        
        address owner = ownerOf(tokenId);
        hasLicense[license.orgContract][license.assetId][owner] = false;
        delete userLicenseToken[license.orgContract][license.assetId][owner];
        
        emit LicenseRevoked(tokenId);
    }

    /**
     * @dev Check if a license is valid (active and not expired)
     * @param tokenId License token ID
     * @return bool True if license is valid
     */
    function isLicenseValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        
        LicenseData memory license = licenseData[tokenId];
        
        if (!license.isActive) return false;
        if (license.expirationTime > 0 && block.timestamp > license.expirationTime) return false;
        
        return true;
    }

    /**
     * @dev Check if a user has a valid license for an asset
     * @param orgContract Organization contract address
     * @param assetId Asset ID
     * @param user User address
     * @return bool True if user has valid license
     */
    function hasValidLicense(address orgContract, uint256 assetId, address user) 
        public 
        view 
        returns (bool) 
    {
        if (!hasLicense[orgContract][assetId][user]) return false;
        
        uint256 tokenId = userLicenseToken[orgContract][assetId][user];
        return isLicenseValid(tokenId);
    }

    /**
     * @dev Get license details
     * @param tokenId License token ID
     * @return License data
     */
    function getLicenseDetails(uint256 tokenId) 
        public 
        view 
        returns (LicenseData memory) 
    {
        require(_exists(tokenId), "License does not exist");
        return licenseData[tokenId];
    }

    /**
     * @dev Get all licenses for a user
     * @param user User address
     * @return tokenIds Array of license token IDs
     */
    function getUserLicenses(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 balance = balanceOf(user);
        uint256[] memory licenses = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            licenses[i] = tokenOfOwnerByIndex(user, i);
        }
        
        return licenses;
    }

    /**
     * @dev Pause license minting
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause license minting
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Update license tracking on transfer
        if (from != address(0) && to != address(0)) {
            LicenseData memory license = licenseData[tokenId];
            
            // Remove from previous owner
            hasLicense[license.orgContract][license.assetId][from] = false;
            delete userLicenseToken[license.orgContract][license.assetId][from];
            
            // Add to new owner
            hasLicense[license.orgContract][license.assetId][to] = true;
            userLicenseToken[license.orgContract][license.assetId][to] = tokenId;
            
            emit LicenseTransferred(tokenId, from, to, license.assetId);
        }
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up license data
        LicenseData memory license = licenseData[tokenId];
        address owner = ownerOf(tokenId);


        hasLicense[license.orgContract][license.assetId][owner] = false;
        delete userLicenseToken[license.orgContract][license.assetId][owner];
        delete licenseData[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");
        
        // If metadata contract is set, use it
        if (metadataContract != address(0)) {
            try IHauskaLicenseMetadata(metadataContract).tokenURI(tokenId) returns (string memory uri) {
                return uri;
            } catch {
                // Fall back to stored URI
            }
        }
        
        // Otherwise use stored URI
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}