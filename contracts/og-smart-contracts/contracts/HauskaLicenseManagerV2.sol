// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IEmpressaContracts.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./EmpressaLicenseNFT.sol";

/**
 * @title EmpressaLicenseManagerV2
 * @dev Enhanced license management using ERC-721 NFTs
 */
contract EmpressaLicenseManagerV2 is AccessControl, ReentrancyGuard, IEmpressaLicenseManager {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ORG_CONTRACT_ROLE = keccak256("ORG_CONTRACT_ROLE");
    
    address public immutable factoryContract;
    address public immutable usdcToken;
    EmpressaLicenseNFT public immutable licenseNFT;
    
    // Events
    event LicenseGranted(
        address indexed orgContract,
        uint256 indexed tokenId,
        uint256 indexed assetId,
        address licensee,
        uint256 fee
    );
    
    event GroupLicensed(
        address indexed orgContract,
        uint256 indexed groupId,
        address indexed licensee,
        uint256[] tokenIds,
        uint256 totalFee
    );
    
    event LicenseRenewed(uint256 indexed tokenId, uint256 newExpiration, uint256 fee);
    event LicenseRevoked(uint256 indexed tokenId);
    event RelicenseGranted(
        uint256 indexed originalTokenId,
        uint256 indexed newTokenId,
        address indexed newLicensee,
        uint256 fee
    );
    
    constructor(address _factory, address _usdcToken) {
        require(_factory != address(0), "Invalid factory");
        require(_usdcToken != address(0), "Invalid USDC token");
        
        factoryContract = _factory;
        usdcToken = _usdcToken;
        
        // Deploy the NFT contract
        licenseNFT = new EmpressaLicenseNFT();
        
        // Grant this contract minter role on the NFT
        licenseNFT.grantRole(licenseNFT.MINTER_ROLE(), address(this));
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORG_CONTRACT_ROLE, _factory);
    }
    
    /**
     * @dev License an asset without duration (perpetual)
     */
    function licenseAsset(
        address orgContract,
        uint256 assetId,
        address licensee,
        IEmpressaStructs.LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256) {
        return licenseAssetWithDuration(orgContract, assetId, licensee, permissions, resellerFee, 0);
    }
    
    /**
     * @dev License an asset with specific duration
     */
    function licenseAssetWithDuration(
        address orgContract,
        uint256 assetId,
        address licensee,
        IEmpressaStructs.LicensePermissions[] memory permissions,
        uint256 resellerFee,
        uint256 duration
    ) public nonReentrant returns (uint256) {
        require(hasRole(ORG_CONTRACT_ROLE, msg.sender), "Not authorized");
        require(licensee != address(0), "Invalid licensee");
        require(!licenseNFT.hasLicense(orgContract, assetId, licensee), "Already licensed");
        
        // Get asset details from registry
        IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
            IEmpressaOrgContract(orgContract).assetRegistry()
        );
        IEmpressaStructs.VerifiedDigitalAsset memory asset = registry.getAsset(orgContract, assetId);
        
        require(asset.assetId > 0, "Asset does not exist");
        require(asset.isVerified, "Asset not verified");
        require(asset.canBeLicensed, "Asset cannot be licensed");
        
        // Transfer payment from licensee to this contract
        IERC20(usdcToken).safeTransferFrom(licensee, address(this), asset.price);
        
        // Distribute revenue
        _distributeRevenue(assetId, licensee, orgContract, asset.price, asset.creator);
        
        // Calculate permissions bitmask
        uint8 permByte = 0;
        for (uint i = 0; i < permissions.length; i++) {
            if (permissions[i] == IEmpressaStructs.LicensePermissions.View) permByte |= 2;
            if (permissions[i] == IEmpressaStructs.LicensePermissions.Resell) permByte |= 1;
        }
        if (permByte == 0) permByte = 2; // Default to View
        
        // Mint NFT license
        uint256 tokenId = licenseNFT.mintLicense(
            licensee,
            orgContract,
            assetId,
            asset.creator,
            permByte,
            resellerFee > 0 ? resellerFee : asset.price,
            duration
        );
        
        emit LicenseGranted(orgContract, tokenId, assetId, licensee, asset.price);
        
        return tokenId;
    }
    
    /**
     * @dev Allow license holders to resell their licenses (interface implementation)
     */
    function relicenseAsset(
        address /* orgContract*/,
        uint256 /*assetId*/,
        address licensee,
        uint256 existingLicenseId
    ) external returns (uint256) {
        // For backward compatibility, we'll delegate to the enhanced version
        IEmpressaStructs.LicensePermissions[] memory permissions = new IEmpressaStructs.LicensePermissions[](1);
        permissions[0] = IEmpressaStructs.LicensePermissions.View;
        return relicenseAssetEnhanced(existingLicenseId, licensee, permissions, 0);
    }
    
    /**
     * @dev Enhanced relicense function with more control
     */
    function relicenseAssetEnhanced(
        uint256 originalTokenId,
        address newLicensee,
        IEmpressaStructs.LicensePermissions[] memory newPermissions,
        uint256 newResellerFee
    ) public nonReentrant returns (uint256) {
        require(licenseNFT.ownerOf(originalTokenId) == msg.sender, "Not license owner");
        require(newLicensee != address(0), "Invalid licensee");
        require(licenseNFT.isLicenseValid(originalTokenId), "License not valid");
        
        EmpressaLicenseNFT.LicenseData memory originalLicense = licenseNFT.getLicenseDetails(originalTokenId);
        
        // Check resell permission
        require(originalLicense.permissions & 1 == 1, "No resell permission");
        require(!licenseNFT.hasLicense(originalLicense.orgContract, originalLicense.assetId, newLicensee), "Already licensed");
        
        // Transfer payment
        IERC20(usdcToken).safeTransferFrom(newLicensee, address(this), originalLicense.resellerFee);
        
        // Calculate reseller share (20% of the reseller fee)
        uint256 resellerShare = (originalLicense.resellerFee * 20) / 100;
        uint256 creatorShare = originalLicense.resellerFee - resellerShare;
        
        // Pay reseller
        IERC20(usdcToken).safeTransfer(msg.sender, resellerShare);
        
        // Distribute remaining to original creator through revenue distributor
        _distributeRevenue(originalLicense.assetId, newLicensee, originalLicense.orgContract, creatorShare, originalLicense.originalCreator);
        
        // Calculate new permissions
        uint8 permByte = 0;
        for (uint i = 0; i < newPermissions.length; i++) {
            if (newPermissions[i] == IEmpressaStructs.LicensePermissions.View) permByte |= 2;
            if (newPermissions[i] == IEmpressaStructs.LicensePermissions.Resell) permByte |= 1;
        }
        if (permByte == 0) permByte = 2;
        
        // Mint new license NFT
        uint256 newTokenId = licenseNFT.mintLicense(
            newLicensee,
            originalLicense.orgContract,
            originalLicense.assetId,
            originalLicense.originalCreator,
            permByte,
            newResellerFee > 0 ? newResellerFee : originalLicense.resellerFee,
            0 // Perpetual for relicensed assets
        );
        
        emit RelicenseGranted(originalTokenId, newTokenId, newLicensee, originalLicense.resellerFee);
        
        return newTokenId;
    }
    
    /**
     * @dev License a group of assets
     */
    function licenseGroup(
        address orgContract,
        uint256 groupId,
        address licensee,
        IEmpressaStructs.LicensePermissions[] memory permissions,
        uint256 /*resellerFee*/
    ) external nonReentrant returns (uint256[] memory) {
        require(hasRole(ORG_CONTRACT_ROLE, msg.sender), "Not authorized");
        require(licensee != address(0), "Invalid licensee");
        
        IEmpressaGroupManager groupManager = IEmpressaGroupManager(
            IEmpressaOrgContract(orgContract).groupManager()
        );
        IEmpressaStructs.AssetGroup memory group = groupManager.getGroup(orgContract, groupId);
        
        require(group.groupId > 0, "Group does not exist");
        require(group.members.length > 0, "Empty group");
        
        // Transfer group price
        IERC20(usdcToken).safeTransferFrom(licensee, address(this), group.groupPrice);
        
        // Calculate individual fee
        uint256 individualAssetFee = group.groupPrice / group.members.length;
        
        // License each asset and collect token IDs
        uint256[] memory tokenIds = new uint256[](group.members.length);
        
        for (uint256 i = 0; i < group.members.length; i++) {
            // Skip if already licensed
            if (licenseNFT.hasLicense(orgContract, group.members[i], licensee)) {
                continue;
            }
            
            // Get asset details
            IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
                IEmpressaOrgContract(orgContract).assetRegistry()
            );
            IEmpressaStructs.VerifiedDigitalAsset memory asset = registry.getAsset(orgContract, group.members[i]);
            
            require(asset.isVerified, "Asset not verified");
            require(asset.canBeLicensed, "Asset cannot be licensed");
            
            // Distribute revenue for this asset
            _distributeRevenue(group.members[i], licensee, orgContract, individualAssetFee, asset.creator);
            
            // Calculate permissions
            uint8 permByte = 0;
            for (uint j = 0; j < permissions.length; j++) {
                if (permissions[j] == IEmpressaStructs.LicensePermissions.View) permByte |= 2;
                if (permissions[j] == IEmpressaStructs.LicensePermissions.Resell) permByte |= 1;
            }
            if (permByte == 0) permByte = 2;
            
            // Mint license NFT
            tokenIds[i] = licenseNFT.mintLicense(
                licensee,
                orgContract,
                group.members[i],
                asset.creator,
                permByte,
                individualAssetFee,
                0 // Perpetual
            );
        }
        
        emit GroupLicensed(orgContract, groupId, licensee, tokenIds, group.groupPrice);
        
        return tokenIds;
    }
    
    /**
     * @dev Renew an expired or expiring license
     */
    function renewLicense(uint256 tokenId, uint256 additionalDuration) external nonReentrant {
        require(licenseNFT.ownerOf(tokenId) == msg.sender, "Not license owner");
        require(additionalDuration > 0, "Invalid duration");
        
        EmpressaLicenseNFT.LicenseData memory license = licenseNFT.getLicenseDetails(tokenId);
        require(license.expirationTime > 0, "License is perpetual");
        
        // Get current asset price for renewal
        IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
            IEmpressaOrgContract(license.orgContract).assetRegistry()
        );
        IEmpressaStructs.VerifiedDigitalAsset memory asset = registry.getAsset(license.orgContract, license.assetId);
        
        // Transfer renewal fee
        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), asset.price);
        
        // Distribute revenue
        _distributeRevenue(license.assetId, msg.sender, license.orgContract, asset.price, asset.creator);
        
        // Since we can't update the NFT data directly, we'll need to track renewals separately
        // In a production system, you might want to add a renewal tracking mechanism
        // For now, emit an event
        emit LicenseRenewed(tokenId, license.expirationTime + additionalDuration, asset.price);
    }
    
    /**
     * @dev Revoke a license (admin only)
     */
    function revokeLicense(uint256 tokenId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        licenseNFT.revokeLicense(tokenId);
        emit LicenseRevoked(tokenId);
    }
    
    /**
     * @dev Check if an asset is licensed by a user
     */
    function isAssetLicensedBy(
        address orgContract,
        uint256 assetId,
        address user
    ) external view returns (bool) {
        return licenseNFT.hasValidLicense(orgContract, assetId, user);
    }
    
    /**
     * @dev Get user's licenses for an organization
     */
    function getUserLicenses(
        address orgContract,
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory allLicenses = licenseNFT.getUserLicenses(user);
        
        // Filter licenses for specific org
        uint256 count = 0;
        for (uint256 i = 0; i < allLicenses.length; i++) {
            EmpressaLicenseNFT.LicenseData memory license = licenseNFT.getLicenseDetails(allLicenses[i]);
            if (license.orgContract == orgContract) {
                count++;
            }
        }
        
        uint256[] memory orgLicenses = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allLicenses.length; i++) {
            EmpressaLicenseNFT.LicenseData memory license = licenseNFT.getLicenseDetails(allLicenses[i]);
            if (license.orgContract == orgContract) {
                orgLicenses[index] = allLicenses[i];
                index++;
            }
        }
        
        return orgLicenses;
    }
    
    /**
     * @dev Check if a license is valid
     */
    function isLicenseValid(uint256 tokenId) external view returns (bool) {
        return licenseNFT.isLicenseValid(tokenId);
    }
    
    /**
     * @dev Get license details (for compatibility)
     */
    function getLicenseDetails(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 assetId,
            address licensor,
            address licensee,
            uint256 fee,
            address orgContract
        ) 
    {
        EmpressaLicenseNFT.LicenseData memory license = licenseNFT.getLicenseDetails(tokenId);
        address owner = licenseNFT.ownerOf(tokenId);
        
        return (
            license.assetId,
            license.originalCreator,
            owner,
            license.resellerFee,
            license.orgContract
        );
    }
    
    /**
     * @dev Distribute revenue through the revenue distributor
     */
    function _distributeRevenue(
        uint256 assetId,
        address licensee,
        address orgContract,
        uint256 amount,
        address assetOwner
    ) private {
        address revenueDistributor = IEmpressaOrgContract(orgContract).revenueDistributor();
        
        if (revenueDistributor != address(0)) {
            address integrationPartner = IEmpressaOrgContract(orgContract).integrationPartner();
            
            IERC20(usdcToken).safeApprove(revenueDistributor, amount);
            
            IEmpressaRevenueDistributor(revenueDistributor).distributeRevenue(
                assetId,
                licensee,
                address(this),
                amount,
                assetOwner,
                integrationPartner,
                orgContract
            );
        } else {
            IERC20(usdcToken).safeTransfer(assetOwner, amount);
        }
    }
    
    /**
     * @dev Grant org contract role (admin only)
     */
    function grantOrgContractRole(address orgContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    /**
     * @dev Revoke org contract role (admin only)
     */
    function revokeOrgContractRole(address orgContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ORG_CONTRACT_ROLE, orgContract);
    }
    
    /**
     * @dev Get the NFT contract address
     */
    function getLicenseNFT() external view returns (address) {
        return address(licenseNFT);
    }
}