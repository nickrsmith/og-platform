// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IOrgDeployer {
    function _fb0d51b(address _v7b202d, address _v35a34c, address _vbd9641) external returns (address);
}

interface IOrg {
    function _v35a34c() external view returns (address);
    function _fbb393f(address _licenseManager) external;
    function _f56a5d5(address _assetRegistry) external;
    function _feb75e6(address _groupManager) external;
    function _f666724(address _revenueDistributor) external;
}

interface IOrgStats {
    function _fb03f4d() external view returns (uint256);
}

interface IAccessControl {
    function grantRole(bytes32 role, address account) external;
    function revokeRole(bytes32 role, address account) external;
}

library RoleWiringLib {
    bytes32 internal constant _cc9dbe0        = keccak256("_cc9dbe0");
    bytes32 internal constant _c15d343 = keccak256("_c15d343");
    
    function _f6e1c68(
        address _vd0b565,
        address _v9b2fda,
        address _v45f631,
        address _vedea5b,
        address _vd23b59
    ) internal {
        
        IAccessControl(_vd0b565).grantRole(_cc9dbe0, _vd23b59);
        IAccessControl(_v9b2fda).grantRole(_cc9dbe0, _vd23b59);
        IAccessControl(_v45f631).grantRole(_cc9dbe0, _vd23b59);
        IAccessControl(_vedea5b).grantRole(_c15d343, _vd23b59);
        
        IOrg(_vd23b59)._fbb393f(_vd0b565);
        IOrg(_vd23b59)._f56a5d5(_v9b2fda);
        IOrg(_vd23b59)._feb75e6(_v45f631);
        IOrg(_vd23b59)._f666724(_vedea5b);
    }
    
    function _fefb056(
        address _vd0b565,
        address _v9b2fda,
        address _v45f631,
        address _vedea5b,
        address _vd23b59
    ) internal {
        IAccessControl(_vd0b565).revokeRole(_cc9dbe0, _vd23b59);
        IAccessControl(_v9b2fda).revokeRole(_cc9dbe0, _vd23b59);
        IAccessControl(_v45f631).revokeRole(_cc9dbe0, _vd23b59);
        IAccessControl(_vedea5b).revokeRole(_c15d343, _vd23b59);
    }
}

contract EmpressaContractFactoryUpgradeable is 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable, 
    UUPSUpgradeable 
{
    error InvalidAddress();
    error ModulesAlreadySet();
    error ModulesNotSet();
    error PrincipalHasContract();
    error InvalidContract();
    error EmpressaFeeTooHigh();
    error IntegratorFeeTooHigh();
    
    bytes32 public constant _cb4091d = keccak256("_cb4091d");
    bytes32 public constant _cc9dbe0 = keccak256("_cc9dbe0");
    bytes32 public constant _c15d343 = keccak256("_c15d343");
    address public _veaf768;
    address public _v0fa623;
    address public _vd0b565;
    address public _v9b2fda;
    address public _v45f631;
    address public _vedea5b;
    address public _vde4409;
    uint32 public _v3d6202;
    uint32 public _v3055c2;
    
    mapping(address => address) public principalToOrgContract;
    mapping(address => bool) public _f4e55c4;
    
    address[] public _v3d6004;
    mapping(address => uint256) public contractIndex;
    
    event _ed9cb2d(address indexed _v35a34c, address indexed _v3030a8, address indexed _vbd9641);
    event _e3d0afc(address indexed _vd23b59);
    event _ecaf08d(address _vd0b565, address _v9b2fda, address _v45f631, address _vedea5b, address _vde4409);
    event _e18858a(uint32 _vf0d665, uint32 _v9aa481);
    event _e07adc7(address indexed _v687144, address indexed newDeployer);
    event _eaa34cc(address indexed _vcfebb0, address indexed newAssetNFT);

    constructor() {
    }

    function _f4728f2(
        address _v3b7ca2,
        address _orgDeployer,
        address _vec75e2
    ) public {
        require(_v3b7ca2 != address(0), "Invalid _vd033e2 address");
        require(_orgDeployer != address(0), "Invalid _vd23b59 deployer address");
        require(_vec75e2 != address(0), "Invalid USDC token address");
        _grantRole(DEFAULT_ADMIN_ROLE, _v3b7ca2);
        _grantRole(_cb4091d, _v3b7ca2);

        _veaf768 = _orgDeployer;
        _v0fa623 = _vec75e2;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(_cb4091d) {}

    
    function _f5e5969(address _v35a34c, address _vbd9641) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused returns (address) {
        if (
            _vd0b565 == address(0) ||
            _v9b2fda  == address(0) ||
            _v45f631   == address(0) ||
            _vedea5b == address(0)
        ) revert ModulesNotSet();

        require(_v35a34c != address(0), "Invalid _v35a34c address");
        require(_veaf768 != address(0), "Org deployer not set");
        require(principalToOrgContract[_v35a34c] == address(0), "Principal already has contract");
        
        address _ve779dd = IOrgDeployer(_veaf768)._fb0d51b(address(this), _v35a34c, _vbd9641);
        
        principalToOrgContract[_v35a34c] = _ve779dd;
        _f4e55c4[_ve779dd] = true;
        contractIndex[_ve779dd] = _v3d6004.length;
        _v3d6004.push(_ve779dd);
        
        RoleWiringLib._f6e1c68(_vd0b565, _v9b2fda, _v45f631, _vedea5b, _ve779dd);
        
        emit _ed9cb2d(_v35a34c, _ve779dd, _vbd9641);
        
        return _ve779dd;
    }

    function _f906454(address _vd23b59) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_f4e55c4[_vd23b59], "Invalid contract");
        address _v35a34c = IOrg(_vd23b59)._v35a34c();
        RoleWiringLib._fefb056(_vd0b565, _v9b2fda, _v45f631, _vedea5b, _vd23b59);
        
        principalToOrgContract[_v35a34c] = address(0);
        _f4e55c4[_vd23b59] = false;
        
        uint256 _v4e7f62 = contractIndex[_vd23b59];
        uint256 _v213ed3 = _v3d6004.length - 1;
        if (_v4e7f62 != _v213ed3) {
            address _vb60c32 = _v3d6004[_v213ed3];
            _v3d6004[_v4e7f62] = _vb60c32;
            contractIndex[_vb60c32] = _v4e7f62;
        }
        _v3d6004.pop();
        delete contractIndex[_vd23b59];
        
        emit _e3d0afc(_vd23b59);
    }

    function _fa03833(
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _v9d7695
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_licenseManager != address(0) && _assetRegistry != address(0) &&
                _groupManager != address(0) && _revenueDistributor != address(0), "Invalid module address");

        _vd0b565 = _licenseManager;
        _v9b2fda = _assetRegistry;
        _v45f631 = _groupManager;
        _vedea5b = _revenueDistributor;
        _vde4409 = _v9d7695;

        emit _ecaf08d(_licenseManager, _assetRegistry, _groupManager, _revenueDistributor, _v9d7695);
    }

    function _f070edc(address _v9d7695) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_v9d7695 != address(0), "Invalid _v05fac9 NFT address");
        address _vcfebb0 = _vde4409;
        _vde4409 = _v9d7695;
        emit _eaa34cc(_vcfebb0, _v9d7695);
    }

    function _f9d3018(uint32 _EmpressaFee, uint32 _integratorFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_EmpressaFee <= 5000, "Empressa _v9c15cd too high"); 
        require(_integratorFee <= 200, "Integrator _v9c15cd too high"); 

        _v3d6202 = _EmpressaFee;
        _v3055c2 = _integratorFee;

        emit _e18858a(_EmpressaFee, _integratorFee);
    }

    function _f84a41b() external view returns (address, address, address, address, address) {
        return (_vd0b565, _v9b2fda, _v45f631, _vedea5b, _vde4409);
    }

    function _f6ede20() external view returns (uint32, uint32) {
        return (_v3055c2, _v3d6202);
    }

    function _f7a4efb() external view returns (address) {
        return _veaf768;
    }

    function _fa757a4() external view returns (address) {
        return _v0fa623;
    }

    function _f60f9a9() external view returns (address[] memory) {
        return _v3d6004;
    }

    function _fca5a15(address _v35a34c) external view returns (address) {
        return principalToOrgContract[_v35a34c];
    }

    function _fe2f29b(address contractAddress) external view returns (bool) {
        return _f4e55c4[contractAddress];
    }

    function _fa31571() external view returns (uint256) {
        return _v3d6004.length;
    }

    function _f62a9d1(address _v3030a8) external view returns (uint256) {
        require(_f4e55c4[_v3030a8], "Invalid contract");
        return IOrgStats(_v3030a8)._fb03f4d();
    }

    function _f324eca() external view returns (address) {
        return _vde4409;
    }

    function hasRole(bytes32 role, address _vca2072) public view override returns (bool) {
        return super.hasRole(role, _vca2072);
    }
    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _f5d2b41(address newOrgDeployer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOrgDeployer != address(0), "Invalid _vd23b59 deployer address");
        address _v687144 = _veaf768;
        _veaf768 = newOrgDeployer;
        emit _e07adc7(_v687144, newOrgDeployer);
    }
}
