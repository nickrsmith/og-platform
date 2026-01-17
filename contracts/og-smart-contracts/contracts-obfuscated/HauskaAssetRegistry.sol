// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IHauskaStructs.sol";
import "./interfaces/IHauskaContracts.sol";
import "./HauskaAssetNFT.sol";

contract HauskaAssetRegistry is AccessControl, IHauskaStructs {
    bytes32 public constant _ca806f4 = keccak256("_ca806f4");
    bytes32 public constant _cc9dbe0 = keccak256("_cc9dbe0");
    bytes32 public constant _c15d343 = keccak256("_c15d343");
    
    HauskaAssetNFT public _vde4409;

    mapping(bytes32 => bool) public globalAssetHashExists;
    
    mapping(address => mapping(uint256 => VerifiedDigitalAsset)) public _f3685e3;
    mapping(address => uint256) public _fd190ab;
    mapping(address => mapping(address => uint256[])) public creatorAssets;

    mapping(address => mapping(uint256 => address)) public assetVerifiers;

    struct AssetIdentifier {
        address _v3030a8;
        uint256 _v9d8e96;
    }
    
    mapping(string => AssetIdentifier) public ipfsHashToAssetId;
    
    event _e4229de(
        address indexed _v3030a8,
        uint256 indexed _v9d8e96,
        address indexed _vca0dd8,
        bytes32 _vd4500a
    );
    
    event _ead6604(
        address indexed _v3030a8,
        uint256 indexed _v9d8e96,
        address indexed _ve15436
    );

    event _e2527ea(
        address indexed _v3030a8,
        uint256 indexed _v9d8e96
    );
    
    modifier _m225f92() {
        require(hasRole(_cc9dbe0, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_ca806f4, msg.sender);
    }
    
    function _f070edc(address _v9d7695) external onlyRole(_ca806f4) {
        require(_v9d7695 != address(0), "Invalid NFT contract address");
        _vde4409 = HauskaAssetNFT(_v9d7695);
    }
    
    function _fcbb231(address _v3030a8) external onlyRole(_ca806f4) {
        require(_v3030a8 != address(0), "Invalid _vd23b59 contract address");
        _grantRole(_cc9dbe0, _v3030a8);
    }
    
    function _f9083ea(address _v3030a8) external onlyRole(_ca806f4) {
        require(_v3030a8 != address(0), "Invalid _vd23b59 contract address");
        _revokeRole(_cc9dbe0, _v3030a8);
    }
    
    function _fcf0c01(
        VerifiedDigitalAsset memory _v05fac9,
        address _vca0dd8
    ) external _m225f92 returns (uint256) {
        require(!globalAssetHashExists[_v05fac9._vd4500a], "Asset hash already exists globally");
        require(
            ipfsHashToAssetId[_v05fac9._vc6ec61]._v3030a8 == address(0),
            "IPFS hash already exists globally"
        );
        
        address _v3030a8 = msg.sender;
        _fd190ab[_v3030a8]++;
        uint256 _v9d8e96 = _fd190ab[_v3030a8];
        
        _v05fac9._v9d8e96 = _v9d8e96;
        _f3685e3[_v3030a8][_v9d8e96] = _v05fac9;
        creatorAssets[_v3030a8][_vca0dd8].push(_v9d8e96);
        
        globalAssetHashExists[_v05fac9._vd4500a] = true;
        ipfsHashToAssetId[_v05fac9._vc6ec61] = AssetIdentifier(_v3030a8, _v9d8e96);
        
        if (address(_vde4409) != address(0)) {
            string memory tokenURI = string(abi.encodePacked("ipfs:", _v05fac9._vc6ec61));
            _vde4409._ff6c888(_v05fac9._v579233, _v3030a8, _v9d8e96, tokenURI);
        }
        
        emit _e4229de(_v3030a8, _v9d8e96, _vca0dd8, _v05fac9._vd4500a);
        
        return _v9d8e96;
    }
    
    function _f4a3d1f(
        address _v3030a8,
        uint256 _v9d8e96,
        address _ve15436
    ) external _m225f92 {
        require(_f3685e3[_v3030a8][_v9d8e96]._v9d8e96 != 0, "Asset does not exist");
        require(!_f3685e3[_v3030a8][_v9d8e96]._vd92342, "Cannot verify _vd92342 _f3685e3");
        require(!_f3685e3[_v3030a8][_v9d8e96]._v47da9d, "Asset already verified");
        
        _f3685e3[_v3030a8][_v9d8e96]._v47da9d = true;
        assetVerifiers[_v3030a8][_v9d8e96] = _ve15436;
        
        emit _ead6604(_v3030a8, _v9d8e96, _ve15436);
    }

    function _fd7a077(
        address _v3030a8,
        uint256 _v9d8e96
        ) external onlyRole(_ca806f4) {
        require(_f3685e3[_v3030a8][_v9d8e96]._v9d8e96 != 0, "Asset does not exist");
        require(_f3685e3[_v3030a8][_v9d8e96]._v47da9d, "Asset is not verified");

        _f3685e3[_v3030a8][_v9d8e96]._v47da9d = false;
        emit _e2527ea(_v3030a8, _v9d8e96);
    }
    
    function _f57ca34(
        address _v3030a8,
        uint256 _v9d8e96
    ) external view returns (VerifiedDigitalAsset memory) {
        VerifiedDigitalAsset memory _v05fac9 = _f3685e3[_v3030a8][_v9d8e96];
        (uint32 _v3d6202, uint32 _v3055c2) = IHauskaRevenueDistributor(IHauskaOrgContract(_v3030a8)._vedea5b())._f434c53(_v3030a8);
        _v05fac9._v2097c3 = _v05fac9._v2097c3 * (10000 + _v3d6202 + _v3055c2) / 10000;
        return _v05fac9;
    }
    
    function _f9b4d36(
        address _v3030a8,
        address _vca0dd8
    ) external view returns (uint256[] memory) {
        return creatorAssets[_v3030a8][_vca0dd8];
    }
    
    function _fc9b17f(
        address _v3030a8,
        uint256 _v9d8e96
    ) external view returns (bool) {
        return _f3685e3[_v3030a8][_v9d8e96]._v47da9d;
    }

    function _fcafa39(
        address _v3030a8,
        uint256 _v9d8e96,
        address newOwner,
        address caller
    ) external _m225f92 {
        VerifiedDigitalAsset storage _v05fac9 = _f3685e3[_v3030a8][_v9d8e96];
        require(_v05fac9._v9d8e96 != 0, "Asset does not exist");
        require(_v05fac9._v579233 == caller, "Only _v05fac9 _v579233 can transfer");
        require(newOwner != address(0), "New _v579233 cannot be zero address");

        if (address(_vde4409) != address(0) && _vde4409._fbfb963(_v3030a8, _v9d8e96)) {
            uint256 _va95b9f = _vde4409._f3d0e84(_v3030a8, _v9d8e96);
            require(_vde4409.ownerOf(_va95b9f) == caller, "Caller does not own the NFT");
        }
        _v05fac9._v579233 = newOwner;
        _v05fac9._v1b2e38 = block.timestamp;
    }
    
    function _fe0260c(
        address _v3030a8,
        uint256 _v9d8e96,
        string memory newIpfsHash,
        bytes32 newMetadataHash,
        uint256 newPrice,
        bool _vc772a5,
        address caller
    ) external _m225f92 {
        VerifiedDigitalAsset storage _v05fac9 = _f3685e3[_v3030a8][_v9d8e96];
        require(_v05fac9._v9d8e96 != 0, "Asset does not exist");
        require(_v05fac9._v579233 == caller || _v05fac9._vca0dd8 == caller, "Only _v579233 or _vca0dd8 can update");
        require(!_v05fac9._v47da9d, "Verified _v2097c3 locked");
        
        if (bytes(newIpfsHash).length > 0) {
            require(
                ipfsHashToAssetId[newIpfsHash]._v3030a8 == address(0),
                "IPFS hash already registered"
            );
            delete ipfsHashToAssetId[_v05fac9._vc6ec61];
            _v05fac9._vc6ec61 = newIpfsHash;
            ipfsHashToAssetId[newIpfsHash] = AssetIdentifier(_v3030a8, _v9d8e96);
        }
        
        if (newMetadataHash != bytes32(0)) {
            _v05fac9._vfd7108 = newMetadataHash;
        }
        
        if (newPrice > 0) {
            _v05fac9._v2097c3 = newPrice;
        }
        
        _v05fac9._vc772a5 = _vc772a5;
        _v05fac9._vc69227++;
        
        emit _ee982d8(_v3030a8, _v9d8e96, _v05fac9._vc69227, caller);
    }
    
    event _ee982d8(
        address indexed _v3030a8,
        uint256 indexed _v9d8e96,
        uint256 newVersion,
        address updatedBy
    );
    
    event _e460186(
        address indexed fromOrg,
        address indexed toOrg,
        uint256 indexed _v9d8e96,
        uint256 _v0366cb,
        address transferredBy
    );

    function _f938eee(
        address fromOrg,
        address toOrg,
        uint256 _v9d8e96,
        address curOwner,
        address newOwner
    ) external _m225f92 returns (uint256 _v0366cb) {
        require(hasRole(_cc9dbe0, fromOrg), "Source _vd23b59 not authorized");
        require(hasRole(_cc9dbe0, toOrg), "Destination _vd23b59 not authorized");
        require(fromOrg != toOrg, "Cannot transfer to same _vd23b59");
        require(newOwner != address(0), "Invalid new _v579233");
        
        VerifiedDigitalAsset storage _v806a72 = _f3685e3[fromOrg][_v9d8e96];
        require(_v806a72._v9d8e96 > 0, "Asset does not exist");
        require(
            IHauskaOrgContract(fromOrg).hasRole(keccak256("_c1522a0"), curOwner),
            "Only _v35a34c can transfer cross-_vd23b59"
        );
        
        _v0366cb = _fd190ab[toOrg] + 1;
        _fd190ab[toOrg] = _v0366cb;
        
        VerifiedDigitalAsset storage _vd5c3e4 = _f3685e3[toOrg][_v0366cb];
        _vd5c3e4._v9d8e96 = _v0366cb;
        _vd5c3e4._vca0dd8 = _v806a72._vca0dd8; 
        _vd5c3e4._v579233 = newOwner; 
        _vd5c3e4._v3624db = IHauskaOrgContract(toOrg)._vbd9641();
        _vd5c3e4._vc6ec61 = _v806a72._vc6ec61;
        _vd5c3e4._vfd7108 = _v806a72._vfd7108;
        _vd5c3e4._vd4500a = _v806a72._vd4500a;
        _vd5c3e4._vc69227 = 1; 
        _vd5c3e4._v47da9d = false; 
        _vd5c3e4._vb1ba65 = block.timestamp;
        _vd5c3e4._v1b2e38 = block.timestamp;
        _vd5c3e4._v2097c3 = _v806a72._v2097c3;
        _vd5c3e4._vd92342 = _v806a72._vd92342;
        _vd5c3e4._vc772a5 = _v806a72._vc772a5;
        _vd5c3e4._v7c582f = _v806a72._v7c582f;
        _vd5c3e4._vcab70c = _v806a72._vcab70c;
        
        if (address(_vde4409) != address(0)) {
            string memory tokenURI = string(abi.encodePacked("ipfs://", _vd5c3e4._vfd7108));
            _vde4409._ff6c888(newOwner, toOrg, _v0366cb, tokenURI);

            delete _f3685e3[fromOrg][_v9d8e96];
            uint256 _vee9f38 = _fd190ab[fromOrg] - 1;
            _fd190ab[fromOrg] = _vee9f38;

            for(uint256 _v042dc4 = _v9d8e96 ; _v042dc4 <= _vee9f38; _v042dc4++)
            {
                _f3685e3[fromOrg][_v042dc4] = _f3685e3[fromOrg][_v042dc4 + 1];
            }
        }
        
        emit _e4229de(toOrg, _v0366cb, newOwner, _vd5c3e4._vd4500a);
        emit _e460186(fromOrg, toOrg, _v9d8e96, _v0366cb, curOwner);
        
        return _v0366cb;
    }
    
    function _f49b5a2(address _v3030a8) external view returns (uint256) {
        return _fd190ab[_v3030a8];
    }

    function _v794de2() external view returns (address) {
        return address(_vde4409);
    }

    function _f490f18(string memory _vc6ec61) external view returns (bool) {
        return ipfsHashToAssetId[_vc6ec61]._v9d8e96 > 0;
    }
}