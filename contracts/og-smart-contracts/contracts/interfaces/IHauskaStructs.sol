// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEmpressaStructs {
    enum FxPool { PII, DT, VDAS }
    enum LicensePermissions { View, Resell, Both }
    enum CountryCode { US, RU, JP, CN, UK, DE, FR, CA, AU, BR }
    
    struct VerifiedDigitalAsset {
        uint256 assetId;
        address creator;
        address owner;
        address partner;
        string ipfsHash;
        bytes32 metadataHash;
        bytes32 assetHash;
        uint256 version;
        bool isVerified;
        uint256 creationTime;
        uint256 lastTransferTime;
        uint256 price;
        bool encrypted;
        bool canBeLicensed;
        FxPool fxPool;
        string eventTimestamp;
        CountryCode[] geographicRestrictions;
    }
    
    struct LicenseData {
        uint256 licenseId;
        uint256 assetId;
        address licensor;
        address licensee;
        uint256 fee;
        uint256 resellerFee;
        LicensePermissions[] licensePermissions;
        CountryCode[] geographicRestrictions;
    }
    
    struct AssetGroup {
        uint256 groupId;
        uint256[] members;
        string name;
        uint256 groupPrice;
        address owner;
    }

}