// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IEmpressaStructs.sol";

/**
 * @title EmpressaAssetNFT
 * @dev NFT contract for representing asset ownership in the Empressa ecosystem
 */
contract EmpressaAssetNFT is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ASSET_REGISTRY_ROLE = keccak256("ASSET_REGISTRY_ROLE");

    Counters.Counter private _tokenIdCounter;
    
    // Mapping from organization contract => asset ID => token ID
    mapping(address => mapping(uint256 => uint256)) public assetToTokenId;
    
    // Mapping from token ID => organization contract
    mapping(uint256 => address) public tokenToOrgContract;
    
    // Mapping from token ID => asset ID
    mapping(uint256 => uint256) public tokenToAssetId;

    event AssetNFTMinted(
        address indexed orgContract,
        uint256 indexed assetId,
        uint256 indexed tokenId,
        address owner
    );

    event AssetNFTTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );

    constructor() ERC721("Empressa Asset", "HAUSK") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    /**
     * @dev Mint a new NFT for an asset
     * @param to The address that will own the NFT
     * @param orgContract The organization contract address
     * @param assetId The asset ID in the organization
     * @param uri The metadata URI for the NFT
     * @return tokenId The ID of the minted NFT
     */
    function mintAssetNFT(
        address to,
        address orgContract,
        uint256 assetId,
        string memory uri
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(orgContract != address(0), "Invalid org contract");
        require(assetToTokenId[orgContract][assetId] == 0, "NFT already exists for this asset");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Store mappings
        assetToTokenId[orgContract][assetId] = tokenId;
        tokenToOrgContract[tokenId] = orgContract;
        tokenToAssetId[tokenId] = assetId;

        emit AssetNFTMinted(orgContract, assetId, tokenId, to);

        return tokenId;
    }

    /**
     * @dev Update the token URI
     * @param tokenId The token ID
     * @param uri The new metadata URI
     */
    function updateTokenURI(uint256 tokenId, string memory uri) 
        external 
        onlyRole(ASSET_REGISTRY_ROLE) 
    {
        require(_exists(tokenId), "Token does not exist");
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Get the token ID for an asset
     * @param orgContract The organization contract address
     * @param assetId The asset ID
     * @return The token ID, or 0 if no NFT exists
     */
    function getTokenIdForAsset(address orgContract, uint256 assetId) 
        external 
        view 
        returns (uint256) 
    {
        return assetToTokenId[orgContract][assetId];
    }

    /**
     * @dev Check if an NFT exists for an asset
     * @param orgContract The organization contract address
     * @param assetId The asset ID
     * @return True if an NFT exists for the asset
     */
    function assetHasNFT(address orgContract, uint256 assetId) 
        external 
        view 
        returns (bool) 
    {
        return assetToTokenId[orgContract][assetId] != 0;
    }

    /**
     * @dev Override _beforeTokenTransfer to emit custom event
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        if (from != address(0) && to != address(0)) {
            emit AssetNFTTransferred(tokenId, from, to);
        }
    }

    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up mappings
        address orgContract = tokenToOrgContract[tokenId];
        uint256 assetId = tokenToAssetId[tokenId];
        
        delete assetToTokenId[orgContract][assetId];
        delete tokenToOrgContract[tokenId];
        delete tokenToAssetId[tokenId];

        do 
        {

            assetToTokenId[orgContract][assetId] = assetToTokenId[orgContract][assetId + 1];
            uint256 nextTokenId = assetToTokenId[orgContract][assetId];
            tokenToOrgContract[nextTokenId] = orgContract;
            tokenToAssetId[nextTokenId] = assetId;
            assetId++;
        } while (assetToTokenId[orgContract][assetId] > 0);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Grant asset registry role to allow URI updates
     * @param assetRegistry The asset registry contract address
     */
    function grantAssetRegistryRole(address assetRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ASSET_REGISTRY_ROLE, assetRegistry);
    }

    /**
     * @dev Grant minter role to organization contracts
     * @param minter The address to grant minter role
     */
    function grantMinterRole(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
    }
}