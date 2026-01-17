// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IEmpressaStructs.sol";

interface IEmpressaContractFactory {
    function getPlatformFees() external view returns (uint32 integratorFee, uint32 empressaFee);
    function isValidOrgContract(address contractAddress) external view returns (bool);
    function licenseManager() external view returns (address);
    function getModules() external view returns (
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _assetNFT
    );
}

interface IEmpressaOrgContract {
    function factory() external view returns (address);
    function principal() external view returns (address);
    function integrationPartner() external view returns (address);
    function licenseManager() external view returns (address);
    function assetRegistry() external view returns (address);
    function groupManager() external view returns (address);
    function revenueDistributor() external view returns (address);
    
    function assets(uint256) external view returns (
        uint256 assetId,
        address creator,
        address owner,
        address partner,
        string memory ipfsHash,
        string memory metadataHash,
        bytes32 assetHash,
        uint256 version,
        bool isVerified,
        uint256 creationTime,
        uint256 lastTransferTime,
        uint256 price,
        bool encrypted,
        bool canBeLicensed,
        IEmpressaStructs.FxPool fxPool,
        string memory eventTimestamp
    );
    
    function isValidAsset(uint256 assetId) external view returns (bool);
    function getAssetCount() external view returns (uint256);
    function hasRole(bytes32 role, address account) external view returns (bool);
    function getCreatorCount() external view returns (uint256);
    function getCreators() external view returns (address[] memory);
    function getIntegrator() external view returns (address);
    function getAssetsByOwner(address owner) external view returns (uint256[] memory);
    function getAssetGroupsByOwner(address owner) external view returns (uint256[] memory);
    function isOrganizationMember(address user) external view returns (bool);
}

interface IEmpressaLicenseManager {
    function usdcToken() external view returns (address);

    function licenseAsset(
        address orgContract,
        uint256 assetId,
        address licensee,
        IEmpressaStructs.LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256);

    function licenseGroup(
        address orgContract,
        uint256 groupId,
        address licensee,
        IEmpressaStructs.LicensePermissions[] memory permissions,
        uint256 resellerFee
    ) external returns (uint256[] memory);
    
    function relicenseAsset(
        address orgContract,
        uint256 assetId,
        address licensee,
        uint256 existingLicenseId
    ) external returns (uint256);
    
    function isAssetLicensedBy(
        address orgContract,
        uint256 assetId,
        address user
    ) external view returns (bool);
    
    function getLicenseDetails(uint256 licenseId) external view returns (
        uint256 assetId,
        address licensor,
        address licensee,
        uint256 fee,
        address orgContract
    );
}

interface IEmpressaAssetRegistry {
    function registerAsset(
        IEmpressaStructs.VerifiedDigitalAsset memory asset,
        address creator
    ) external returns (uint256);
    
    function verifyAsset(
        address orgContract,
        uint256 assetId,
        address verifier
    ) external;

    function unverifyAsset(
        address orgContract,
        uint256 assetId
    ) external;
    
    function getAsset(
        address orgContract,
        uint256 assetId
    ) external view returns (IEmpressaStructs.VerifiedDigitalAsset memory);
    
    function isAssetVerified(
        address orgContract,
        uint256 assetId
    ) external view returns (bool);
    
    function assetCounter(address orgContract) external view returns (uint256);

    function transferAssetOwnership(
        address orgContract,
        uint256 assetId,
        address newOwner,
        address caller
    ) external;
    
    function updateAsset(
        address orgContract,
        uint256 assetId,
        string memory newIpfsHash,
        string memory newMetadataHash,
        uint256 newPrice,
        bool canBeLicensed,
        address caller
    ) external;
    
    function transferAssetCrossOrg(
        address fromOrg,
        address toOrg,
        uint256 assetId,
        address curOwner,
        address newOwner
    ) external returns (uint256 newAssetId);
    
    function getAssetCount(address orgContract) external view returns (uint256);
    
    function assetNFTAddress() external view returns (address);

    function isIPFSHashUsed(string memory ipfsHash) external view returns (bool);
}

interface IEmpressaAssetNFT {
    function mintAssetNFT(
        address to,
        address orgContract,
        uint256 assetId,
        string memory uri
    ) external returns (uint256);
    
    function getTokenIdForAsset(address orgContract, uint256 assetId) external view returns (uint256);
    
    function assetHasNFT(address orgContract, uint256 assetId) external view returns (bool);
    
    function ownerOf(uint256 tokenId) external view returns (address);
    
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    
    function transferFrom(address from, address to, uint256 tokenId) external;

    function getApproved(uint256 tokenId) external view returns (address);
    
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    function burn(uint256 tokenId) external;
}

interface IEmpressaGroupManager {
    function createGroup(
        string memory groupName,
        uint256[] memory assetIds,
        uint256 groupPrice,
        address creator
    ) external returns (uint256);
    
    function addAssetToGroup(
        uint256 groupId,
        uint256 assetId,
        address caller
    ) external;
    
    function removeAssetFromGroup(
        uint256 groupId,
        uint256 assetId,
        address caller
    ) external;
    
    function getGroup(
        address orgContract,
        uint256 groupId
    ) external view returns (IEmpressaStructs.AssetGroup memory);

    function removeGroup(uint256 groupId, address caller) external;
    
    function getGroupCount(address orgContract) external view returns (uint256);
    
    function removeAssetFromAllGroups(
        address orgContract,
        uint256 assetId,
        bool isCrossOrg
    ) external;

    function updateAssetIdsInGroups(
        address orgContract,
        uint256 assetId
    ) external;
}

interface IEmpressaRevenueDistributor {
    enum FeeApplication {
        BUY_SIDE_ONLY,    // 100% on buyer
        SELL_SIDE_ONLY,   // 100% on seller
        SPLIT             // Configurable split between buyer and seller
    }
    
    function distributeRevenue(
        uint256 assetId,
        address licensee,
        address from,
        uint256 amount,
        address assetOwner,
        address referralWallet,
        address orgContract,
        string calldata promoCode,
        FeeApplication feeMode,
        uint256 buySidePct
    ) external;
    
    function getRevenueStats(address orgContract) external view returns (
        uint256 total,
        uint256 empressaTotal,
        uint256 referralTotal,
        uint256 nvTotal,
        uint256 hmTotal,
        uint256 brokerTotal,
        uint256 sellerTotal
    );

    function getFeePercentages() external view returns (
        uint32 empressaFeePct,
        uint32 referralFeePct,
        uint32 nvFeePct,
        uint32 hmFeePct,
        uint32 brokerFeePct
    );
    
    function getOrgEarnings(address orgContract) external view returns (
        uint256 pendingEmpressa,
        uint256 pendingReferral,
        uint256 pendingNV,
        uint256 pendingHM,
        uint256 pendingBroker,
        uint256 pendingSeller,
        uint256 distributedEmpressa,
        uint256 distributedReferral,
        uint256 distributedNV,
        uint256 distributedHM,
        uint256 distributedBroker,
        uint256 distributedSeller
    );
}
