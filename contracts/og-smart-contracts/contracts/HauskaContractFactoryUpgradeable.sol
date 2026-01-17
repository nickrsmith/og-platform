// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IOrgDeployer {
    function deploy(address factory, address principal, address integrationPartner) external returns (address);
}

interface IOrg {
    function principal() external view returns (address);
    function setLicenseManager(address _licenseManager) external;
    function setAssetRegistry(address _assetRegistry) external;
    function setGroupManager(address _groupManager) external;
    function setRevenueDistributor(address _revenueDistributor) external;
}

interface IOrgStats {
    function getCreatorCount() external view returns (uint256);
}

// Interface for AccessControl functions
interface IAccessControl {
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

// Internal library for role wiring
library RoleWiringLib {
    bytes32 internal constant ORG_CONTRACT_ROLE        = keccak256("ORG_CONTRACT_ROLE");
    bytes32 internal constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");
    
    function wire(
        address licenseManager,
        address assetRegistry,
        address groupManager,
        address revenueDistributor,
        address org
    ) internal {
        // Grant ORG_CONTRACT_ROLE to the org contract on all modules
        IAccessControl(licenseManager).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(assetRegistry).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(groupManager).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(revenueDistributor).grantRole(AUTHORIZED_CONTRACT_ROLE, org);
        
        // Set the modules on the org contract
        IOrg(org).setLicenseManager(licenseManager);
        IOrg(org).setAssetRegistry(assetRegistry);
        IOrg(org).setGroupManager(groupManager);
        IOrg(org).setRevenueDistributor(revenueDistributor);
    }
    
    function unwind(
        address licenseManager,
        address assetRegistry,
        address groupManager,
        address revenueDistributor,
        address org
    ) internal {
        // Revoke roles from the org contract on all modules
        IAccessControl(licenseManager).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(assetRegistry).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(groupManager).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(revenueDistributor).revokeRole(AUTHORIZED_CONTRACT_ROLE, org);
    }
}

contract HauskaContractFactoryUpgradeable is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable 
{
    /* errors */
    error InvalidAddress();
    error ModulesAlreadySet();
    error ModulesNotSet();
    error PrincipalHasContract();
    error InvalidContract();
    error HauskaFeeTooHigh();
    error IntegratorFeeTooHigh();
    
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant ORG_CONTRACT_ROLE = keccak256("ORG_CONTRACT_ROLE");
    bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");

    // Core configuration
    address public orgDeployer;
    address public usdcToken;

    // Module addresses
    address public licenseManager;
    address public assetRegistry;
    address public groupManager;
    address public revenueDistributor;
    address public assetNFT;
    
    // Fee configuration
    uint32 public hauskaFeePct;
    uint32 public integratorFeePct;
    
    // Org tracking
    mapping(address => address) public principalToOrgContract;
    mapping(address => bool) public isValidOrgContract;
    
    // Additional tracking for getAllContracts functionality
    address[] public allContracts;
    mapping(address => uint256) public contractIndex;
    
    // Events
    event OrgContractCreated(address indexed principal, address indexed orgContract, address indexed integrationPartner);
    event OrgContractRemoved(address indexed org);
    event ModulesSet(address licenseManager, address assetRegistry, address groupManager, address revenueDistributor, address assetNFT);
    event FeesUpdated(uint32 hauskaFee, uint32 integratorFee);
    event OrgDeployerChanged(address indexed oldDeployer, address indexed newDeployer);
    event AssetNFTChanged(address indexed oldAssetNFT, address indexed newAssetNFT);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // Implementation contracts for proxies should not disable initializers
        // The proxy will handle the initialization state
    }

    function initialize(
        address _admin,
        address _orgDeployer,
        address _usdcToken
    ) public {
        require(_admin != address(0), "Invalid admin address");
        require(_orgDeployer != address(0), "Invalid org deployer address");
        require(_usdcToken != address(0), "Invalid USDC token address");

        // Initialize the inherited contracts manually since we're not using Initializable
        // These contracts will be initialized through the proxy

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(UPGRADER_ROLE, _admin);

        orgDeployer = _orgDeployer;
        usdcToken = _usdcToken;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // Factory functions
    function createOrgContract(address principal, address integrationPartner) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused returns (address) {
        if (
            licenseManager == address(0) ||
            assetRegistry  == address(0) ||
            groupManager   == address(0) ||
            revenueDistributor == address(0)
        ) revert ModulesNotSet();

        require(principal != address(0), "Invalid principal address");
        require(orgDeployer != address(0), "Org deployer not set");
        require(principalToOrgContract[principal] == address(0), "Principal already has contract");
        
        // Deploy new org contract using OrgDeployer
        address newOrgContract = IOrgDeployer(orgDeployer).deploy(address(this), principal, integrationPartner);
        
        // Track the org contract
        principalToOrgContract[principal] = newOrgContract;
        isValidOrgContract[newOrgContract] = true;
        contractIndex[newOrgContract] = allContracts.length;
        allContracts.push(newOrgContract);
        
        // Wire the roles and set the modules on the new org contract
        RoleWiringLib.wire(licenseManager, assetRegistry, groupManager, revenueDistributor, newOrgContract);
        
        emit OrgContractCreated(principal, newOrgContract, integrationPartner);
        
        return newOrgContract;
    }

    function removeContract(address org) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isValidOrgContract[org], "Invalid contract");
        
        address principal = IOrg(org).principal();
        
        // Unwind the roles before removing tracking
        RoleWiringLib.unwind(licenseManager, assetRegistry, groupManager, revenueDistributor, org);
        
        // Remove tracking
        principalToOrgContract[principal] = address(0);
        isValidOrgContract[org] = false;
        
        // Remove from allContracts array
        uint256 idx = contractIndex[org];
        uint256 last = allContracts.length - 1;
        if (idx != last) {
            address lastAddr = allContracts[last];
            allContracts[idx] = lastAddr;
            contractIndex[lastAddr] = idx;
        }
        allContracts.pop();
        delete contractIndex[org];
        
        emit OrgContractRemoved(org);
    }

    function setModules(
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _assetNFT
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_licenseManager != address(0) && _assetRegistry != address(0) &&
                _groupManager != address(0) && _revenueDistributor != address(0), "Invalid module address");

        licenseManager = _licenseManager;
        assetRegistry = _assetRegistry;
        groupManager = _groupManager;
        revenueDistributor = _revenueDistributor;
        assetNFT = _assetNFT;

        emit ModulesSet(_licenseManager, _assetRegistry, _groupManager, _revenueDistributor, _assetNFT);
    }

    function setAssetNFT(address _assetNFT) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_assetNFT != address(0), "Invalid asset NFT address");
        address oldAssetNFT = assetNFT;
        assetNFT = _assetNFT;
        emit AssetNFTChanged(oldAssetNFT, _assetNFT);
    }

    function updateFees(uint32 _hauskaFee, uint32 _integratorFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_hauskaFee <= 5000, "Hauska fee too high"); // Max 50%
        require(_integratorFee <= 200, "Integrator fee too high"); // Max 2%

        hauskaFeePct = _hauskaFee;
        integratorFeePct = _integratorFee;

        emit FeesUpdated(_hauskaFee, _integratorFee);
    }

    // View functions
    function getModules() external view returns (address, address, address, address, address) {
        return (licenseManager, assetRegistry, groupManager, revenueDistributor, assetNFT);
    }

    function getPlatformFees() external view returns (uint32, uint32) {
        return (integratorFeePct, hauskaFeePct);
    }

    function getOrgDeployer() external view returns (address) {
        return orgDeployer;
    }

    function getUsdcToken() external view returns (address) {
        return usdcToken;
    }

    // Additional view functions for frontend compatibility
    function getAllContracts() external view returns (address[] memory) {
        return allContracts;
    }

    function getContract(address principal) external view returns (address) {
        return principalToOrgContract[principal];
    }

    function checkValidOrgContract(address contractAddress) external view returns (bool) {
        return isValidOrgContract[contractAddress];
    }

    function getNumberOfOrganizations() external view returns (uint256) {
        return allContracts.length;
    }

    function getNumberOfCreators(address orgContract) external view returns (uint256) {
        require(isValidOrgContract[orgContract], "Invalid contract");
        return IOrgStats(orgContract).getCreatorCount();
    }

    function getAssetNFT() external view returns (address) {
        return assetNFT;
    }

    // Role checking for compatibility
    function hasRole(bytes32 role, address account) public view override returns (bool) {
        return super.hasRole(role, account);
    }

    // Admin functions
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function changeOrgDeployer(address newOrgDeployer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOrgDeployer != address(0), "Invalid org deployer address");
        address oldDeployer = orgDeployer;
        orgDeployer = newOrgDeployer;
        emit OrgDeployerChanged(oldDeployer, newOrgDeployer);
    }
}
