// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";

/**
 * @title EmpressaLicenseManager
 * @dev License manager with revenue distribution and basic reseller support
 */
contract EmpressaLicenseManager is AccessControl, ReentrancyGuard, IEmpressaStructs {
    using SafeERC20 for IERC20;
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORG_CONTRACT_ROLE = keccak256("ORG_CONTRACT_ROLE");
    
    address public immutable factory;
    address public immutable usdcToken;
    
    uint256 private licenseIdCounter;
    
    // Simplified license structure
    struct License {
        uint256 assetId;
        address licensor;
        address licensee;
        uint256 fee;
        uint256 resellerFee;
        uint8 permissions; // Bitmask: 1 = Resell, 2 = View
        address orgContract;
        uint256 expirationTime; // 0 means perpetual
        bool isActive;
    }
    
    // License storage
    mapping(uint256 => License) public licenses;
    mapping(address => mapping(uint256 => mapping(address => bool))) public assetLicensedBy;
    mapping(address => mapping(address => uint256[])) public userLicenses;
    
    // Events
    event LicenseGranted(
        address indexed orgContract,
        uint256 indexed licenseId,
        uint256 indexed assetId,
        address licensee,
        uint256 fee
    );
    
    event GroupLicensed(
        address indexed orgContract,
        uint256 indexed groupId,
        address indexed licensee,
        uint256[] licenseIds,
        uint256 totalFee
    );
    
    event AssetRelicensed(
        uint256 indexed originalLicenseId,
        uint256 indexed newLicenseId,
        address indexed reseller,
        address newLicensee,
        uint256 totalFee
    );
    
    constructor(address _factory, address _usdcToken) {
        require(_factory != address(0), "Invalid factory");
        require(_usdcToken != address(0), "Invalid USDC");
        
        factory = _factory;
        usdcToken = _usdcToken;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    function licenseAsset(
        address orgContract,
        uint256 assetId,
        address licensee,
        LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256) {
        return licenseAssetWithDuration(orgContract, assetId, licensee, permissions, resellerFee, 0);
    }
    
    function licenseAssetWithDuration(
        address orgContract,
        uint256 assetId,
        address licensee,
        LicensePermissions[] memory permissions,
        uint256 resellerFee,
        uint256 duration // in seconds, 0 means perpetual
    ) public nonReentrant returns (uint256) {
        require(hasRole(ORG_CONTRACT_ROLE, msg.sender), "Not authorized");
        require(licensee != address(0), "Invalid licensee");
        require(!assetLicensedBy[orgContract][assetId][licensee], "Already licensed");
        
        // Get asset details from registry
        IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
            IEmpressaOrgContract(orgContract).assetRegistry()
        );
        VerifiedDigitalAsset memory asset = registry.getAsset(orgContract, assetId);
        
        require(asset.assetId > 0, "Asset does not exist");
        require(asset.isVerified, "Asset not verified");
        require(asset.canBeLicensed, "Asset cannot be licensed");
        
        // Check geographic restrictions if any
        if (asset.geographicRestrictions.length > 0) {
            // In production, you would verify the licensee's location
            // For now, we'll add a placeholder that can be extended
            _validateGeographicRestrictions(asset.geographicRestrictions, licensee);
        }
        
        // Transfer payment from licensee to this contract
        IERC20(usdcToken).safeTransferFrom(licensee, address(this), asset.price);
        
        // Distribute revenue if revenue distributor is set
        _distributeRevenue(assetId, licensee, orgContract, asset.price, asset.owner);
        
        // Create license
        uint256 newLicenseId = ++licenseIdCounter;
        
        // Calculate permissions bitmask
        uint8 permByte = 0;
        for (uint i = 0; i < permissions.length; i++) {
            if (permissions[i] == LicensePermissions.View) permByte |= 2;
            if (permissions[i] == LicensePermissions.Resell) permByte |= 1;
        }
        if (permByte == 0) permByte = 2; // Default to View if no permissions specified
        
        licenses[newLicenseId] = License({
            assetId: assetId,
            licensor: asset.creator,
            licensee: licensee,
            fee: asset.price,
            resellerFee: resellerFee > 0 ? resellerFee : asset.price, // Use asset price if no reseller fee specified
            permissions: permByte,
            orgContract: orgContract,
            expirationTime: duration > 0 ? block.timestamp + duration : 0,
            isActive: true
        });
        
        // Update mappings
        assetLicensedBy[orgContract][assetId][licensee] = true;
        userLicenses[orgContract][licensee].push(newLicenseId);

        (uint32 EmpressaFeePct, uint32 integratorFeePct) = IEmpressaRevenueDistributor(IEmpressaOrgContract(orgContract).revenueDistributor()).getCustomFees(orgContract);
        
        emit LicenseGranted(orgContract, newLicenseId, assetId, licensee, asset.price * 10000 / (10000 + EmpressaFeePct + integratorFeePct));
        
        return newLicenseId;
    }
    
    function relicenseAsset(
        uint256 originalLicenseId,
        address newLicensee,
        uint256 markup
    ) external nonReentrant returns (uint256) {
        License memory originalLicense = licenses[originalLicenseId];
        require(originalLicense.licensee == msg.sender, "Not license owner");
        require(originalLicense.permissions & 1 == 1, "No resell permission");
        require(newLicensee != address(0), "Invalid licensee");
        
        address orgContract = originalLicense.orgContract;
        uint256 assetId = originalLicense.assetId;
        
        require(!assetLicensedBy[orgContract][assetId][newLicensee], "Already licensed");
        
        uint256 totalFee = originalLicense.resellerFee + markup;
        
        // Transfer payment from new licensee
        IERC20(usdcToken).safeTransferFrom(newLicensee, address(this), totalFee);
        
        // Pay reseller their markup
        if (markup > 0) {
            IERC20(usdcToken).safeTransfer(msg.sender, markup);
        }
        
        // Distribute original fee through revenue distributor
        if (originalLicense.resellerFee > 0) {
            _distributeRevenue(assetId, newLicensee, orgContract, originalLicense.resellerFee, originalLicense.licensor);
        }
        
        // Create new license
        uint256 newLicenseId = ++licenseIdCounter;
        
        licenses[newLicenseId] = License({
            assetId: assetId,
            licensor: msg.sender, // Reseller becomes licensor
            licensee: newLicensee,
            fee: totalFee,
            resellerFee: originalLicense.resellerFee, // Keep original for chain
            permissions: originalLicense.permissions, // Inherit permissions
            orgContract: orgContract,
            expirationTime: originalLicense.expirationTime, // Inherit expiration
            isActive: true
        });
        
        // Update mappings
        assetLicensedBy[orgContract][assetId][newLicensee] = true;
        userLicenses[orgContract][newLicensee].push(newLicenseId);
        
        emit AssetRelicensed(originalLicenseId, newLicenseId, msg.sender, newLicensee, totalFee);
        
        return newLicenseId;
    }
    
    function _distributeRevenue(
        uint256 assetId,
        address licensee,
        address orgContract,
        uint256 amount,
        address assetOwner
    ) private {
        address revenueDistributor = IEmpressaOrgContract(orgContract).revenueDistributor();
        
        if (revenueDistributor != address(0)) {
            // Get integration partner
            address integrationPartner = IEmpressaOrgContract(orgContract).integrationPartner();
            
            // (uint32 EmpressaFeePct, uint32 integratorFeePct) = IEmpressaRevenueDistributor(revenueDistributor).getCustomFees(orgContract);
            // Approve revenue distributor to spend the amount
            IERC20(usdcToken).safeApprove(revenueDistributor, amount);
            
            // Call revenue distributor
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
            // If no revenue distributor, send directly to asset owner
            IERC20(usdcToken).safeTransfer(assetOwner, amount);
        }
    }
    
    function isAssetLicensedBy(
        address orgContract,
        uint256 assetId,
        address user
    ) external view returns (bool) {
        if (!assetLicensedBy[orgContract][assetId][user]) return false;
        
        // Check if any of the user's licenses for this asset are valid
        uint256[] memory userLicenseIds = userLicenses[orgContract][user];
        for (uint i = 0; i < userLicenseIds.length; i++) {
            License memory license = licenses[userLicenseIds[i]];
            if (license.assetId == assetId && isLicenseValid(userLicenseIds[i])) {
                return true;
            }
        }
        return false;
    }
    
    function getUserLicenses(
        address orgContract,
        address user
    ) external view returns (uint256[] memory) {
        return userLicenses[orgContract][user];
    }

    function licenseCounter() external view returns (uint256) {
        return licenseIdCounter;
    }
    
    function getLicenseDetails(uint256 licenseId) external view returns (
        uint256 assetId,
        address licensor,
        address licensee,
        uint256 fee,
        address orgContract
    ) {
        License memory license = licenses[licenseId];
        return (
            license.assetId,
            license.licensor,
            license.licensee,
            license.fee,
            license.orgContract
        );
    }
    
    function hasPermission(uint256 licenseId, LicensePermissions permission) external view returns (bool) {
        uint8 perms = licenses[licenseId].permissions;
        if (permission == LicensePermissions.View) return (perms & 2) == 2;
        if (permission == LicensePermissions.Resell) return (perms & 1) == 1;
        return false;
    }
    
    // Admin function to withdraw stuck funds
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(ADMIN_ROLE) {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
    
    // Group licensing functionality
    function licenseGroup(
        address orgContract,
        uint256 groupId,
        address licensee,
        LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external onlyRole(ORG_CONTRACT_ROLE) nonReentrant returns (uint256[] memory) {
        require(licensee != address(0), "Invalid licensee");
        
        // Get group details
        IEmpressaGroupManager groupManager = IEmpressaGroupManager(
            IEmpressaOrgContract(orgContract).groupManager()
        );
        AssetGroup memory group = groupManager.getGroup(orgContract, groupId);
        
        require(group.groupId > 0, "Group does not exist");
        require(group.members.length > 0, "Group has no assets");
        
        // Get asset registry
        IEmpressaAssetRegistry registry = IEmpressaAssetRegistry(
            IEmpressaOrgContract(orgContract).assetRegistry()
        );
        
        // Transfer payment for group price
        IERC20(usdcToken).safeTransferFrom(licensee, address(this), group.groupPrice);
        
        // Calculate revenue distribution for the group
        _distributeRevenue(groupId, licensee, orgContract, group.groupPrice, group.owner);
        
        // Create licenses for each asset in the group
        uint256[] memory licenseIds = new uint256[](group.members.length);
        uint256 individualAssetFee = group.groupPrice / group.members.length; // Simple equal split
        
        for (uint i = 0; i < group.members.length; i++) {
            uint256 assetId = group.members[i];
            
            // Check if user already has license for this asset
            require(!assetLicensedBy[orgContract][assetId][licensee], "Already licensed asset in group");
            
            // Verify asset exists and is verified
            VerifiedDigitalAsset memory asset = registry.getAsset(orgContract, assetId);
            require(asset.assetId > 0, "Asset does not exist");
            require(asset.isVerified, "Asset not verified");
            require(asset.canBeLicensed, "Asset cannot be licensed");
            
            // Create license
            uint256 newLicenseId = ++licenseIdCounter;
            
            // Calculate permissions bitmask
            uint8 permByte = 0;
            for (uint j = 0; j < permissions.length; j++) {
                if (permissions[j] == LicensePermissions.View) permByte |= 2;
                if (permissions[j] == LicensePermissions.Resell) permByte |= 1;
            }
            if (permByte == 0) permByte = 2; // Default to View if no permissions specified
            
            licenses[newLicenseId] = License({
                assetId: assetId,
                licensor: asset.creator,
                licensee: licensee,
                fee: individualAssetFee,
                resellerFee: resellerFee > 0 ? resellerFee : individualAssetFee,
                permissions: permByte,
                orgContract: orgContract,
                expirationTime: 0, // Group licenses are perpetual by default
                isActive: true
            });
            
            // Update mappings
            assetLicensedBy[orgContract][assetId][licensee] = true;
            userLicenses[orgContract][licensee].push(newLicenseId);
            licenseIds[i] = newLicenseId;
            
            emit LicenseGranted(orgContract, newLicenseId, assetId, licensee, individualAssetFee);
        }
        
        emit GroupLicensed(orgContract, groupId, licensee, licenseIds, group.groupPrice);
        
        return licenseIds;
    }
    
    // License renewal function
    function renewLicense(uint256 licenseId, uint256 additionalDuration) external nonReentrant {
        License storage license = licenses[licenseId];
        require(license.licensee == msg.sender, "Not license owner");
        require(license.isActive, "License is not active");
        require(license.expirationTime > 0, "Cannot renew perpetual license");
        
        // Calculate renewal fee (same as original fee)
        uint256 renewalFee = license.fee;
        
        // Transfer payment
        IERC20(usdcToken).safeTransferFrom(msg.sender, address(this), renewalFee);
        
        // Distribute revenue
        _distributeRevenue(license.assetId, msg.sender, license.orgContract, renewalFee, license.licensor);
        
        // Extend expiration
        if (license.expirationTime < block.timestamp) {
            // If already expired, start from now
            license.expirationTime = block.timestamp + additionalDuration;
        } else {
            // If not expired, add to existing time
            license.expirationTime += additionalDuration;
        }
        
        emit LicenseRenewed(licenseId, license.expirationTime, renewalFee);
    }
    
    // Check if license is valid (active and not expired)
    function isLicenseValid(uint256 licenseId) public view returns (bool) {
        License memory license = licenses[licenseId];
        if (!license.isActive) return false;
        if (license.expirationTime == 0) return true; // Perpetual
        return block.timestamp < license.expirationTime;
    }
    
    // Revoke license (admin only)
    function revokeLicense(uint256 licenseId) external onlyRole(ADMIN_ROLE) {
        licenses[licenseId].isActive = false;
        emit LicenseRevoked(licenseId);
    }
    
    // Events for license lifecycle
    event LicenseRenewed(uint256 indexed licenseId, uint256 newExpiration, uint256 fee);
    event LicenseRevoked(uint256 indexed licenseId);
    
    // Mapping to store user locations (in production, this would come from KYC/oracle)
    mapping(address => CountryCode) public userLocations;
    // Track if user has a location set
    mapping(address => bool) public hasUserLocation;
    
    // Admin function to set user location (in production, this would be from oracle/KYC)
    function setUserLocation(address user, CountryCode location) external onlyRole(ADMIN_ROLE) {
        userLocations[user] = location;
        hasUserLocation[user] = true;
        emit UserLocationSet(user, location);
    }
    
    // Event for location updates
    event UserLocationSet(address indexed user, CountryCode location);
    
    // Geographic restriction validation
    function _validateGeographicRestrictions(
        CountryCode[] memory restrictions,
        address licensee
    ) private view {
        // If no restrictions, allow all
        if (restrictions.length == 0) {
            return;
        }
        
        // For testing: if user has no location set (default enum value 0 = US), allow
        // In production, this would be handled by KYC/oracle
        if (!hasUserLocation[licensee]) {
            return;
        }
        
        // Get user's location
        CountryCode userLocation = userLocations[licensee];
        
        // Check if user's location is in the allowed list
        bool isAllowed = false;
        for (uint i = 0; i < restrictions.length; i++) {
            if (restrictions[i] == userLocation) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            revert("License not available in your geographic location");
        }
    }
}