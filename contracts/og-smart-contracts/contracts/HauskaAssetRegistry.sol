// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";
import "./EmpressaAssetNFT.sol";

contract EmpressaAssetRegistry is AccessControl, IEmpressaStructs {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant ORG_CONTRACT_ROLE = keccak256("ORG_CONTRACT_ROLE");
    bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");
    
    // Asset NFT contract
    EmpressaAssetNFT public assetNFT;
    
    // Global asset tracking
    mapping(bytes32 => bool) public globalAssetHashExists;
    
    // Organization specific assets
    mapping(address => mapping(uint256 => VerifiedDigitalAsset)) public assets;
    mapping(address => uint256) public assetCounter;
    mapping(address => mapping(address => uint256[])) public creatorAssets;

    // Asset verification tracking
    mapping(address => mapping(uint256 => address)) public assetVerifiers;
    
    // Struct for IPFS hash to asset mapping
    struct AssetIdentifier {
        address orgContract;
        uint256 assetId;
    }
    
    // IPFS hash to asset mapping
    mapping(string => AssetIdentifier) public ipfsHashToAssetId;
    
    event AssetRegistered(
        address indexed orgContract,
        uint256 indexed assetId,
        address indexed creator,
        bytes32 assetHash
    );
    
    event AssetVerified(
        address indexed orgContract,
        uint256 indexed assetId,
        address indexed verifier
    );

    event AssetUnverified(
        address indexed orgContract,
        uint256 indexed assetId
    );
    
    modifier onlyOrgContract() {
        require(hasRole(ORG_CONTRACT_ROLE, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_ADMIN_ROLE, msg.sender);
    }
    
    function setAssetNFT(address _assetNFT) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(_assetNFT != address(0), "Invalid NFT contract address");
        assetNFT = EmpressaAssetNFT(_assetNFT);
    }
    
    function addOrgContract(address orgContract) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(orgContract != address(0), "Invalid org contract address");
        _grantRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    function removeOrgContract(address orgContract) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(orgContract != address(0), "Invalid org contract address");
        _revokeRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    function registerAsset(
        VerifiedDigitalAsset memory asset,
        address creator
    ) external onlyOrgContract returns (uint256) {
        require(!globalAssetHashExists[asset.assetHash], "Asset hash already exists globally");
        require(
            ipfsHashToAssetId[asset.ipfsHash].orgContract == address(0),
            "IPFS hash already exists globally"
        );
        
        address orgContract = msg.sender;
        assetCounter[orgContract]++;
        uint256 assetId = assetCounter[orgContract];
        
        asset.assetId = assetId;
        assets[orgContract][assetId] = asset;
        creatorAssets[orgContract][creator].push(assetId);
        
        globalAssetHashExists[asset.assetHash] = true;
        ipfsHashToAssetId[asset.ipfsHash] = AssetIdentifier(orgContract, assetId);
        
        // Mint NFT for the asset if NFT contract is set
        if (address(assetNFT) != address(0)) {
            string memory tokenURI = string(abi.encodePacked("ipfs://", asset.metadataHash));
            assetNFT.mintAssetNFT(asset.owner, orgContract, assetId, tokenURI);
        }
        
        emit AssetRegistered(orgContract, assetId, creator, asset.assetHash);
        
        return assetId;
    }
    
    function verifyAsset(
        address orgContract,
        uint256 assetId,
        address verifier
    ) external onlyOrgContract {
        require(assets[orgContract][assetId].assetId != 0, "Asset does not exist");
        require(!assets[orgContract][assetId].encrypted, "Cannot verify encrypted assets");
        require(!assets[orgContract][assetId].isVerified, "Asset already verified");
        
        assets[orgContract][assetId].isVerified = true;
        assetVerifiers[orgContract][assetId] = verifier;
        
        emit AssetVerified(orgContract, assetId, verifier);
    }

    function unverifyAsset(
        address orgContract,
        uint256 assetId
        ) external onlyRole(REGISTRY_ADMIN_ROLE) {
        require(assets[orgContract][assetId].assetId != 0, "Asset does not exist");
        require(assets[orgContract][assetId].isVerified, "Asset is not verified");

        assets[orgContract][assetId].isVerified = false;
        emit AssetUnverified(orgContract, assetId);
    }
    
    function getAsset(
        address orgContract,
        uint256 assetId
    ) external view returns (VerifiedDigitalAsset memory) {
        VerifiedDigitalAsset memory asset = assets[orgContract][assetId];
        (uint32 EmpressaFeePct, uint32 integratorFeePct) = IEmpressaRevenueDistributor(IEmpressaOrgContract(orgContract).revenueDistributor()).getCustomFees(orgContract);
        asset.price = asset.price * (10000 + EmpressaFeePct + integratorFeePct) / 10000;
        return asset;
    }
    
    function getAssetsByCreator(
        address orgContract,
        address creator
    ) external view returns (uint256[] memory) {
        return creatorAssets[orgContract][creator];
    }
    
    function isAssetVerified(
        address orgContract,
        uint256 assetId
    ) external view returns (bool) {
        return assets[orgContract][assetId].isVerified;
    }

    function transferAssetOwnership(
        address orgContract,
        uint256 assetId,
        address newOwner,
        address caller
    ) external onlyOrgContract {
        VerifiedDigitalAsset storage asset = assets[orgContract][assetId];
        require(asset.assetId != 0, "Asset does not exist");
        require(asset.owner == caller, "Only asset owner can transfer");
        require(newOwner != address(0), "New owner cannot be zero address");

        // If NFT exists, verify ownership and transfer it
        if (address(assetNFT) != address(0) && assetNFT.assetHasNFT(orgContract, assetId)) {
            uint256 tokenId = assetNFT.getTokenIdForAsset(orgContract, assetId);
            require(assetNFT.ownerOf(tokenId) == caller, "Caller does not own the NFT");
            
            // The NFT transfer will be handled by the org contract calling transferFrom
            // Just update our records here
        }

        asset.owner = newOwner;
        asset.lastTransferTime = block.timestamp;
    }
    
    function updateAsset(
        address orgContract,
        uint256 assetId,
        string memory newIpfsHash,
        bytes32 newMetadataHash,
        uint256 newPrice,
        bool canBeLicensed,
        address caller
    ) external onlyOrgContract {
        VerifiedDigitalAsset storage asset = assets[orgContract][assetId];
        require(asset.assetId != 0, "Asset does not exist");
        require(asset.owner == caller || asset.creator == caller, "Only owner or creator can update");
        require(!asset.isVerified, "Verified price locked");
        
        // Update fields that can be changed
        if (bytes(newIpfsHash).length > 0) {
            // Check if new IPFS hash is unique
            require(
                ipfsHashToAssetId[newIpfsHash].orgContract == address(0),
                "IPFS hash already registered"
            );
            
            // Remove old IPFS hash mapping
            delete ipfsHashToAssetId[asset.ipfsHash];
            
            // Update to new IPFS hash
            asset.ipfsHash = newIpfsHash;
            ipfsHashToAssetId[newIpfsHash] = AssetIdentifier(orgContract, assetId);
        }
        
        if (newMetadataHash != bytes32(0)) {
            asset.metadataHash = newMetadataHash;
        }
        
        if (newPrice > 0) {
            asset.price = newPrice;
        }
        
        asset.canBeLicensed = canBeLicensed;
        
        // Increment version
        asset.version++;
        
        emit AssetUpdated(orgContract, assetId, asset.version, caller);
    }
    
    event AssetUpdated(
        address indexed orgContract,
        uint256 indexed assetId,
        uint256 newVersion,
        address updatedBy
    );
    
    event AssetTransferredCrossOrg(
        address indexed fromOrg,
        address indexed toOrg,
        uint256 indexed assetId,
        uint256 newAssetId,
        address transferredBy
    );
    
    /**
     * @dev Transfer an asset from one organization to another
     * @param fromOrg Source organization contract
     * @param toOrg Destination organization contract
     * @param assetId Asset ID in source organization
     * @param newOwner New owner in destination organization
     * @return newAssetId The asset ID in the destination organization
     */
    function transferAssetCrossOrg(
        address fromOrg,
        address toOrg,
        uint256 assetId,
        address curOwner,
        address newOwner
    ) external onlyOrgContract returns (uint256 newAssetId) {
        require(hasRole(ORG_CONTRACT_ROLE, fromOrg), "Source org not authorized");
        require(hasRole(ORG_CONTRACT_ROLE, toOrg), "Destination org not authorized");
        require(fromOrg != toOrg, "Cannot transfer to same org");
        require(newOwner != address(0), "Invalid new owner");
        
        // Get the asset from source org
        VerifiedDigitalAsset storage sourceAsset = assets[fromOrg][assetId];
        require(sourceAsset.assetId > 0, "Asset does not exist");
        
        // Verify caller has permission (must be principal of source org)
        require(
            IEmpressaOrgContract(fromOrg).hasRole(keccak256("PRINCIPAL_ROLE"), curOwner),
            "Only principal can transfer cross-org"
        );
        
        // Create a copy of the asset in destination org
        newAssetId = assetCounter[toOrg] + 1;
        assetCounter[toOrg] = newAssetId;
        
        VerifiedDigitalAsset storage newAsset = assets[toOrg][newAssetId];
        newAsset.assetId = newAssetId;
        newAsset.creator = sourceAsset.creator; // Preserve original creator
        newAsset.owner = newOwner; // New owner in destination org
        newAsset.partner = IEmpressaOrgContract(toOrg).integrationPartner();
        newAsset.ipfsHash = sourceAsset.ipfsHash;
        newAsset.metadataHash = sourceAsset.metadataHash;
        newAsset.assetHash = sourceAsset.assetHash;
        newAsset.version = 1; // Reset version for new org
        newAsset.isVerified = false; // Needs re-verification in new org
        newAsset.creationTime = block.timestamp;
        newAsset.lastTransferTime = block.timestamp;
        newAsset.price = sourceAsset.price;
        newAsset.encrypted = sourceAsset.encrypted;
        newAsset.canBeLicensed = sourceAsset.canBeLicensed;
        newAsset.fxPool = sourceAsset.fxPool;
        newAsset.eventTimestamp = sourceAsset.eventTimestamp;
        
        // Note: Global hash uniqueness is maintained - same asset can exist in multiple orgs
        
        // Mint NFT for the new asset if NFT contract is set
        if (address(assetNFT) != address(0)) {
            string memory tokenURI = string(abi.encodePacked("ipfs://", newAsset.metadataHash));
            assetNFT.mintAssetNFT(newOwner, toOrg, newAssetId, tokenURI);

            delete assets[fromOrg][assetId];
            uint256 count = assetCounter[fromOrg] - 1;
            assetCounter[fromOrg] = count;

            for(uint256 i = assetId ; i <= count; i++)
            {
                assets[fromOrg][i] = assets[fromOrg][i + 1];
            }
        }
        
        emit AssetRegistered(toOrg, newAssetId, newOwner, newAsset.assetHash);
        emit AssetTransferredCrossOrg(fromOrg, toOrg, assetId, newAssetId, curOwner);
        
        return newAssetId;
    }
    
    function getAssetCount(address orgContract) external view returns (uint256) {
        return assetCounter[orgContract];
    }

    function assetNFTAddress() external view returns (address) {
        return address(assetNFT);
    }

    function isIPFSHashUsed(string memory ipfsHash) external view returns (bool) {
        return ipfsHashToAssetId[ipfsHash].assetId > 0;
    }
}