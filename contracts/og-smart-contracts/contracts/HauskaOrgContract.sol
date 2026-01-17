// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";

contract EmpressaOrgContract is AccessControl, IEmpressaStructs {
    
    bytes32 public constant PRINCIPAL_ROLE = keccak256("PRINCIPAL_ROLE");
    bytes32 public constant CREATOR_ROLE = keccak256("CREATOR_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    address public immutable factory;
    address public immutable principal;
    address public integrationPartner;
    
    // Module addresses
    address public licenseManager;
    address public assetRegistry;
    address public groupManager;
    address public revenueDistributor;
    
    address[] public creators;
    mapping(address => bool) public isCreator;
    
    event CreatorAdded(address indexed creator);
    event CreatorRemoved(address indexed creator);
    event ModuleSet(string moduleName, address moduleAddress);
    event AssetTransferred(uint256 indexed assetId, address indexed from, address indexed to);
    event AssetTransferredCrossOrg(uint256 indexed assetId, address indexed toOrg, uint256 indexed newAssetId, address newOwner);
    event DebugBurn(uint256 oldAssetId, uint256 newAssetId, bool burned);
    
    modifier onlyPrincipalOrAdmin() {
        require(
            hasRole(PRINCIPAL_ROLE, msg.sender) || 
            IAccessControl(factory).hasRole(0x0000000000000000000000000000000000000000000000000000000000000000, msg.sender) ||
            msg.sender == factory, // Allow factory to set initial modules
            "Caller is not principal or admin"
        );
        _;
    }
    
    modifier onlyCreator() {
        require(hasRole(CREATOR_ROLE, msg.sender), "Caller is not a creator");
        _;
    }
    
    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "Caller is not a verifier");
        _;
    }
    
    constructor(
        address _factory,
        address _principal,
        address _integrationPartner
    ) {
        require(_factory != address(0), "Factory cannot be zero address");
        require(_principal != address(0), "Principal cannot be zero address");
        
        factory = _factory;
        principal = _principal;
        integrationPartner = _integrationPartner;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _principal);
        _grantRole(PRINCIPAL_ROLE, _principal);
        _grantRole(CREATOR_ROLE, _principal);
        _grantRole(VERIFIER_ROLE, _principal);
        
        creators.push(_principal);
        isCreator[_principal] = true;
    }
    
    function setLicenseManager(address _licenseManager) external onlyPrincipalOrAdmin {
        require(_licenseManager != address(0), "License manager cannot be zero address");
        licenseManager = _licenseManager;
        emit ModuleSet("LicenseManager", _licenseManager);
    }
    
    function setAssetRegistry(address _assetRegistry) external onlyPrincipalOrAdmin {
        require(_assetRegistry != address(0), "Asset registry cannot be zero address");
        assetRegistry = _assetRegistry;
        emit ModuleSet("AssetRegistry", _assetRegistry);
    }
    
    function setGroupManager(address _groupManager) external onlyPrincipalOrAdmin {
        require(_groupManager != address(0), "Group manager cannot be zero address");
        groupManager = _groupManager;
        emit ModuleSet("GroupManager", _groupManager);
    }
    
    function setRevenueDistributor(address _revenueDistributor) external onlyPrincipalOrAdmin {
        require(_revenueDistributor != address(0), "Revenue distributor cannot be zero address");
        revenueDistributor = _revenueDistributor;
        emit ModuleSet("RevenueDistributor", _revenueDistributor);
    }
    
    function addCreator(address creator) external onlyPrincipalOrAdmin {
        require(creator != address(0), "Creator cannot be null address");
        require(!isCreator[creator], "Creator already exists");
        
        _grantRole(CREATOR_ROLE, creator);
        _grantRole(VERIFIER_ROLE, creator);
        creators.push(creator);
        isCreator[creator] = true;
        
        emit CreatorAdded(creator);
    }
    
    function removeCreator(address creator) external onlyPrincipalOrAdmin {
        require(creator != address(0), "Creator cannot be null address");
        require(isCreator[creator], "Creator does not exist");
        require(creator != principal, "Cannot remove principal");
        
        _revokeRole(CREATOR_ROLE, creator);
        _revokeRole(VERIFIER_ROLE, creator);
        isCreator[creator] = false;
        
        for (uint256 i = 0; i < creators.length; i++) {
            if (creators[i] == creator) {
                creators[i] = creators[creators.length - 1];
                creators.pop();
                break;
            }
        }
        
        emit CreatorRemoved(creator);
    }
    
    function createAsset(
        string memory assetCID,
        bytes32 metadataHash,
        bytes32 assetHash,
        uint256 price,
        bool isEncrypted,
        bool canBeLicensed,
        FxPool fxPool,
        string memory timeStamp,
        CountryCode[] memory geoRestrictions
    ) external onlyCreator returns (uint256) {
        require(assetRegistry != address(0), "Asset registry not set");
        require(bytes(assetCID).length > 0, "Asset CID cannot be empty");
        require(assetHash != bytes32(0), "Asset hash cannot be zero");
        require(metadataHash != bytes32(0), "Metadata hash cannot be zero");
        
        // The price parameter is now the total price the user will pay
        // We store this full price, and revenue distribution will handle the splits
        // This way creators can set the price they want users to see ($19.99)
        // and the system automatically handles the fee calculations during purchase
        
        // Create asset struct
        VerifiedDigitalAsset memory newAsset = VerifiedDigitalAsset({
            assetId: 0, // Will be set by registry
            creator: msg.sender,
            owner: msg.sender,
            partner: integrationPartner,
            ipfsHash: assetCID,
            metadataHash: metadataHash, // Now bytes32 (keccak256 of full JSON metadata)
            assetHash: assetHash,
            version: 1,
            isVerified: false,
            creationTime: block.timestamp,
            lastTransferTime: 0,
            price: price, // This is the full user-facing price including fees
            encrypted: isEncrypted,
            canBeLicensed: canBeLicensed,
            fxPool: fxPool,
            eventTimestamp: timeStamp,
            geographicRestrictions: geoRestrictions
        });
        
        // Register with AssetRegistry
        uint256 assetId = IEmpressaAssetRegistry(assetRegistry).registerAsset(newAsset, msg.sender);
        
        return assetId;
    }
    
    /**
     * @dev Helper function to calculate creator's net amount from gross price
     * @param grossPrice The total price including all fees
     * @return creatorAmount The amount the creator will receive after fees
     */
    function calculateCreatorAmount(uint256 grossPrice) public view returns (uint256) {
        (uint32 integratorFeePct, uint32 EmpressaFeePct) = IEmpressaContractFactory(factory).getPlatformFees();
        
        // Calculate total fee percentage (both fees are in basis points, so 10000 = 100%)
        uint256 totalFeePct = uint256(integratorFeePct) + uint256(EmpressaFeePct);
        
        // Creator receives: grossPrice * (10000 - totalFeePct) / 10000
        uint256 creatorAmount = grossPrice * 10000 / (10000 + totalFeePct);
        
        return creatorAmount;
    }
    
    /**
     * @dev Helper function to calculate gross price from desired creator amount
     * @param creatorAmount The amount the creator wants to receive
     * @return grossPrice The total price including all fees
     */
    function calculateGrossPrice(uint256 creatorAmount) public view returns (uint256) {
        (uint32 integratorFeePct, uint32 EmpressaFeePct) = IEmpressaContractFactory(factory).getPlatformFees();
        
        // Calculate total fee percentage
        uint256 totalFeePct = uint256(integratorFeePct) + uint256(EmpressaFeePct);
        
        // Gross price = creatorAmount * (10000 + totalFeePct) / 10000
        uint256 grossPrice = creatorAmount * (10000 + totalFeePct) / 10000;
        
        return grossPrice;
    }
    
    function assetRetrieval(uint256 assetId) external view returns (string memory assetCID, bytes32 metadataCID) {
        require(assetRegistry != address(0), "Asset registry not set");
        require(
            hasRole(PRINCIPAL_ROLE, msg.sender) ||
            hasRole(VERIFIER_ROLE, msg.sender) ||
            IAccessControl(factory).hasRole(0x0000000000000000000000000000000000000000000000000000000000000000, msg.sender),
            "Unauthorized access"
        );
        
        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);
        return (asset.ipfsHash, asset.metadataHash);
    }
    
    function verifyAsset(uint256 assetId) external onlyVerifier {
        require(assetRegistry != address(0), "Asset registry not set");
        
        // Delegate to AssetRegistry
        IEmpressaAssetRegistry(assetRegistry).verifyAsset(address(this), assetId, msg.sender);
    }

    function unverifyAsset(uint256 assetId) external onlyPrincipalOrAdmin {
        require(assetRegistry != address(0), "Asset registry not set");
        
        // Delegate to AssetRegistry
        IEmpressaAssetRegistry(assetRegistry).unverifyAsset(address(this), assetId);
    }
    
    function createGroup(
        string memory groupName,
        uint256[] memory groupAssets,
        uint256 groupPrice
    ) external onlyCreator returns (uint256) {
        require(groupManager != address(0), "Group manager not set");
        require(groupAssets.length > 0, "Group must have assets");
        require(groupPrice > 0, "Group price must be greater than 0");
        require(isOrganizationMember(msg.sender), "Caller is not a member of the organization");
        
        // Delegate to GroupManager
        return IEmpressaGroupManager(groupManager).createGroup(
            groupName,
            groupAssets,
            groupPrice,
            msg.sender
        );
    }

    function removeGroup(uint256 groupId) external onlyCreator {
        require(groupManager != address(0), "Group manager not set");

        // Delegate to GroupManager
        IEmpressaGroupManager(groupManager).removeGroup(groupId, msg.sender);
    }
    
    function licenseAsset(
        uint256 assetId,
        LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256) {
        require(licenseManager != address(0), "License manager not set");
        require(assetRegistry != address(0), "Asset registry not set");

        // Verify asset exists and is valid
        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);
        require(asset.assetId > 0, "Invalid asset ID");

        // Delegate to license manager
        return IEmpressaLicenseManager(licenseManager).licenseAsset(
            address(this),
            assetId,
            msg.sender,
            permissions,
            resellerFee
        );
    }
    
    function licenseGroup(
        uint256 groupId,
        LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256[] memory) {
        require(licenseManager != address(0), "License manager not set");
        require(groupManager != address(0), "Group manager not set");

        // Verify group exists and is valid
        AssetGroup memory group = IEmpressaGroupManager(groupManager).getGroup(address(this), groupId);
        require(group.groupId > 0, "Invalid group ID");

        // Delegate to license manager
        return IEmpressaLicenseManager(licenseManager).licenseGroup(
            address(this),
            groupId,
            msg.sender,
            permissions,
            resellerFee
        );
    }
    
    // View functions for compatibility
    function assets(uint256 assetId) external view returns (
        uint256, address, address, address, string memory, bytes32,
        bytes32, uint256, bool, uint256, uint256, uint256, bool, bool,
        FxPool, string memory
    ) {
        require(assetRegistry != address(0), "Asset registry not set");
        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);

        return (
            asset.assetId,
            asset.creator,
            asset.owner,
            asset.partner,
            asset.ipfsHash,
            asset.metadataHash,
            asset.assetHash,
            asset.version,
            asset.isVerified,
            asset.creationTime,
            asset.lastTransferTime,
            asset.price,
            asset.encrypted,
            asset.canBeLicensed,
            asset.fxPool,
            asset.eventTimestamp
        );
    }
    
    function isValidAsset(uint256 assetId) external view returns (bool) {
        require(assetRegistry != address(0), "Asset registry not set");
        try IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId) returns (VerifiedDigitalAsset memory asset) {
            return asset.assetId != 0;
        } catch {
            return false;
        }
    }
    
    function getAssetCount() external view returns (uint256) {
        require(assetRegistry != address(0), "Asset registry not set");
        return IEmpressaAssetRegistry(assetRegistry).assetCounter(address(this));
    }
    
    function transferAsset(uint256 assetId, address newOwner) external {
        require(assetRegistry != address(0), "Asset registry not set");
        require(newOwner != address(0), "Invalid new owner");

        // Get asset and verify caller ownership
        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);
        require(asset.owner == msg.sender, "Only asset owner can transfer");

        // Ensure new owner is part of the organization
        require(isOrganizationMember(newOwner), "New owner must be a member of the organization");

        // Remove asset from all groups before transferring ownership
        if (groupManager != address(0)) {
            IEmpressaGroupManager(groupManager).removeAssetFromAllGroups(address(this), assetId, false);
        }

        // Proceed only if the NFT exists
        address assetNFTAddress = IEmpressaAssetRegistry(assetRegistry).assetNFTAddress();
        if (assetNFTAddress != address(0)) {
            IEmpressaAssetNFT assetNFT = IEmpressaAssetNFT(assetNFTAddress);

            // Check NFT existence and fetch tokenId
            if (assetNFT.assetHasNFT(address(this), assetId)) {
                uint256 tokenId = assetNFT.getTokenIdForAsset(address(this), assetId);
                address tokenOwner = assetNFT.ownerOf(tokenId);

                require(tokenOwner == msg.sender, "Caller is not token owner");
                require(
                    assetNFT.getApproved(tokenId) == address(this) ||
                    assetNFT.isApprovedForAll(tokenOwner, address(this)),
                    "Contract not approved to transfer token"
                );

                // Update ownership and transfer NFT
                IEmpressaAssetRegistry(assetRegistry).transferAssetOwnership(address(this), assetId, newOwner, msg.sender);
                assetNFT.safeTransferFrom(tokenOwner, newOwner, tokenId);
            }
            else {
                revert("Asset does not have an NFT");
            }
        }
        else {
            revert("assetNFTAddress does not set");
        }
    }
    
    /**
     * @dev Transfer an asset to another organization
     * @param assetId Asset ID to transfer
     * @param toOrg Destination organization contract
     * @param newOwner New owner in destination organization
     * @return newAssetId The asset ID in the destination organization
     */
    function transferAssetCrossOrg(
        uint256 assetId, 
        address toOrg, 
        address newOwner
    ) external onlyRole(PRINCIPAL_ROLE) returns (uint256) {
        require(assetRegistry != address(0), "Asset registry not set");
        require(toOrg != address(0) && toOrg != address(this), "Invalid destination org");
        require(newOwner != address(0), "Invalid new owner");

        require(
            IEmpressaContractFactory(factory).isValidOrgContract(toOrg),
            "Destination is not a valid org contract"
        );
        require(
            IEmpressaOrgContract(toOrg).isOrganizationMember(newOwner),
            "New owner must be a member of the destination organization"
        );

        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);
        require(asset.owner == msg.sender, "Only asset owner can transfer");

        // Remove asset from all groups before transferring cross-org
        if (groupManager != address(0)) {
            IEmpressaGroupManager(groupManager).removeAssetFromAllGroups(address(this), assetId, true);
        }

        uint256 newAssetId = IEmpressaAssetRegistry(assetRegistry).transferAssetCrossOrg(
            address(this),
            toOrg,
            assetId,
            msg.sender,
            newOwner
        );

        address assetNFTAddress = IEmpressaAssetRegistry(assetRegistry).assetNFTAddress();
        bool didBurn = false;

        if (assetNFTAddress != address(0)) {
            IEmpressaAssetNFT assetNFT = IEmpressaAssetNFT(assetNFTAddress);
            if (assetNFT.assetHasNFT(address(this), assetId)) {
                uint256 tokenId = assetNFT.getTokenIdForAsset(address(this), assetId);
                address tokenOwner = assetNFT.ownerOf(tokenId);

                require(tokenOwner == msg.sender, "Caller is not token owner");
                require(
                    assetNFT.getApproved(tokenId) == address(this) ||
                    assetNFT.isApprovedForAll(tokenOwner, address(this)),
                    "Contract not approved to transfer token"
                );

                assetNFT.burn(tokenId);
                didBurn = true;
            }
        }

        // Update all the assetIds(reduced by 1 between assetId and length of assets in the current org) in the orgGroups.members after transfer asset cross org
        if (groupManager != address(0)) {
            IEmpressaGroupManager(groupManager).updateAssetIdsInGroups(address(this), assetId);
        }

        emit AssetTransferredCrossOrg(assetId, toOrg, newAssetId, newOwner);
        emit DebugBurn(assetId, newAssetId, didBurn);

        return newAssetId;
    }
    
    // Helper function to get the USDC token address for approvals
    function getUSDCToken() external view returns (address) {
        require(licenseManager != address(0), "License manager not set");
        return IEmpressaLicenseManager(licenseManager).usdcToken();
    }
    
    // Helper function to get required approval amount for licensing
    function getLicensingApprovalAmount(uint256 assetId) external view returns (address spender, uint256 amount) {
        require(licenseManager != address(0), "License manager not set");
        require(assetRegistry != address(0), "Asset registry not set");
        
        VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), assetId);
        require(asset.assetId > 0, "Invalid asset ID");
        
        return (licenseManager, asset.price);
    }
    
    // Helper function to get required approval amount for group licensing
    function getGroupLicensingApprovalAmount(uint256 groupId) external view returns (address spender, uint256 amount) {
        require(licenseManager != address(0), "License manager not set");
        require(groupManager != address(0), "Group manager not set");
        
        AssetGroup memory group = IEmpressaGroupManager(groupManager).getGroup(address(this), groupId);
        require(group.groupId > 0, "Invalid group ID");
        
        return (licenseManager, group.groupPrice);
    }
    
    // Dashboard helper methods
    function getCreatorCount() external view returns (uint256) {
        return creators.length;
    }
    
    function getCreators() external view returns (address[] memory) {
        return creators;
    }
    
    function getIntegrator() external view returns (address) {
        return integrationPartner;
    }
    
    function getAssetsByOwner(address owner) external view returns (uint256[] memory) {
        require(assetRegistry != address(0), "Asset registry not set");
        
        uint256 assetCount = IEmpressaAssetRegistry(assetRegistry).getAssetCount(address(this));
        uint256[] memory ownedAssets = new uint256[](assetCount);
        uint256 ownedCount = 0;
        
        for (uint256 i = 1; i <= assetCount; i++) {
            VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), i);
            if (asset.owner == owner) {
                ownedAssets[ownedCount] = i;
                ownedCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](ownedCount);
        for (uint256 i = 0; i < ownedCount; i++) {
            result[i] = ownedAssets[i];
        }
        
        return result;
    }
    
    function getAssetGroupsByOwner(address owner) external view returns (uint256[] memory) {
        require(groupManager != address(0), "Group manager not set");
        
        uint256 groupCount = IEmpressaGroupManager(groupManager).getGroupCount(address(this));
        uint256[] memory ownedGroups = new uint256[](groupCount);
        uint256 ownedCount = 0;
        
        for (uint256 i = 1; i <= groupCount; i++) {
            AssetGroup memory group = IEmpressaGroupManager(groupManager).getGroup(address(this), i);
            
            // Check if the owner owns all assets in the group
            bool ownsAllAssets = true;
            for (uint256 j = 0; j < group.members.length; j++) {
                VerifiedDigitalAsset memory asset = IEmpressaAssetRegistry(assetRegistry).getAsset(address(this), group.members[j]);
                if (asset.owner != owner) {
                    ownsAllAssets = false;
                    break;
                }
            }
            
            if (ownsAllAssets && group.members.length > 0) {
                ownedGroups[ownedCount] = i;
                ownedCount++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](ownedCount);
        for (uint256 i = 0; i < ownedCount; i++) {
            result[i] = ownedGroups[i];
        }
        
        return result;
    }
    
    /**
     * @dev Check if an address is a member of the organization
     * @param account Address to check
     * @return bool True if the address is a member
     */
    function isOrganizationMember(address account) public view returns (bool) {
        // Check if they have any of the organization roles
        return hasRole(PRINCIPAL_ROLE, account) ||
               hasRole(CREATOR_ROLE, account) ||
               hasRole(VERIFIER_ROLE, account) ||
               isCreator[account]; // Also check the creator mapping for backward compatibility
    }

}