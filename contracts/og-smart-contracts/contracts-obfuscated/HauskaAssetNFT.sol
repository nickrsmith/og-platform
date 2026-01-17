// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IHauskaStructs.sol";


contract HauskaAssetNFT is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant _c46ff91 = keccak256("_c46ff91");
    bytes32 public constant _c1f68ca = keccak256("_c1f68ca");

    Counters.Counter private _v127580;
    
    mapping(address => mapping(uint256 => uint256)) public assetToTokenId;
    mapping(uint256 => address) public tokenToOrgContract;
    mapping(uint256 => uint256) public tokenToAssetId;

    event _e37dc18(
        address indexed _v3030a8,
        uint256 indexed _v9d8e96,
        uint256 indexed _va95b9f,
        address _v579233
    );

    event _e58e620(
        uint256 indexed _va95b9f,
        address indexed from,
        address indexed to
    );

    constructor() ERC721("Hauska Asset", "HAUSK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_c46ff91, msg.sender);
    }

    function _ff6c888(
        address to,
        address _v3030a8,
        uint256 _v9d8e96,
        string memory _v2c6d68
    ) external onlyRole(_c46ff91) returns (uint256) {
        require(to != address(0), "Cannot _f16d0d8 to zero address");
        require(_v3030a8 != address(0), "Invalid _vd23b59 contract");
        require(assetToTokenId[_v3030a8][_v9d8e96] == 0, "NFT already exists for this _v05fac9");

        _v127580.increment();
        uint256 _va95b9f = _v127580.current();

        _safeMint(to, _va95b9f);
        _setTokenURI(_va95b9f, _v2c6d68);

        assetToTokenId[_v3030a8][_v9d8e96] = _va95b9f;
        tokenToOrgContract[_va95b9f] = _v3030a8;
        tokenToAssetId[_va95b9f] = _v9d8e96;

        emit _e37dc18(_v3030a8, _v9d8e96, _va95b9f, to);

        return _va95b9f;
    }

    function _fb15054(uint256 _va95b9f, string memory _v2c6d68) 
        external 
        onlyRole(_c1f68ca) 
    {
        require(_exists(_va95b9f), "Token does not exist");
        _setTokenURI(_va95b9f, _v2c6d68);
    }
    
    function _f3d0e84(address _v3030a8, uint256 _v9d8e96) 
        external 
        view 
        returns (uint256) 
    {
        return assetToTokenId[_v3030a8][_v9d8e96];
    }

    function _fbfb963(address _v3030a8, uint256 _v9d8e96) 
        external 
        view 
        returns (bool) 
    {
        return assetToTokenId[_v3030a8][_v9d8e96] != 0;
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 _va95b9f,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, _va95b9f, batchSize);
        
        if (from != address(0) && to != address(0)) {
            emit _e58e620(_va95b9f, from, to);
        }
    }
    
    function _burn(uint256 _va95b9f) internal override(ERC721, ERC721URIStorage) {
        super._burn(_va95b9f);
        
        address _v3030a8 = tokenToOrgContract[_va95b9f];
        uint256 _v9d8e96 = tokenToAssetId[_va95b9f];
        
        delete assetToTokenId[_v3030a8][_v9d8e96];
        delete tokenToOrgContract[_va95b9f];
        delete tokenToAssetId[_va95b9f];
        do 
        {
            assetToTokenId[_v3030a8][_v9d8e96] = assetToTokenId[_v3030a8][_v9d8e96 + 1];
            uint256 _vb7a502 = assetToTokenId[_v3030a8][_v9d8e96];
            tokenToOrgContract[_vb7a502] = _v3030a8;
            tokenToAssetId[_vb7a502] = _v9d8e96;
            _v9d8e96++;
        } while (assetToTokenId[_v3030a8][_v9d8e96] > 0);
    }

    function tokenURI(uint256 _va95b9f)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(_va95b9f);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _f36533a(address _v9b2fda) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(_c1f68ca, _v9b2fda);
    }
    
    function _ffab3e0(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(_c46ff91, minter);
    }
}