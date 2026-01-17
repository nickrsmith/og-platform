// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IHauskaContracts.sol";
import "./interfaces/IHauskaStructs.sol";
import "./HauskaLicenseNFT.sol";


contract HauskaLicenseManagerV2 is AccessControl, ReentrancyGuard, IHauskaLicenseManager {
    using SafeERC20 for IERC20;
    
    bytes32 public constant _cc9dbe0 = keccak256("_cc9dbe0");
    
    address public immutable _v9a06a8;
    address public immutable _v0fa623;
    HauskaLicenseNFT public immutable _v5e116c;
    
    
    event _ecc66c6(
        address indexed _v3030a8,
        uint256 indexed _va95b9f,
        uint256 indexed _v9d8e96,
        address _v204851,
        uint256 _v9c15cd
    );
    
    event _eb7fa8d(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        address indexed _v204851,
        uint256[] _vb6adb2,
        uint256 _v9765b3
    );
    
    event _eab17a3(uint256 indexed _va95b9f, uint256 newExpiration, uint256 _v9c15cd);
    event _ee5e841(uint256 indexed _va95b9f);
    event _e543a3f(
        uint256 indexed originalTokenId,
        uint256 indexed _vebf33e,
        address indexed newLicensee,
        uint256 _v9c15cd
    );
    
    constructor(address _factory, address _vec75e2) {
        require(_factory != address(0), "Invalid _v7b202d");
        require(_vec75e2 != address(0), "Invalid USDC token");
        
        _v9a06a8 = _factory;
        _v0fa623 = _vec75e2;
        _v5e116c = new HauskaLicenseNFT();
        _v5e116c.grantRole(_v5e116c._c46ff91(), address(this));
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_cc9dbe0, _factory);
    }
    function _f2df134(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        IHauskaStructs.LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256) {
        return _f726df9(_v3030a8, _v9d8e96, _v204851, _v7e9272, _v09603a, 0);
    }
    
    function _f726df9(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        IHauskaStructs.LicensePermissions[] memory _v7e9272,
        uint256 _v09603a,
        uint256 duration
    ) public nonReentrant returns (uint256) {
        require(hasRole(_cc9dbe0, msg.sender), "Not authorized");
        require(_v204851 != address(0), "Invalid _v204851");
        require(!_v5e116c.hasLicense(_v3030a8, _v9d8e96, _v204851), "Already licensed");
        
        IHauskaAssetRegistry registry = IHauskaAssetRegistry(
            IHauskaOrgContract(_v3030a8)._v9b2fda()
        );
        IHauskaStructs.VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v3030a8, _v9d8e96);
        
        require(_v05fac9._v9d8e96 > 0, "Asset does not exist");
        require(_v05fac9._v47da9d, "Asset not verified");
        require(_v05fac9._vc772a5, "Asset cannot be licensed");
        
        IERC20(_v0fa623).safeTransferFrom(_v204851, address(this), _v05fac9._v2097c3);
        _fabb131(_v9d8e96, _v204851, _v3030a8, _v05fac9._v2097c3, _v05fac9._vca0dd8);
        
        uint8 _v5e4fd4 = 0;
        for (uint _v042dc4 = 0; _v042dc4 < _v7e9272.length; _v042dc4++) {
            if (_v7e9272[_v042dc4] == IHauskaStructs.LicensePermissions._v69bd4e) _v5e4fd4 |= 2;
            if (_v7e9272[_v042dc4] == IHauskaStructs.LicensePermissions.Resell) _v5e4fd4 |= 1;
        }
        if (_v5e4fd4 == 0) _v5e4fd4 = 2; 
        
        
        uint256 _va95b9f = _v5e116c._fd9a1eb(
            _v204851,
            _v3030a8,
            _v9d8e96,
            _v05fac9._vca0dd8,
            _v5e4fd4,
            _v09603a > 0 ? _v09603a : _v05fac9._v2097c3,
            duration
        );
        
        emit _ecc66c6(_v3030a8, _va95b9f, _v9d8e96, _v204851, _v05fac9._v2097c3);
        
        return _va95b9f;
    }
    
    function _f606184(
        address ,
        uint256 ,
        address _v204851,
        uint256 existingLicenseId
    ) external returns (uint256) {
        IHauskaStructs.LicensePermissions[] memory _v7e9272 = new IHauskaStructs.LicensePermissions[](1);
        _v7e9272[0] = IHauskaStructs.LicensePermissions._v69bd4e;
        return _f91c986(existingLicenseId, _v204851, _v7e9272, 0);
    }
    
    function _f91c986(
        uint256 originalTokenId,
        address newLicensee,
        IHauskaStructs.LicensePermissions[] memory newPermissions,
        uint256 newResellerFee
    ) public nonReentrant returns (uint256) {
        require(_v5e116c.ownerOf(originalTokenId) == msg.sender, "Not _v234571 _v579233");
        require(newLicensee != address(0), "Invalid _v204851");
        require(_v5e116c._f8567c8(originalTokenId), "License not valid");
        
        HauskaLicenseNFT.LicenseData memory _v3acede = _v5e116c._fa97764(originalTokenId);
        
        require(_v3acede._v7e9272 & 1 == 1, "No resell _v6d244f");
        require(!_v5e116c.hasLicense(_v3acede._v3030a8, _v3acede._v9d8e96, newLicensee), "Already licensed");
        
        IERC20(_v0fa623).safeTransferFrom(newLicensee, address(this), _v3acede._v09603a);
        
        uint256 _v8f2213 = (_v3acede._v09603a * 20) / 100;
        uint256 _v600764 = _v3acede._v09603a - _v8f2213;
        
        IERC20(_v0fa623).safeTransfer(msg.sender, _v8f2213);
        _fabb131(_v3acede._v9d8e96, newLicensee, _v3acede._v3030a8, _v600764, _v3acede._v156506);
        
        uint8 _v5e4fd4 = 0;
        for (uint _v042dc4 = 0; _v042dc4 < newPermissions.length; _v042dc4++) {
            if (newPermissions[_v042dc4] == IHauskaStructs.LicensePermissions._v69bd4e) _v5e4fd4 |= 2;
            if (newPermissions[_v042dc4] == IHauskaStructs.LicensePermissions.Resell) _v5e4fd4 |= 1;
        }
        if (_v5e4fd4 == 0) _v5e4fd4 = 2;
        
        
        uint256 _vebf33e = _v5e116c._fd9a1eb(
            newLicensee,
            _v3acede._v3030a8,
            _v3acede._v9d8e96,
            _v3acede._v156506,
            _v5e4fd4,
            newResellerFee > 0 ? newResellerFee : _v3acede._v09603a,
            0 
        );
        
        emit _e543a3f(originalTokenId, _vebf33e, newLicensee, _v3acede._v09603a);
        
        return _vebf33e;
    }
    
    function _fbcc39b(
        address _v3030a8,
        uint256 _vd6b1fa,
        address _v204851,
        IHauskaStructs.LicensePermissions[] memory _v7e9272,
        uint256 
    ) external nonReentrant returns (uint256[] memory) {
        require(hasRole(_cc9dbe0, msg.sender), "Not authorized");
        require(_v204851 != address(0), "Invalid _v204851");
        
        IHauskaGroupManager _v45f631 = IHauskaGroupManager(
            IHauskaOrgContract(_v3030a8)._v45f631()
        );
        IHauskaStructs.AssetGroup memory _v64292b = _v45f631._f624914(_v3030a8, _vd6b1fa);
        
        require(_v64292b._vd6b1fa > 0, "Group does not exist");
        require(_v64292b._vf13eb5.length > 0, "Empty _v64292b");
        
        IERC20(_v0fa623).safeTransferFrom(_v204851, address(this), _v64292b._v2459dc);
        uint256 _v4f3b69 = _v64292b._v2459dc / _v64292b._vf13eb5.length;
        uint256[] memory _vb6adb2 = new uint256[](_v64292b._vf13eb5.length);
        
        for (uint256 _v042dc4 = 0; _v042dc4 < _v64292b._vf13eb5.length; _v042dc4++) {
            
            if (_v5e116c.hasLicense(_v3030a8, _v64292b._vf13eb5[_v042dc4], _v204851)) {
                continue;
            }
            IHauskaAssetRegistry registry = IHauskaAssetRegistry(
                IHauskaOrgContract(_v3030a8)._v9b2fda()
            );
            IHauskaStructs.VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v3030a8, _v64292b._vf13eb5[_v042dc4]);
            
            require(_v05fac9._v47da9d, "Asset not verified");
            require(_v05fac9._vc772a5, "Asset cannot be licensed");
            
            _fabb131(_v64292b._vf13eb5[_v042dc4], _v204851, _v3030a8, _v4f3b69, _v05fac9._vca0dd8);
            
            
            uint8 _v5e4fd4 = 0;
            for (uint _v5c2dd9 = 0; _v5c2dd9 < _v7e9272.length; _v5c2dd9++) {
                if (_v7e9272[_v5c2dd9] == IHauskaStructs.LicensePermissions._v69bd4e) _v5e4fd4 |= 2;
                if (_v7e9272[_v5c2dd9] == IHauskaStructs.LicensePermissions.Resell) _v5e4fd4 |= 1;
            }
            if (_v5e4fd4 == 0) _v5e4fd4 = 2;
            _vb6adb2[_v042dc4] = _v5e116c._fd9a1eb(
                _v204851,
                _v3030a8,
                _v64292b._vf13eb5[_v042dc4],
                _v05fac9._vca0dd8,
                _v5e4fd4,
                _v4f3b69,
                0 
            );
        }
        emit _eb7fa8d(_v3030a8, _vd6b1fa, _v204851, _vb6adb2, _v64292b._v2459dc);
        
        return _vb6adb2;
    }
    
    function _f20838d(uint256 _va95b9f, uint256 _vb0ad1d) external nonReentrant {
        require(_v5e116c.ownerOf(_va95b9f) == msg.sender, "Not _v234571 _v579233");
        require(_vb0ad1d > 0, "Invalid duration");
        
        HauskaLicenseNFT.LicenseData memory _v234571 = _v5e116c._fa97764(_va95b9f);
        require(_v234571._vdf9c6b > 0, "License is perpetual");
        
        
        IHauskaAssetRegistry registry = IHauskaAssetRegistry(
            IHauskaOrgContract(_v234571._v3030a8)._v9b2fda()
        );
        IHauskaStructs.VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v234571._v3030a8, _v234571._v9d8e96);
        
        IERC20(_v0fa623).safeTransferFrom(msg.sender, address(this), _v05fac9._v2097c3);
        _fabb131(_v234571._v9d8e96, msg.sender, _v234571._v3030a8, _v05fac9._v2097c3, _v05fac9._vca0dd8);
        
        emit _eab17a3(_va95b9f, _v234571._vdf9c6b + _vb0ad1d, _v05fac9._v2097c3);
    }
    
    function _f6715f1(uint256 _va95b9f) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _v5e116c._f6715f1(_va95b9f);
        emit _ee5e841(_va95b9f);
    }
    
    function _fa5f9f5(
        address _v3030a8,
        uint256 _v9d8e96,
        address user
    ) external view returns (bool) {
        return _v5e116c._f58db77(_v3030a8, _v9d8e96, user);
    }
    
    function _fb89493(
        address _v3030a8,
        address user
    ) external view returns (uint256[] memory) {
        uint256[] memory _v728f99 = _v5e116c._fb89493(user);
        
        
        uint256 _vee9f38 = 0;
        for (uint256 _v042dc4 = 0; _v042dc4 < _v728f99.length; _v042dc4++) {
            HauskaLicenseNFT.LicenseData memory _v234571 = _v5e116c._fa97764(_v728f99[_v042dc4]);
            if (_v234571._v3030a8 == _v3030a8) {
                _vee9f38++;
            }
        }
        
        uint256[] memory _v989983 = new uint256[](_vee9f38);
        uint256 _ve540cd = 0;
        for (uint256 _v042dc4 = 0; _v042dc4 < _v728f99.length; _v042dc4++) {
            HauskaLicenseNFT.LicenseData memory _v234571 = _v5e116c._fa97764(_v728f99[_v042dc4]);
            if (_v234571._v3030a8 == _v3030a8) {
                _v989983[_ve540cd] = _v728f99[_v042dc4];
                _ve540cd++;
            }
        }
        
        return _v989983;
    }
    
    function _f8567c8(uint256 _va95b9f) external view returns (bool) {
        return _v5e116c._f8567c8(_va95b9f);
    }
    
    function _fa97764(uint256 _va95b9f) 
        external 
        view 
        returns (
            uint256 _v9d8e96,
            address _v147f2a,
            address _v204851,
            uint256 _v9c15cd,
            address _v3030a8
        ) 
    {
        HauskaLicenseNFT.LicenseData memory _v234571 = _v5e116c._fa97764(_va95b9f);
        address _v579233 = _v5e116c.ownerOf(_va95b9f);
        
        return (
            _v234571._v9d8e96,
            _v234571._v156506,
            _v579233,
            _v234571._v09603a,
            _v234571._v3030a8
        );
    }
    
    function _fabb131(
        uint256 _v9d8e96,
        address _v204851,
        address _v3030a8,
        uint256 _v9cb6ff,
        address assetOwner
    ) private {
        address _vedea5b = IHauskaOrgContract(_v3030a8)._vedea5b();
        
        if (_vedea5b != address(0)) {
            address _vbd9641 = IHauskaOrgContract(_v3030a8)._vbd9641();
            
            IERC20(_v0fa623).safeApprove(_vedea5b, _v9cb6ff);
            
            IHauskaRevenueDistributor(_vedea5b)._f216d88(
                _v9d8e96,
                _v204851,
                address(this),
                _v9cb6ff,
                assetOwner,
                _vbd9641,
                _v3030a8
            );
        } else {
            IERC20(_v0fa623).safeTransfer(assetOwner, _v9cb6ff);
        }
    }
    
    function _f185cbc(address _v3030a8) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(_cc9dbe0, _v3030a8);
    }
    
    function _f8b6d7c(address _v3030a8) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(_cc9dbe0, _v3030a8);
    }
    
    function _fb3c135() external view returns (address) {
        return address(_v5e116c);
    }
}