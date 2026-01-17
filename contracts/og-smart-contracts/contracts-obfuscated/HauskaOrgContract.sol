// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";

contract EmpressaOrgContract is AccessControl, IEmpressaStructs {
    
    bytes32 public constant _c1522a0 = keccak256("_c1522a0");
    bytes32 public constant _c887dee = keccak256("_c887dee");
    bytes32 public constant _cca4bd5 = keccak256("_cca4bd5");
    
    address public immutable _v7b202d;
    address public immutable _v35a34c;
    address public _vbd9641;
    
    
    address public _vd0b565;
    address public _v9b2fda;
    address public _v45f631;
    address public _vedea5b;
    
    address[] public _v1f9442;
    mapping(address => bool) public isCreator;
    
    event _e5ea922(address indexed _vca0dd8);
    event _e46e9e1(address indexed _vca0dd8);
    event _eb127ea(string moduleName, address moduleAddress);
    event _e52407c(uint256 indexed _v9d8e96, address indexed from, address indexed to);
    event _e460186(uint256 indexed _v9d8e96, address indexed toOrg, uint256 indexed _v0366cb, address newOwner);
    event _e61adce(uint256 oldAssetId, uint256 _v0366cb, bool burned);
    
    modifier _mc67bac() {
        require(
            hasRole(_c1522a0, msg.sender) || 
            IAccessControl(_v7b202d).hasRole(0x0000000000000000000000000000000000000000000000000000000000000000, msg.sender) ||
            msg.sender == _v7b202d, 
            "Caller is not _v35a34c or _vd033e2"
        );
        _;
    }
    
    modifier _m3d894e() {
        require(hasRole(_c887dee, msg.sender), "Caller is not a _vca0dd8");
        _;
    }
    
    modifier _m191797() {
        require(hasRole(_cca4bd5, msg.sender), "Caller is not a _ve15436");
        _;
    }
    
    constructor(
        address _factory,
        address _principal,
        address _integrationPartner
    ) {
        require(_factory != address(0), "Factory cannot be zero address");
        require(_principal != address(0), "Principal cannot be zero address");
        
        _v7b202d = _factory;
        _v35a34c = _principal;
        _vbd9641 = _integrationPartner;
        
        _grantRole(DEFAULT_ADMIN_ROLE, _principal);
        _grantRole(_c1522a0, _principal);
        _grantRole(_c887dee, _principal);
        _grantRole(_cca4bd5, _principal);
        
        _v1f9442.push(_principal);
        isCreator[_principal] = true;
    }
    
    function _fbb393f(address _licenseManager) external _mc67bac {
        require(_licenseManager != address(0), "License manager cannot be zero address");
        _vd0b565 = _licenseManager;
        emit _eb127ea("LicenseManager", _licenseManager);
    }
    
    function _f56a5d5(address _assetRegistry) external _mc67bac {
        require(_assetRegistry != address(0), "Asset registry cannot be zero address");
        _v9b2fda = _assetRegistry;
        emit _eb127ea("AssetRegistry", _assetRegistry);
    }
    
    function _feb75e6(address _groupManager) external _mc67bac {
        require(_groupManager != address(0), "Group manager cannot be zero address");
        _v45f631 = _groupManager;
        emit _eb127ea("GroupManager", _groupManager);
    }
    
    function _f666724(address _revenueDistributor) external _mc67bac {
        require(_revenueDistributor != address(0), "Revenue distributor cannot be zero address");
        _vedea5b = _revenueDistributor;
        emit _eb127ea("RevenueDistributor", _revenueDistributor);
    }
    
    function _f3fc77c(address _vca0dd8) external _mc67bac {
        require(_vca0dd8 != address(0), "Creator cannot be null address");
        require(!isCreator[_vca0dd8], "Creator already exists");
        
        _grantRole(_c887dee, _vca0dd8);
        _grantRole(_cca4bd5, _vca0dd8);
        _v1f9442.push(_vca0dd8);
        isCreator[_vca0dd8] = true;
        
        emit _e5ea922(_vca0dd8);
    }
    
    function _f5739ef(address _vca0dd8) external _mc67bac {
        require(_vca0dd8 != address(0), "Creator cannot be null address");
        require(isCreator[_vca0dd8], "Creator does not exist");
        require(_vca0dd8 != _v35a34c, "Cannot remove _v35a34c");
        
        _revokeRole(_c887dee, _vca0dd8);
        _revokeRole(_cca4bd5, _vca0dd8);
        isCreator[_vca0dd8] = false;
        
        for (uint256 _v042dc4 = 0; _v042dc4 < _v1f9442.length; _v042dc4++) {
            if (_v1f9442[_v042dc4] == _vca0dd8) {
                _v1f9442[_v042dc4] = _v1f9442[_v1f9442.length - 1];
                _v1f9442.pop();
                break;
            }
        }
        
        emit _e46e9e1(_vca0dd8);
    }
    
    function _f0e0147(
        string memory assetCID,
        bytes32 _vfd7108,
        bytes32 _vd4500a,
        uint256 _v2097c3,
        bool isEncrypted,
        bool _vc772a5,
        FxPool _v7c582f,
        string memory timeStamp,
        CountryCode[] memory geoRestrictions
    ) external _m3d894e returns (uint256) {
        require(_v9b2fda != address(0), "Asset registry not set");
        require(bytes(assetCID).length > 0, "Asset CID cannot be empty");
        require(_vd4500a != bytes32(0), "Asset hash cannot be zero");
        require(_vfd7108 != bytes32(0), "Metadata hash cannot be zero");

        VerifiedDigitalAsset memory _vd5c3e4 = VerifiedDigitalAsset({
            _v9d8e96: 0, 
            _vca0dd8: msg.sender,
            _v579233: msg.sender,
            _v3624db: _vbd9641,
            _vc6ec61: assetCID,
            _vfd7108: _vfd7108, 
            _vd4500a: _vd4500a,
            _vc69227: 1,
            _v47da9d: false,
            _vb1ba65: block.timestamp,
            _v1b2e38: 0,
            _v2097c3: _v2097c3, 
            _vd92342: isEncrypted,
            _vc772a5: _vc772a5,
            _v7c582f: _v7c582f,
            _vcab70c: timeStamp,
            _v0c96e3: geoRestrictions
        });
        
        uint256 _v9d8e96 = IEmpressaAssetRegistry(_v9b2fda)._fcf0c01(_vd5c3e4, msg.sender);
        
        return _v9d8e96;
    }
    
    
    function _f5ad36e(uint256 _v4278d0) public view returns (uint256) {
        (uint32 _v3055c2, uint32 _v3d6202) = IEmpressaContractFactory(_v7b202d)._f6ede20();
        uint256 _v2bfbf4 = uint256(_v3055c2) + uint256(_v3d6202);
        uint256 _v9640b5 = _v4278d0 * 10000 / (10000 + _v2bfbf4);
        
        return _v9640b5;
    }
    
    
    function _f536eb4(uint256 _v9640b5) public view returns (uint256) {
        (uint32 _v3055c2, uint32 _v3d6202) = IEmpressaContractFactory(_v7b202d)._f6ede20();
        uint256 _v2bfbf4 = uint256(_v3055c2) + uint256(_v3d6202);
        uint256 _v4278d0 = _v9640b5 * (10000 + _v2bfbf4) / 10000;
        
        return _v4278d0;
    }
    
    function _fd91d6d(uint256 _v9d8e96) external view returns (string memory assetCID, bytes32 metadataCID) {
        require(_v9b2fda != address(0), "Asset registry not set");
        require(
            hasRole(_c1522a0, msg.sender) ||
            hasRole(_cca4bd5, msg.sender) ||
            IAccessControl(_v7b202d).hasRole(0x0000000000000000000000000000000000000000000000000000000000000000, msg.sender),
            "Unauthorized access"
        );
        
        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);
        return (_v05fac9._vc6ec61, _v05fac9._vfd7108);
    }
    
    function _f4a3d1f(uint256 _v9d8e96) external _m191797 {
        require(_v9b2fda != address(0), "Asset registry not set");
        IEmpressaAssetRegistry(_v9b2fda)._f4a3d1f(address(this), _v9d8e96, msg.sender);
    }

    function _fd7a077(uint256 _v9d8e96) external _mc67bac {
        require(_v9b2fda != address(0), "Asset registry not set");
        IEmpressaAssetRegistry(_v9b2fda)._fd7a077(address(this), _v9d8e96);
    }
    
    function _ff1bf61(
        string memory groupName,
        uint256[] memory groupAssets,
        uint256 _v2459dc
    ) external _m3d894e returns (uint256) {
        require(_v45f631 != address(0), "Group manager not set");
        require(groupAssets.length > 0, "Group must have assets");
        require(_v2459dc > 0, "Group price must be greater than 0");
        require(_f07ee68(msg.sender), "Caller is not a member of the organization");

        return IEmpressaGroupManager(_v45f631)._ff1bf61(
            groupName,
            groupAssets,
            _v2459dc,
            msg.sender
        );
    }

    function _faeb40b(uint256 _vd6b1fa) external _m3d894e {
        require(_v45f631 != address(0), "Group manager not set");

        IEmpressaGroupManager(_v45f631)._faeb40b(_vd6b1fa, msg.sender);
    }
    
    function _f2df134(
        uint256 _v9d8e96,
        LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256) {
        require(_vd0b565 != address(0), "License manager not set");
        require(_v9b2fda != address(0), "Asset registry not set");

        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);
        require(_v05fac9._v9d8e96 > 0, "Invalid _v05fac9 ID");

        return IEmpressaLicenseManager(_vd0b565)._f2df134(
            address(this),
            _v9d8e96,
            msg.sender,
            _v7e9272,
            _v09603a
        );
    }
    
    function _fbcc39b(
        uint256 _vd6b1fa,
        LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256[] memory) {
        require(_vd0b565 != address(0), "License manager not set");
        require(_v45f631 != address(0), "Group manager not set");

        AssetGroup memory _v64292b = IEmpressaGroupManager(_v45f631)._f624914(address(this), _vd6b1fa);
        require(_v64292b._vd6b1fa > 0, "Invalid _v64292b ID");

        return IEmpressaLicenseManager(_vd0b565)._fbcc39b(
            address(this),
            _vd6b1fa,
            msg.sender,
            _v7e9272,
            _v09603a
        );
    }
    
    
    function _f3685e3(uint256 _v9d8e96) external view returns (
        uint256, address, address, address, string memory, bytes32,
        bytes32, uint256, bool, uint256, uint256, uint256, bool, bool,
        FxPool, string memory
    ) {
        require(_v9b2fda != address(0), "Asset registry not set");
        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);

        return (
            _v05fac9._v9d8e96,
            _v05fac9._vca0dd8,
            _v05fac9._v579233,
            _v05fac9._v3624db,
            _v05fac9._vc6ec61,
            _v05fac9._vfd7108,
            _v05fac9._vd4500a,
            _v05fac9._vc69227,
            _v05fac9._v47da9d,
            _v05fac9._vb1ba65,
            _v05fac9._v1b2e38,
            _v05fac9._v2097c3,
            _v05fac9._vd92342,
            _v05fac9._vc772a5,
            _v05fac9._v7c582f,
            _v05fac9._vcab70c
        );
    }
    
    function _fb32b66(uint256 _v9d8e96) external view returns (bool) {
        require(_v9b2fda != address(0), "Asset registry not set");
        try IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96) returns (VerifiedDigitalAsset memory _v05fac9) {
            return _v05fac9._v9d8e96 != 0;
        } catch {
            return false;
        }
    }
    
    function _f49b5a2() external view returns (uint256) {
        require(_v9b2fda != address(0), "Asset registry not set");
        return IEmpressaAssetRegistry(_v9b2fda)._fd190ab(address(this));
    }
    
    function _f0d6aeb(uint256 _v9d8e96, address newOwner) external {
        require(_v9b2fda != address(0), "Asset registry not set");
        require(newOwner != address(0), "Invalid new _v579233");

        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);
        require(_v05fac9._v579233 == msg.sender, "Only _v05fac9 _v579233 can transfer");

        
        require(_f07ee68(newOwner), "New _v579233 must be a member of the organization");

        if (_v45f631 != address(0)) {
            IEmpressaGroupManager(_v45f631)._f8c7d3e(address(this), _v9d8e96);
        }

        address _v794de2 = IEmpressaAssetRegistry(_v9b2fda)._v794de2();
        if (_v794de2 != address(0)) {
            IEmpressaAssetNFT _vde4409 = IEmpressaAssetNFT(_v794de2);

            if (_vde4409._fbfb963(address(this), _v9d8e96)) {
                uint256 _va95b9f = _vde4409._f3d0e84(address(this), _v9d8e96);
                address _v0be580 = _vde4409.ownerOf(_va95b9f);

                require(_v0be580 == msg.sender, "Caller is not token _v579233");
                require(
                    _vde4409.getApproved(_va95b9f) == address(this) ||
                    _vde4409.isApprovedForAll(_v0be580, address(this)),
                    "Contract not approved to transfer token"
                );

                IEmpressaAssetRegistry(_v9b2fda)._fcafa39(address(this), _v9d8e96, newOwner, msg.sender);
                _vde4409.safeTransferFrom(_v0be580, newOwner, _va95b9f);
            }
            else {
                revert("Asset does not have an NFT");
            }
        }
        else {
            revert("_v794de2 does not set");
        }
    }
    
    function _f938eee(
        uint256 _v9d8e96, 
        address toOrg, 
        address newOwner
    ) external onlyRole(_c1522a0) returns (uint256) {
        require(_v9b2fda != address(0), "Asset registry not set");
        require(toOrg != address(0) && toOrg != address(this), "Invalid destination _vd23b59");
        require(newOwner != address(0), "Invalid new _v579233");

        require(
            IEmpressaContractFactory(_v7b202d)._f4e55c4(toOrg),
            "Destination is not a valid _vd23b59 contract"
        );
        require(
            IEmpressaOrgContract(toOrg)._f07ee68(newOwner),
            "New _v579233 must be a member of the destination organization"
        );

        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);
        require(_v05fac9._v579233 == msg.sender, "Only _v05fac9 _v579233 can transfer");

        // Remove asset from all groups before transferring cross-org
        if (_v45f631 != address(0)) {
            IEmpressaGroupManager(_v45f631)._f8c7d3e(address(this), _v9d8e96);
        }

        uint256 _v0366cb = IEmpressaAssetRegistry(_v9b2fda)._f938eee(
            address(this),
            toOrg,
            _v9d8e96,
            msg.sender,
            newOwner
        );

        address _v794de2 = IEmpressaAssetRegistry(_v9b2fda)._v794de2();
        bool _v2383ce = false;

        if (_v794de2 != address(0)) {
            IEmpressaAssetNFT _vde4409 = IEmpressaAssetNFT(_v794de2);
            if (_vde4409._fbfb963(address(this), _v9d8e96)) {
                uint256 _va95b9f = _vde4409._f3d0e84(address(this), _v9d8e96);
                address _v0be580 = _vde4409.ownerOf(_va95b9f);

                require(_v0be580 == msg.sender, "Caller is not token _v579233");
                require(
                    _vde4409.getApproved(_va95b9f) == address(this) ||
                    _vde4409.isApprovedForAll(_v0be580, address(this)),
                    "Contract not approved to transfer token"
                );

                _vde4409.burn(_va95b9f);
                _v2383ce = true;
            }
        }

        if (_v45f631 != address(0)) {
            IEmpressaGroupManager(_v45f631)._f29547b(address(this), _v9d8e96);
        }

        emit _e460186(_v9d8e96, toOrg, _v0366cb, newOwner);
        emit _e61adce(_v9d8e96, _v0366cb, _v2383ce);

        return _v0366cb;
    }
    
    
    function _f2764f3() external view returns (address) {
        require(_vd0b565 != address(0), "License manager not set");
        return IEmpressaLicenseManager(_vd0b565)._v0fa623();
    }
    
    
    function _fa55f6f(uint256 _v9d8e96) external view returns (address spender, uint256 _v9cb6ff) {
        require(_vd0b565 != address(0), "License manager not set");
        require(_v9b2fda != address(0), "Asset registry not set");
        
        VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v9d8e96);
        require(_v05fac9._v9d8e96 > 0, "Invalid _v05fac9 ID");
        
        return (_vd0b565, _v05fac9._v2097c3);
    }
    
    
    function _f05d0ee(uint256 _vd6b1fa) external view returns (address spender, uint256 _v9cb6ff) {
        require(_vd0b565 != address(0), "License manager not set");
        require(_v45f631 != address(0), "Group manager not set");
        
        AssetGroup memory _v64292b = IEmpressaGroupManager(_v45f631)._f624914(address(this), _vd6b1fa);
        require(_v64292b._vd6b1fa > 0, "Invalid _v64292b ID");
        
        return (_vd0b565, _v64292b._v2459dc);
    }

    function _fb03f4d() external view returns (uint256) {
        return _v1f9442.length;
    }

    function _f8a9b2c() external view returns (address[] memory) {
        return _v1f9442;
    }

    function _fbd9641() external view returns (address) {
        return _vbd9641;
    }
    
    function _f8fe555(address _v579233) external view returns (uint256[] memory) {
        require(_v9b2fda != address(0), "Asset registry not set");
        
        uint256 _v9863e5 = IEmpressaAssetRegistry(_v9b2fda)._f49b5a2(address(this));
        uint256[] memory _v1429a1 = new uint256[](_v9863e5);
        uint256 _v0f03cc = 0;
        
        for (uint256 _v042dc4 = 1; _v042dc4 <= _v9863e5; _v042dc4++) {
            VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v042dc4);
            if (_v05fac9._v579233 == _v579233) {
                _v1429a1[_v0f03cc] = _v042dc4;
                _v0f03cc++;
            }
        }
        
        uint256[] memory _v37a530 = new uint256[](_v0f03cc);
        for (uint256 _v042dc4 = 0; _v042dc4 < _v0f03cc; _v042dc4++) {
            _v37a530[_v042dc4] = _v1429a1[_v042dc4];
        }
        
        return _v37a530;
    }
    
    function _f5bfb36(address _v579233) external view returns (uint256[] memory) {
        require(_v45f631 != address(0), "Group manager not set");
        
        uint256 _ve7b3b4 = IEmpressaGroupManager(_v45f631)._f496efd(address(this));
        uint256[] memory _v97a2b0 = new uint256[](_ve7b3b4);
        uint256 _v0f03cc = 0;
        
        for (uint256 _v042dc4 = 1; _v042dc4 <= _ve7b3b4; _v042dc4++) {
            AssetGroup memory _v64292b = IEmpressaGroupManager(_v45f631)._f624914(address(this), _v042dc4);
            
            
            bool _v3fb75b = true;
            for (uint256 _v5c2dd9 = 0; _v5c2dd9 < _v64292b._vf13eb5.length; _v5c2dd9++) {
                VerifiedDigitalAsset memory _v05fac9 = IEmpressaAssetRegistry(_v9b2fda)._f57ca34(address(this), _v64292b._vf13eb5[_v5c2dd9]);
                if (_v05fac9._v579233 != _v579233) {
                    _v3fb75b = false;
                    break;
                }
            }
            
            if (_v3fb75b && _v64292b._vf13eb5.length > 0) {
                _v97a2b0[_v0f03cc] = _v042dc4;
                _v0f03cc++;
            }
        }
        
        uint256[] memory _v37a530 = new uint256[](_v0f03cc);
        for (uint256 _v042dc4 = 0; _v042dc4 < _v0f03cc; _v042dc4++) {
            _v37a530[_v042dc4] = _v97a2b0[_v042dc4];
        }
        
        return _v37a530;
    }
    
    function _f07ee68(address _vca2072) public view returns (bool) {
        
        return hasRole(_c1522a0, _vca2072) ||
               hasRole(_c887dee, _vca2072) ||
               hasRole(_cca4bd5, _vca2072) ||
               isCreator[_vca2072]; 
    }

}