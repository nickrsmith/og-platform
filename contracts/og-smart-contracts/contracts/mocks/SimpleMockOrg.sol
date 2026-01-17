// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleMockOrg {
    struct Asset {
        uint256 id;
        string name;
        string ipfsHash;
        uint256 price;
        address creator;
        bool isVerified;
        bool canBeLicensed;
    }
    
    struct License {
        uint256 assetId;
        address licensee;
        uint256 pricePaid;
        uint256 timestamp;
    }
    
    address public principal;
    mapping(uint256 => Asset) public assets;
    mapping(address => bool) public creators;
    mapping(address => License[]) public userLicenses;
    uint256 public assetCount;
    
    event AssetCreated(uint256 indexed assetId, string name, address creator);
    event AssetVerified(uint256 indexed assetId);
    event AssetLicensed(uint256 indexed assetId, address licensee, uint256 price);
    
    constructor(address _principal) {
        principal = _principal;
        creators[_principal] = true;
    }
    
    function addCreator(address creator) external {
        require(msg.sender == principal, "Only principal");
        creators[creator] = true;
    }
    
    function createAsset(
        string memory name,
        string memory ipfsHash,
        uint256 price
    ) external returns (uint256) {
        require(creators[msg.sender], "Not a creator");
        
        assetCount++;
        assets[assetCount] = Asset({
            id: assetCount,
            name: name,
            ipfsHash: ipfsHash,
            price: price,
            creator: msg.sender,
            isVerified: false,
            canBeLicensed: true
        });
        
        emit AssetCreated(assetCount, name, msg.sender);
        return assetCount;
    }
    
    function verifyAsset(uint256 assetId) external {
        require(msg.sender == principal, "Only principal can verify");
        require(assets[assetId].id != 0, "Asset not found");
        
        assets[assetId].isVerified = true;
        emit AssetVerified(assetId);
    }
    
    function licenseAsset(uint256 assetId) external payable {
        Asset memory asset = assets[assetId];
        require(asset.id != 0, "Asset not found");
        require(asset.isVerified, "Asset not verified");
        require(asset.canBeLicensed, "Asset cannot be licensed");
        require(msg.value >= asset.price, "Insufficient payment");
        
        userLicenses[msg.sender].push(License({
            assetId: assetId,
            licensee: msg.sender,
            pricePaid: msg.value,
            timestamp: block.timestamp
        }));
        
        // Transfer payment to creator
        payable(asset.creator).transfer(msg.value);
        
        emit AssetLicensed(assetId, msg.sender, msg.value);
    }
    
    function getAsset(uint256 assetId) external view returns (
        uint256 id,
        string memory name,
        string memory ipfsHash,
        uint256 price,
        address creator,
        bool isVerified,
        bool canBeLicensed
    ) {
        Asset memory asset = assets[assetId];
        return (
            asset.id,
            asset.name,
            asset.ipfsHash,
            asset.price,
            asset.creator,
            asset.isVerified,
            asset.canBeLicensed
        );
    }
    
    function getUserLicenseCount(address user) external view returns (uint256) {
        return userLicenses[user].length;
    }
}