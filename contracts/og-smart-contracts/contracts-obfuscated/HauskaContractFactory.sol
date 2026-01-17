// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IOrg {
    function _v35a34c() external view returns (address);
    function _fbb393f(address) external;
    function _f56a5d5(address) external;
    function _feb75e6(address) external;
    function _f666724(address) external;
}

interface IOrgDeployer {
    function _fb0d51b(address _v7b202d, address _v35a34c, address _vbd9641) external returns (address);
}

interface IAccessControl {
    function _faafe6a(bytes32 role, address _vca2072) external;
    function _f49089d(bytes32 role, address _vca2072) external;
}

interface IOrgStats {
    function _fb03f4d() external view returns (uint256);
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
    ) external {
        IAccessControl(_vd0b565)._faafe6a(_cc9dbe0, _vd23b59);
        IAccessControl(_v9b2fda)._faafe6a(_cc9dbe0, _vd23b59);
        IAccessControl(_v45f631)._faafe6a(_cc9dbe0, _vd23b59);
        IAccessControl(_vedea5b)._faafe6a(_c15d343, _vd23b59);

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
    ) external {
        IAccessControl(_vd0b565)._f49089d(_cc9dbe0, _vd23b59);
        IAccessControl(_v9b2fda)._f49089d(_cc9dbe0, _vd23b59);
        IAccessControl(_v45f631)._f49089d(_cc9dbe0, _vd23b59);
        IAccessControl(_vedea5b)._f49089d(_c15d343, _vd23b59);
    }
}



contract EmpressaContractFactory {
    bytes32 public constant _c4f139c = keccak256("_c4f139c");
    
    error InvalidAddress();
    error ModulesAlreadySet();
    error ModulesNotSet();
    error PrincipalHasContract();
    error InvalidContract();
    error EmpressaFeeTooHigh();
    error IntegratorFeeTooHigh();
    
    address public _vd033e2;
    
    uint32 public _v3d6202 = 500;     
    uint32 public _v3055c2 = 100; 
    
    address public immutable _v0fa623;
    
    bool public _v11b1b5;
    
    address public _vd0b565;
    address public _v9b2fda;
    address public _v45f631;
    address public _vedea5b;
    address public _vde4409;
    address public _veaf768;
    
    mapping(address => address) public principalToContract;
    mapping(address => bool)    public validContracts;
    address[] public _v3d6004;
    mapping(address => uint256) public contractIndex;

    
    event _e5eb63d(address indexed _v35a34c, address indexed _vd23b59, address indexed _vbd9641);
    event _e08f032(address indexed _vd23b59);
    event _e99fa36(uint32 _vf0d665, uint32 _v9aa481);
    event _ecaf08d(address _vd0b565, address _v9b2fda, address _v45f631, address _vedea5b, address _vde4409);
    event _efafe8e(address deployer);
    event Paused(bool state);
    event _ed9b4cb(address indexed _vfa2183, address indexed newAdmin);

    constructor(address _vec75e2) {
        if (_vec75e2  == address(0)) revert InvalidAddress();
        _vd033e2 = msg.sender;
        _v0fa623 = _vec75e2;
        emit _ed9b4cb(address(0), msg.sender);
    }

    
    modifier _mc87f2a() { require(msg.sender == _vd033e2, "NA"); _; }
    modifier whenNotPaused() { require(!_v11b1b5, "P"); _; }

    function _f4e2b89(address _v8afa7f) external _mc87f2a {
        if (_v8afa7f == address(0)) revert InvalidAddress();
        emit _ed9b4cb(_vd033e2, _v8afa7f);
        _vd033e2 = _v8afa7f;
    }

    function hasRole(bytes32 role, address _vca2072) external view returns (bool) {
        if (role == _c4f139c) {
            return _vca2072 == _vd033e2;
        }
        return false;
    }

    function _fa03833(
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _v9d7695
    ) external _mc87f2a {
        if (
            _vd0b565 != address(0) ||
            _v9b2fda  != address(0) ||
            _v45f631   != address(0) ||
            _vedea5b != address(0)
        ) revert ModulesAlreadySet();

        if (
            _licenseManager == address(0) ||
            _assetRegistry  == address(0) ||
            _groupManager   == address(0) ||
            _revenueDistributor == address(0)
        ) revert InvalidAddress();

        _vd0b565     = _licenseManager;
        _v9b2fda      = _assetRegistry;
        _v45f631       = _groupManager;
        _vedea5b = _revenueDistributor;
        _vde4409           = _v9d7695;

        emit _ecaf08d(_licenseManager, _assetRegistry, _groupManager, _revenueDistributor, _v9d7695);
    }

    function _f268821(address _v260d80) external _mc87f2a {
        if (_v260d80 == address(0)) revert InvalidAddress();
        _veaf768 = _v260d80;
        emit _efafe8e(_v260d80);
    }

    function _f070edc(address _v9d7695) external _mc87f2a {
        if (_v9d7695 == address(0)) revert InvalidAddress();
        _vde4409 = _v9d7695;
    }

    function _fde2699(bool p) external _mc87f2a {
        _v11b1b5 = p;
        emit Paused(p);
    }

    function _fa489c3(uint32 _EmpressaFeePct, uint32 _integratorFeePct) external _mc87f2a {
        if (_EmpressaFeePct > 5000) revert EmpressaFeeTooHigh();    
        if (_integratorFeePct > 200) revert IntegratorFeeTooHigh(); 
        _v3d6202 = _EmpressaFeePct;
        _v3055c2 = _integratorFeePct;
        emit _e99fa36(_EmpressaFeePct, _integratorFeePct);
    }

    function _f2b7448(address _v6fb819, address _vbd9641)
        external
        _mc87f2a
        whenNotPaused
        returns (address _vd23b59)
    {
        if (
            _vd0b565 == address(0) ||
            _v9b2fda  == address(0) ||
            _v45f631   == address(0) ||
            _vedea5b == address(0)
        ) revert ModulesNotSet();

        if (_v6fb819 == address(0) || _veaf768 == address(0)) revert InvalidAddress();
        if (principalToContract[_v6fb819] != address(0)) revert PrincipalHasContract();

        _vd23b59 = IOrgDeployer(_veaf768)._fb0d51b(address(this), _v6fb819, _vbd9641);

        RoleWiringLib._f6e1c68(_vd0b565, _v9b2fda, _v45f631, _vedea5b, _vd23b59);

        principalToContract[_v6fb819] = _vd23b59;
        validContracts[_vd23b59] = true;
        contractIndex[_vd23b59] = _v3d6004.length;
        _v3d6004.push(_vd23b59);

        emit _e5eb63d(_v6fb819, _vd23b59, _vbd9641);
    }

    function _f906454(address _vd23b59) external _mc87f2a {
        if (!validContracts[_vd23b59]) revert InvalidContract();

        address _v35a34c = IOrg(_vd23b59)._v35a34c();

        RoleWiringLib._fefb056(_vd0b565, _v9b2fda, _v45f631, _vedea5b, _vd23b59);

        principalToContract[_v35a34c] = address(0);
        validContracts[_vd23b59] = false;

        uint256 _v4e7f62 = contractIndex[_vd23b59];
        uint256 _v213ed3 = _v3d6004.length - 1;
        if (_v4e7f62 != _v213ed3) {
            address _vb60c32 = _v3d6004[_v213ed3];
            _v3d6004[_v4e7f62] = _vb60c32;
            contractIndex[_vb60c32] = _v4e7f62;
        }
        _v3d6004.pop();
        delete contractIndex[_vd23b59];

        emit _e08f032(_vd23b59);
    }

    function _f6ede20() external view returns (uint32 _v9aa481, uint32 _vf0d665) {
        return (_v3055c2, _v3d6202);
    }

    function _fca5a15(address _v35a34c) external view returns (address) {
        return principalToContract[_v35a34c];
    }

    function _f60f9a9() external view returns (address[] memory) {
        return _v3d6004;
    }

    function _f84a41b() external view returns (
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _v9d7695
    ) {
        return (_vd0b565, _v9b2fda, _v45f631, _vedea5b, _vde4409);
    }

    function _f324eca() external view returns (address) {
        return _vde4409;
    }

    function _f4e55c4(address contractAddress) external view returns (bool) {
        return validContracts[contractAddress];
    }

    function _fa31571() external view returns (uint256) {
        return _v3d6004.length;
    }

    function _f62a9d1(address _v3030a8) external view returns (uint256) {
        if (!validContracts[_v3030a8]) revert InvalidContract();
        return IOrgStats(_v3030a8)._fb03f4d();
    }

    function pause() external _mc87f2a {
        _v11b1b5 = true;
        emit Paused(true);
    }
    
    function unpause() external _mc87f2a {
        _v11b1b5 = false;
        emit Paused(false);
    }    
}
