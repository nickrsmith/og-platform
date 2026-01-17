// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/* ========= Minimal interfaces ========= */

interface IOrg {
    function principal() external view returns (address);
    function setLicenseManager(address) external;
    function setAssetRegistry(address) external;
    function setGroupManager(address) external;
    function setRevenueDistributor(address) external;
}

interface IOrgDeployer {
    function deploy(address factory, address principal, address integrationPartner) external returns (address);
}

interface IAccessControl {
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

/* expose only what we call for stats */
interface IOrgStats {
    function getCreatorCount() external view returns (uint256);
}

/* ========= Linked library (kept external; code not in factory runtime) ========= */

library RoleWiringLibLite {
    bytes32 internal constant ORG_CONTRACT_ROLE        = keccak256("ORG_CONTRACT_ROLE");
    bytes32 internal constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");

    function wire(
        address licenseManager,
        address assetRegistry,
        address groupManager,
        address revenueDistributor,
        address org
    ) external {
        IAccessControl(licenseManager).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(assetRegistry).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(groupManager).grantRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(revenueDistributor).grantRole(AUTHORIZED_CONTRACT_ROLE, org);

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
    ) external {
        IAccessControl(licenseManager).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(assetRegistry).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(groupManager).revokeRole(ORG_CONTRACT_ROLE, org);
        IAccessControl(revenueDistributor).revokeRole(AUTHORIZED_CONTRACT_ROLE, org);
    }
}

/* ========= Factory (full helpers restored) ========= */

contract HauskaContractFactoryLite {
    /* errors */
    error InvalidAddress();
    error ModulesAlreadySet();
    error ModulesNotSet();
    error PrincipalHasContract();
    error InvalidContract();
    error HauskaFeeTooHigh();
    error IntegratorFeeTooHigh();

    /* admin (tiny) */
    address public admin;

    /* fees (bps: 100 = 1%) */
    uint32 public hauskaFeePct = 500;     // 5%
    uint32 public integratorFeePct = 100; // 1%

    /* pause */
    bool public paused;

    /* modules */
    address public licenseManager;
    address public assetRegistry;
    address public groupManager;
    address public revenueDistributor;
    address public assetNFT;

    /* external deployer */
    address public orgDeployer;

    /* tracking */
    mapping(address => address) public principalToContract;
    mapping(address => bool)    public validContracts;
    address[] public allContracts;
    mapping(address => uint256) public contractIndex;

    /* events */
    event ContractCreated(address indexed principal, address indexed org, address indexed integrationPartner);
    event ContractRemoved(address indexed org);
    event PlatformFeesUpdated(uint32 hauskaFee, uint32 integratorFee);
    event ModulesSet(address licenseManager, address assetRegistry, address groupManager, address revenueDistributor, address assetNFT);
    event OrgDeployerSet(address deployer);
    event Paused(bool state);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    constructor(address _admin) {
        if (_admin == address(0)) revert InvalidAddress();
        admin = _admin;
        emit AdminChanged(address(0), _admin);
    }

    /* modifiers */
    modifier onlyAdmin() { require(msg.sender == admin, "NA"); _; }
    modifier whenNotPaused() { require(!paused, "P"); _; }

    function setAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert InvalidAddress();
        emit AdminChanged(admin, _newAdmin);
        admin = _newAdmin;
    }

    function setModules(
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _assetNFT
    ) external onlyAdmin {
        if (
            licenseManager != address(0) ||
            assetRegistry  != address(0) ||
            groupManager   != address(0) ||
            revenueDistributor != address(0)
        ) revert ModulesAlreadySet();

        if (
            _licenseManager == address(0) ||
            _assetRegistry  == address(0) ||
            _groupManager   == address(0) ||
            _revenueDistributor == address(0)
        ) revert InvalidAddress();

        licenseManager     = _licenseManager;
        assetRegistry      = _assetRegistry;
        groupManager       = _groupManager;
        revenueDistributor = _revenueDistributor;
        assetNFT           = _assetNFT;

        emit ModulesSet(_licenseManager, _assetRegistry, _groupManager, _revenueDistributor, _assetNFT);
    }

    function setOrgDeployer(address _deployer) external onlyAdmin {
        if (_deployer == address(0)) revert InvalidAddress();
        orgDeployer = _deployer;
        emit OrgDeployerSet(_deployer);
    }

    function setAssetNFT(address _assetNFT) external onlyAdmin {
        if (_assetNFT == address(0)) revert InvalidAddress();
        assetNFT = _assetNFT;
    }

    function setPaused(bool p) external onlyAdmin {
        paused = p;
        emit Paused(p);
    }

    function updatePlatformFees(uint32 _hauskaFeePct, uint32 _integratorFeePct) external onlyAdmin {
        if (_hauskaFeePct > 5000) revert HauskaFeeTooHigh();    // 50%
        if (_integratorFeePct > 200) revert IntegratorFeeTooHigh(); // 2%
        hauskaFeePct = _hauskaFeePct;
        integratorFeePct = _integratorFeePct;
        emit PlatformFeesUpdated(_hauskaFeePct, _integratorFeePct);
    }

    /* core flows */

    function createContract(address principalEntity, address integrationPartner)
        external
        onlyAdmin
        whenNotPaused
        returns (address org)
    {
        if (
            licenseManager == address(0) ||
            assetRegistry  == address(0) ||
            groupManager   == address(0) ||
            revenueDistributor == address(0)
        ) revert ModulesNotSet();

        if (principalEntity == address(0) || orgDeployer == address(0)) revert InvalidAddress();
        if (principalToContract[principalEntity] != address(0)) revert PrincipalHasContract();

        org = IOrgDeployer(orgDeployer).deploy(address(this), principalEntity, integrationPartner);

        RoleWiringLibLite.wire(licenseManager, assetRegistry, groupManager, revenueDistributor, org);

        principalToContract[principalEntity] = org;
        validContracts[org] = true;
        contractIndex[org] = allContracts.length;
        allContracts.push(org);

        emit ContractCreated(principalEntity, org, integrationPartner);
    }

    function removeContract(address org) external onlyAdmin {
        if (!validContracts[org]) revert InvalidContract();

        address principal = IOrg(org).principal();

        RoleWiringLibLite.unwind(licenseManager, assetRegistry, groupManager, revenueDistributor, org);

        principalToContract[principal] = address(0);
        validContracts[org] = false;

        uint256 idx = contractIndex[org];
        uint256 last = allContracts.length - 1;
        if (idx != last) {
            address lastAddr = allContracts[last];
            allContracts[idx] = lastAddr;
            contractIndex[lastAddr] = idx;
        }
        allContracts.pop();
        delete contractIndex[org];

        emit ContractRemoved(org);
    }

    /* ===== Restored getters & helpers (for the dashboard/UI) ===== */

    function getPlatformFees() external view returns (uint32 integratorFee, uint32 hauskaFee) {
        return (integratorFeePct, hauskaFeePct);
    }

    function getContract(address principal) external view returns (address) {
        return principalToContract[principal];
    }

    function getAllContracts() external view returns (address[] memory) {
        return allContracts;
    }

    function getModules() external view returns (
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _assetNFT
    ) {
        return (licenseManager, assetRegistry, groupManager, revenueDistributor, assetNFT);
    }

    function getAssetNFT() external view returns (address) {
        return assetNFT;
    }

    function isValidOrgContract(address contractAddress) external view returns (bool) {
        return validContracts[contractAddress];
    }

    function getNumberOfOrganizations() external view returns (uint256) {
        return allContracts.length;
    }

    function getNumberOfCreators(address orgContract) external view returns (uint256) {
        if (!validContracts[orgContract]) revert InvalidContract();
        return IOrgStats(orgContract).getCreatorCount();
    }

    function pause() external onlyAdmin {
        paused = true;
        emit Paused(true);
    }
    
    function unpause() external onlyAdmin {
        paused = false;
        emit Paused(false);
    }    
}
