// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IEmpressaStructs.sol";

interface IEmpressaLicenseMetadata {
    function tokenURI(uint256 _va95b9f) external view returns (string memory);
}

contract EmpressaLicenseNFT is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, Pausable {
    using Counters for Counters.Counter;

    bytes32 public constant _c46ff91 = keccak256("_c46ff91");
    bytes32 public constant _c169ad4 = keccak256("_c169ad4");

    Counters.Counter private _v127580;
    address public _v555cb8;

    struct LicenseData {
        uint256 _v9d8e96;
        address _v3030a8;
        address _v156506;
        uint256 _v6914b0;
        uint256 _vdf9c6b; 
        uint8 _v7e9272; 
        uint256 _v09603a;
        bool _v20ed6b;
    }

    mapping(uint256 => LicenseData) public licenseData;
    mapping(address => mapping(uint256 => mapping(address => bool))) public hasLicense; 
    mapping(address => mapping(uint256 => mapping(address => uint256))) public userLicenseToken;
    
    event _e3df3ea(
        uint256 indexed _va95b9f,
        address indexed _v3030a8,
        uint256 indexed _v9d8e96,
        address _v204851,
        uint256 _vdf9c6b
    );
    
    event _e09b1d3(
        uint256 indexed _va95b9f,
        address indexed from,
        address indexed to,
        uint256 _v9d8e96
    );
    
    event _ee5e841(uint256 indexed _va95b9f);
    event _ed69c56(uint256 indexed _va95b9f);

    constructor() ERC721("Empressa License", "HLICENSE") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_c46ff91, msg.sender);
        _grantRole(_c169ad4, msg.sender);
    }

    function _f7db097(address _metadataContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_metadataContract != address(0), "Invalid metadata contract");
        _v555cb8 = _metadataContract;
    }
    
    function _fd9a1eb(
        address to,
        address _v3030a8,
        uint256 _v9d8e96,
        address _vca0dd8,
        uint8 _v7e9272,
        uint256 _v09603a,
        uint256 duration
    ) public onlyRole(_c46ff91) whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot _f16d0d8 to zero address");
        require(_v3030a8 != address(0), "Invalid _vd23b59 contract");
        require(!hasLicense[_v3030a8][_v9d8e96][to], "User already has _v234571");

        uint256 _va95b9f = _v127580.current();
        _v127580.increment();
        
        _safeMint(to, _va95b9f);
        
        uint256 _vdf9c6b = duration > 0 ? block.timestamp + duration : 0;
        
        licenseData[_va95b9f] = LicenseData({
            _v9d8e96: _v9d8e96,
            _v3030a8: _v3030a8,
            _v156506: _vca0dd8,
            _v6914b0: block.timestamp,
            _vdf9c6b: _vdf9c6b,
            _v7e9272: _v7e9272,
            _v09603a: _v09603a,
            _v20ed6b: true
        });
        
        hasLicense[_v3030a8][_v9d8e96][to] = true;
        userLicenseToken[_v3030a8][_v9d8e96][to] = _va95b9f;
        
        emit _e3df3ea(_va95b9f, _v3030a8, _v9d8e96, to, _vdf9c6b);
        
        return _va95b9f;
    }

    
    function _f2325d8(uint256 _va95b9f, string memory _v2c6d68) 
        public 
        onlyRole(_c46ff91) 
    {
        require(_exists(_va95b9f), "License does not exist");
        _setTokenURI(_va95b9f, _v2c6d68);
    }

    
    function _f6715f1(uint256 _va95b9f) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(_va95b9f), "License does not exist");
        
        LicenseData storage _v234571 = licenseData[_va95b9f];
        _v234571._v20ed6b = false;
        
        address _v579233 = ownerOf(_va95b9f);
        hasLicense[_v234571._v3030a8][_v234571._v9d8e96][_v579233] = false;
        delete userLicenseToken[_v234571._v3030a8][_v234571._v9d8e96][_v579233];
        
        emit _ee5e841(_va95b9f);
    }

    
    function _f8567c8(uint256 _va95b9f) public view returns (bool) {
        if (!_exists(_va95b9f)) return false;
        
        LicenseData memory _v234571 = licenseData[_va95b9f];
        
        if (!_v234571._v20ed6b) return false;
        if (_v234571._vdf9c6b > 0 && block.timestamp > _v234571._vdf9c6b) return false;
        
        return true;
    }

    
    function _f58db77(address _v3030a8, uint256 _v9d8e96, address user) 
        public 
        view 
        returns (bool) 
    {
        if (!hasLicense[_v3030a8][_v9d8e96][user]) return false;
        
        uint256 _va95b9f = userLicenseToken[_v3030a8][_v9d8e96][user];
        return _f8567c8(_va95b9f);
    }

    
    function _fa97764(uint256 _va95b9f) 
        public 
        view 
        returns (LicenseData memory) 
    {
        require(_exists(_va95b9f), "License does not exist");
        return licenseData[_va95b9f];
    }

    
    function _fb89493(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 _v8dfa30 = balanceOf(user);
        uint256[] memory _va39ea9 = new uint256[](_v8dfa30);
        
        for (uint256 _v042dc4 = 0; _v042dc4 < _v8dfa30; _v042dc4++) {
            _va39ea9[_v042dc4] = tokenOfOwnerByIndex(user, _v042dc4);
        }
        
        return _va39ea9;
    }

    
    function pause() public onlyRole(_c169ad4) {
        _pause();
    }

    
    function unpause() public onlyRole(_c169ad4) {
        _unpause();
    }

    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 _va95b9f,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, _va95b9f, batchSize);
        
        
        if (from != address(0) && to != address(0)) {
            LicenseData memory _v234571 = licenseData[_va95b9f];
            
            
            hasLicense[_v234571._v3030a8][_v234571._v9d8e96][from] = false;
            delete userLicenseToken[_v234571._v3030a8][_v234571._v9d8e96][from];
            
            
            hasLicense[_v234571._v3030a8][_v234571._v9d8e96][to] = true;
            userLicenseToken[_v234571._v3030a8][_v234571._v9d8e96][to] = _va95b9f;
            
            emit _e09b1d3(_va95b9f, from, to, _v234571._v9d8e96);
        }
    }

    function _burn(uint256 _va95b9f) internal override(ERC721, ERC721URIStorage) {
        super._burn(_va95b9f);
        
        
        LicenseData memory _v234571 = licenseData[_va95b9f];
        address _v579233 = ownerOf(_va95b9f);


        hasLicense[_v234571._v3030a8][_v234571._v9d8e96][_v579233] = false;
        delete userLicenseToken[_v234571._v3030a8][_v234571._v9d8e96][_v579233];
        delete licenseData[_va95b9f];
    }

    function tokenURI(uint256 _va95b9f)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        require(_exists(_va95b9f), "Token does not exist");
        
        if (_v555cb8 != address(0)) {
            try IEmpressaLicenseMetadata(_v555cb8).tokenURI(_va95b9f) returns (string memory _v2c6d68) {
                return _v2c6d68;
            } catch {
                
            }
        }
        
        return super.tokenURI(_va95b9f);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}