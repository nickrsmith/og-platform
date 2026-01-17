// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IHauskaStructs.sol";
import "./interfaces/IHauskaContracts.sol";


contract HauskaLicenseManager is AccessControl, ReentrancyGuard, IHauskaStructs {
    using SafeERC20 for IERC20;
    
    bytes32 public constant _c4f139c = keccak256("_c4f139c");
    bytes32 public constant _cc9dbe0 = keccak256("_cc9dbe0");
    
    address public immutable _v7b202d;
    address public immutable _v0fa623;
    
    uint256 private _v748f0b;
    
    struct License {
        uint256 _v9d8e96;
        address _v147f2a;
        address _v204851;
        uint256 _v9c15cd;
        uint256 _v09603a;
        uint8 _v7e9272; 
        address _v3030a8;
        uint256 _vdf9c6b; 
        bool _v20ed6b;
    }
    
    mapping(uint256 => License) public _va39ea9;
    mapping(address => mapping(uint256 => mapping(address => bool))) public assetLicensedBy;
    mapping(address => mapping(address => uint256[])) public userLicenses;
    
    
    event _ecc66c6(
        address indexed _v3030a8,
        uint256 indexed _v87c9ae,
        uint256 indexed _v9d8e96,
        address _v204851,
        uint256 _v9c15cd
    );
    
    event _eb7fa8d(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        address indexed _v204851,
        uint256[] _v801b50,
        uint256 _v9765b3
    );
    
    event _eae6763(
        uint256 indexed originalLicenseId,
        uint256 indexed _v9863eb,
        address indexed reseller,
        address newLicensee,
        uint256 _v9765b3
    );
    
    constructor(address _factory, address _vec75e2) {
        require(_factory != address(0), "Invalid _v7b202d");
        require(_vec75e2 != address(0), "Invalid USDC");
        
        _v7b202d = _factory;
        _v0fa623 = _vec75e2;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_c4f139c, msg.sender);
    }
    
    function _f2df134(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256) {
        return _f726df9(_v3030a8, _v9d8e96, _v204851, _v7e9272, _v09603a, 0);
    }
    
    function _f726df9(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        LicensePermissions[] memory _v7e9272,
        uint256 _v09603a,
        uint256 duration 
    ) public nonReentrant returns (uint256) {
        require(hasRole(_cc9dbe0, msg.sender), "Not authorized");
        require(_v204851 != address(0), "Invalid _v204851");
        require(!assetLicensedBy[_v3030a8][_v9d8e96][_v204851], "Already licensed");
        
        IHauskaAssetRegistry registry = IHauskaAssetRegistry(
            IHauskaOrgContract(_v3030a8)._v9b2fda()
        );
        VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v3030a8, _v9d8e96);
        
        require(_v05fac9._v9d8e96 > 0, "Asset does not exist");
        require(_v05fac9._v47da9d, "Asset not verified");
        require(_v05fac9._vc772a5, "Asset cannot be licensed");
        
        if (_v05fac9._v0c96e3.length > 0) {
            
            
            _f35cd05(_v05fac9._v0c96e3, _v204851);
        }
        IERC20(_v0fa623).safeTransferFrom(_v204851, address(this), _v05fac9._v2097c3);
        _fabb131(_v9d8e96, _v204851, _v3030a8, _v05fac9._v2097c3, _v05fac9._v579233);
        uint256 _v9863eb = ++_v748f0b;
        
        uint8 _v5e4fd4 = 0;
        for (uint _v042dc4 = 0; _v042dc4 < _v7e9272.length; _v042dc4++) {
            if (_v7e9272[_v042dc4] == LicensePermissions._v69bd4e) _v5e4fd4 |= 2;
            if (_v7e9272[_v042dc4] == LicensePermissions.Resell) _v5e4fd4 |= 1;
        }
        if (_v5e4fd4 == 0) _v5e4fd4 = 2; 
        
        _va39ea9[_v9863eb] = License({
            _v9d8e96: _v9d8e96,
            _v147f2a: _v05fac9._vca0dd8,
            _v204851: _v204851,
            _v9c15cd: _v05fac9._v2097c3,
            _v09603a: _v09603a > 0 ? _v09603a : _v05fac9._v2097c3, 
            _v7e9272: _v5e4fd4,
            _v3030a8: _v3030a8,
            _vdf9c6b: duration > 0 ? block.timestamp + duration : 0,
            _v20ed6b: true
        });
        
        assetLicensedBy[_v3030a8][_v9d8e96][_v204851] = true;
        userLicenses[_v3030a8][_v204851].push(_v9863eb);

        (uint32 _v3d6202, uint32 _v3055c2) = IHauskaRevenueDistributor(IHauskaOrgContract(_v3030a8)._vedea5b())._f434c53(_v3030a8);
        
        emit _ecc66c6(_v3030a8, _v9863eb, _v9d8e96, _v204851, _v05fac9._v2097c3 * 10000 / (10000 + _v3d6202 + _v3055c2));
        
        return _v9863eb;
    }
    
    function _f606184(
        uint256 originalLicenseId,
        address newLicensee,
        uint256 markup
    ) external nonReentrant returns (uint256) {
        License memory _v3acede = _va39ea9[originalLicenseId];
        require(_v3acede._v204851 == msg.sender, "Not _v234571 _v579233");
        require(_v3acede._v7e9272 & 1 == 1, "No resell _v6d244f");
        require(newLicensee != address(0), "Invalid _v204851");
        
        address _v3030a8 = _v3acede._v3030a8;
        uint256 _v9d8e96 = _v3acede._v9d8e96;
        
        require(!assetLicensedBy[_v3030a8][_v9d8e96][newLicensee], "Already licensed");
        
        uint256 _v9765b3 = _v3acede._v09603a + markup;
        
        
        IERC20(_v0fa623).safeTransferFrom(newLicensee, address(this), _v9765b3);
        
        
        if (markup > 0) {
            IERC20(_v0fa623).safeTransfer(msg.sender, markup);
        }
        
        
        if (_v3acede._v09603a > 0) {
            _fabb131(_v9d8e96, newLicensee, _v3030a8, _v3acede._v09603a, _v3acede._v147f2a);
        }
        
        
        uint256 _v9863eb = ++_v748f0b;
        
        _va39ea9[_v9863eb] = License({
            _v9d8e96: _v9d8e96,
            _v147f2a: msg.sender, 
            _v204851: newLicensee,
            _v9c15cd: _v9765b3,
            _v09603a: _v3acede._v09603a, 
            _v7e9272: _v3acede._v7e9272, 
            _v3030a8: _v3030a8,
            _vdf9c6b: _v3acede._vdf9c6b, 
            _v20ed6b: true
        });
        
        
        assetLicensedBy[_v3030a8][_v9d8e96][newLicensee] = true;
        userLicenses[_v3030a8][newLicensee].push(_v9863eb);
        
        emit _eae6763(originalLicenseId, _v9863eb, msg.sender, newLicensee, _v9765b3);
        
        return _v9863eb;
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
    
    function _fa5f9f5(
        address _v3030a8,
        uint256 _v9d8e96,
        address user
    ) external view returns (bool) {
        if (!assetLicensedBy[_v3030a8][_v9d8e96][user]) return false;
        
        
        uint256[] memory _vfa7567 = userLicenses[_v3030a8][user];
        for (uint _v042dc4 = 0; _v042dc4 < _vfa7567.length; _v042dc4++) {
            License memory _v234571 = _va39ea9[_vfa7567[_v042dc4]];
            if (_v234571._v9d8e96 == _v9d8e96 && _f8567c8(_vfa7567[_v042dc4])) {
                return true;
            }
        }
        return false;
    }
    
    function _fb89493(
        address _v3030a8,
        address user
    ) external view returns (uint256[] memory) {
        return userLicenses[_v3030a8][user];
    }

    function _f645025() external view returns (uint256) {
        return _v748f0b;
    }
    
    function _fa97764(uint256 _v87c9ae) external view returns (
        uint256 _v9d8e96,
        address _v147f2a,
        address _v204851,
        uint256 _v9c15cd,
        address _v3030a8
    ) {
        License memory _v234571 = _va39ea9[_v87c9ae];
        return (
            _v234571._v9d8e96,
            _v234571._v147f2a,
            _v234571._v204851,
            _v234571._v9c15cd,
            _v234571._v3030a8
        );
    }
    
    function _fac0e4c(uint256 _v87c9ae, LicensePermissions _v6d244f) external view returns (bool) {
        uint8 _v4e0768 = _va39ea9[_v87c9ae]._v7e9272;
        if (_v6d244f == LicensePermissions._v69bd4e) return (_v4e0768 & 2) == 2;
        if (_v6d244f == LicensePermissions.Resell) return (_v4e0768 & 1) == 1;
        return false;
    }
    
    function _f640c9e(address token, uint256 _v9cb6ff) external onlyRole(_c4f139c) {
        if (token == address(0)) {
            payable(msg.sender).transfer(_v9cb6ff);
        } else {
            IERC20(token).safeTransfer(msg.sender, _v9cb6ff);
        }
    }
    
    function _fbcc39b(
        address _v3030a8,
        uint256 _vd6b1fa,
        address _v204851,
        LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external onlyRole(_cc9dbe0) nonReentrant returns (uint256[] memory) {
        require(_v204851 != address(0), "Invalid _v204851");
        
        
        IHauskaGroupManager _v45f631 = IHauskaGroupManager(
            IHauskaOrgContract(_v3030a8)._v45f631()
        );
        AssetGroup memory _v64292b = _v45f631._f624914(_v3030a8, _vd6b1fa);
        
        require(_v64292b._vd6b1fa > 0, "Group does not exist");
        require(_v64292b._vf13eb5.length > 0, "Group has no _f3685e3");
        
        IHauskaAssetRegistry registry = IHauskaAssetRegistry(
            IHauskaOrgContract(_v3030a8)._v9b2fda()
        );
        
        IERC20(_v0fa623).safeTransferFrom(_v204851, address(this), _v64292b._v2459dc);
        _fabb131(_vd6b1fa, _v204851, _v3030a8, _v64292b._v2459dc, _v64292b._v579233);
        
        
        uint256[] memory _v801b50 = new uint256[](_v64292b._vf13eb5.length);
        uint256 _v4f3b69 = _v64292b._v2459dc / _v64292b._vf13eb5.length; 
        
        for (uint _v042dc4 = 0; _v042dc4 < _v64292b._vf13eb5.length; _v042dc4++) {
            uint256 _v9d8e96 = _v64292b._vf13eb5[_v042dc4];
            require(!assetLicensedBy[_v3030a8][_v9d8e96][_v204851], "Already licensed _v05fac9 in _v64292b");
            VerifiedDigitalAsset memory _v05fac9 = registry._f57ca34(_v3030a8, _v9d8e96);
            require(_v05fac9._v9d8e96 > 0, "Asset does not exist");
            require(_v05fac9._v47da9d, "Asset not verified");
            require(_v05fac9._vc772a5, "Asset cannot be licensed");
            uint256 _v9863eb = ++_v748f0b;
            uint8 _v5e4fd4 = 0;
            for (uint _v5c2dd9 = 0; _v5c2dd9 < _v7e9272.length; _v5c2dd9++) {
                if (_v7e9272[_v5c2dd9] == LicensePermissions._v69bd4e) _v5e4fd4 |= 2;
                if (_v7e9272[_v5c2dd9] == LicensePermissions.Resell) _v5e4fd4 |= 1;
            }
            if (_v5e4fd4 == 0) _v5e4fd4 = 2; 
            
            _va39ea9[_v9863eb] = License({
                _v9d8e96: _v9d8e96,
                _v147f2a: _v05fac9._vca0dd8,
                _v204851: _v204851,
                _v9c15cd: _v4f3b69,
                _v09603a: _v09603a > 0 ? _v09603a : _v4f3b69,
                _v7e9272: _v5e4fd4,
                _v3030a8: _v3030a8,
                _vdf9c6b: 0, 
                _v20ed6b: true
            });
            assetLicensedBy[_v3030a8][_v9d8e96][_v204851] = true;
            userLicenses[_v3030a8][_v204851].push(_v9863eb);
            _v801b50[_v042dc4] = _v9863eb;
            
            emit _ecc66c6(_v3030a8, _v9863eb, _v9d8e96, _v204851, _v4f3b69);
        }
        
        emit _eb7fa8d(_v3030a8, _vd6b1fa, _v204851, _v801b50, _v64292b._v2459dc);
        
        return _v801b50;
    }
    
    function _f20838d(uint256 _v87c9ae, uint256 _vb0ad1d) external nonReentrant {
        License storage _v234571 = _va39ea9[_v87c9ae];
        require(_v234571._v204851 == msg.sender, "Not _v234571 _v579233");
        require(_v234571._v20ed6b, "License is not active");
        require(_v234571._vdf9c6b > 0, "Cannot renew perpetual _v234571");
        uint256 _v91832f = _v234571._v9c15cd;
        
        IERC20(_v0fa623).safeTransferFrom(msg.sender, address(this), _v91832f);
        _fabb131(_v234571._v9d8e96, msg.sender, _v234571._v3030a8, _v91832f, _v234571._v147f2a);
        
        if (_v234571._vdf9c6b < block.timestamp) {
            
            _v234571._vdf9c6b = block.timestamp + _vb0ad1d;
        } else {
            
            _v234571._vdf9c6b += _vb0ad1d;
        }
        emit _eab17a3(_v87c9ae, _v234571._vdf9c6b, _v91832f);
    }
    
    function _f8567c8(uint256 _v87c9ae) public view returns (bool) {
        License memory _v234571 = _va39ea9[_v87c9ae];
        if (!_v234571._v20ed6b) return false;
        if (_v234571._vdf9c6b == 0) return true; 
        return block.timestamp < _v234571._vdf9c6b;
    }
    
    function _f6715f1(uint256 _v87c9ae) external onlyRole(_c4f139c) {
        _va39ea9[_v87c9ae]._v20ed6b = false;
        emit _ee5e841(_v87c9ae);
    }
    
    event _eab17a3(uint256 indexed _v87c9ae, uint256 newExpiration, uint256 _v9c15cd);
    event _ee5e841(uint256 indexed _v87c9ae);
    mapping(address => CountryCode) public userLocations;
    mapping(address => bool) public hasUserLocation;
    
    function _f602501(address user, CountryCode _v6469ac) external onlyRole(_c4f139c) {
        userLocations[user] = _v6469ac;
        hasUserLocation[user] = true;
        emit _ee55843(user, _v6469ac);
    }
    
    event _ee55843(address indexed user, CountryCode _v6469ac);
    
    function _f35cd05(
        CountryCode[] memory restrictions,
        address _v204851
    ) private view {
        
        if (restrictions.length == 0) {
            return;
        }
        
        if (!hasUserLocation[_v204851]) {
            return;
        }
        
        CountryCode _v5facb7 = userLocations[_v204851];
    
        bool _v287220 = false;
        for (uint _v042dc4 = 0; _v042dc4 < restrictions.length; _v042dc4++) {
            if (restrictions[_v042dc4] == _v5facb7) {
                _v287220 = true;
                break;
            }
        }
        
        if (!_v287220) {
            revert("License not available in your geographic _v6469ac");
        }
    }
}