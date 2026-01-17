// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IHauskaStructs.sol";

interface IHauskaContractFactory {
    function _f6ede20() external view returns (uint32 _v9aa481, uint32 _vf0d665);
    function _f4e55c4(address contractAddress) external view returns (bool);
    function _vd0b565() external view returns (address);
    function _f84a41b() external view returns (
        address _licenseManager,
        address _assetRegistry,
        address _groupManager,
        address _revenueDistributor,
        address _v9d7695
    );
}

interface IHauskaOrgContract {
    function _v7b202d() external view returns (address);
    function _v35a34c() external view returns (address);
    function _vbd9641() external view returns (address);
    function _vd0b565() external view returns (address);
    function _v9b2fda() external view returns (address);
    function _v45f631() external view returns (address);
    function _vedea5b() external view returns (address);
    
    function _f3685e3(uint256) external view returns (
        uint256 _v9d8e96,
        address _vca0dd8,
        address _v579233,
        address _v3624db,
        string memory _vc6ec61,
        string memory _vfd7108,
        bytes32 _vd4500a,
        uint256 _vc69227,
        bool _v47da9d,
        uint256 _vb1ba65,
        uint256 _v1b2e38,
        uint256 _v2097c3,
        bool _vd92342,
        bool _vc772a5,
        IHauskaStructs.FxPool _v7c582f,
        string memory _vcab70c
    );
    
    function _fb32b66(uint256 _v9d8e96) external view returns (bool);
    function _f49b5a2() external view returns (uint256);
    function hasRole(bytes32 role, address _vca2072) external view returns (bool);
    function _fb03f4d() external view returns (uint256);
    function _f8fe555(address _v579233) external view returns (uint256[] memory);
    function _f5bfb36(address _v579233) external view returns (uint256[] memory);
    function _f07ee68(address user) external view returns (bool);
    function _f8a9b2c() external view returns (address[] memory); // getCreators
    function _fbd9641() external view returns (address); // getIntegrator
}

interface IHauskaLicenseManager {
    function _v0fa623() external view returns (address);

    function _f2df134(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        IHauskaStructs.LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256);


    function _fbcc39b(
        address _v3030a8,
        uint256 _vd6b1fa,
        address _v204851,
        IHauskaStructs.LicensePermissions[] memory _v7e9272,
        uint256 _v09603a
    ) external returns (uint256[] memory);
    
    function _f606184(
        address _v3030a8,
        uint256 _v9d8e96,
        address _v204851,
        uint256 existingLicenseId
    ) external returns (uint256);
    
    function _fa5f9f5(
        address _v3030a8,
        uint256 _v9d8e96,
        address user
    ) external view returns (bool);
    
    function _fa97764(uint256 _v87c9ae) external view returns (
        uint256 _v9d8e96,
        address _v147f2a,
        address _v204851,
        uint256 _v9c15cd,
        address _v3030a8
    );
}

interface IHauskaAssetRegistry {
    function _fcf0c01(
        IHauskaStructs.VerifiedDigitalAsset memory _v05fac9,
        address _vca0dd8
    ) external returns (uint256);
    
    function _f4a3d1f(
        address _v3030a8,
        uint256 _v9d8e96,
        address _ve15436
    ) external;

    function _fd7a077(
        address _v3030a8,
        uint256 _v9d8e96
    ) external;
    
    function _f57ca34(
        address _v3030a8,
        uint256 _v9d8e96
    ) external view returns (IHauskaStructs.VerifiedDigitalAsset memory);
    
    function _fc9b17f(
        address _v3030a8,
        uint256 _v9d8e96
    ) external view returns (bool);
    
    function _fd190ab(address _v3030a8) external view returns (uint256);

    function _fcafa39(
        address _v3030a8,
        uint256 _v9d8e96,
        address newOwner,
        address caller
    ) external;
    
    function _fe0260c(
        address _v3030a8,
        uint256 _v9d8e96,
        string memory newIpfsHash,
        string memory newMetadataHash,
        uint256 newPrice,
        bool _vc772a5,
        address caller
    ) external;
    
    function _f938eee(
        address fromOrg,
        address toOrg,
        uint256 _v9d8e96,
        address curOwner,
        address newOwner
    ) external returns (uint256 _v0366cb);
    
    function _f49b5a2(address _v3030a8) external view returns (uint256);
    
    function _v794de2() external view returns (address);

    function _f490f18(string memory _vc6ec61) external view returns (bool);
}

interface IHauskaAssetNFT {
    function _ff6c888(
        address to,
        address _v3030a8,
        uint256 _v9d8e96,
        string memory _v2c6d68
    ) external returns (uint256);
    
    function _f3d0e84(address _v3030a8, uint256 _v9d8e96) external view returns (uint256);
    
    function _fbfb963(address _v3030a8, uint256 _v9d8e96) external view returns (bool);
    
    function ownerOf(uint256 _va95b9f) external view returns (address);
    
    function safeTransferFrom(address from, address to, uint256 _va95b9f) external;
    
    function transferFrom(address from, address to, uint256 _va95b9f) external;

    function getApproved(uint256 _va95b9f) external view returns (address);
    
    function isApprovedForAll(address _v579233, address operator) external view returns (bool);

    function burn(uint256 _va95b9f) external;
}

interface IHauskaGroupManager {
    function _ff1bf61(
        string memory groupName,
        uint256[] memory assetIds,
        uint256 _v2459dc,
        address _vca0dd8
    ) external returns (uint256);
    
    function _f190db0(
        uint256 _vd6b1fa,
        uint256 _v9d8e96,
        address caller
    ) external;
    
    function _f7a9209(
        uint256 _vd6b1fa,
        uint256 _v9d8e96,
        address caller
    ) external;
    
    function _f624914(
        address _v3030a8,
        uint256 _vd6b1fa
    ) external view returns (IHauskaStructs.AssetGroup memory);

    function _faeb40b(uint256 _vd6b1fa, address caller) external;
    
    function _f496efd(address _v3030a8) external view returns (uint256);
    
    function _f8c7d3e(
        address _v3030a8,
        uint256 _v9d8e96
    ) external;

    function _f29547b(
        address _v3030a8,
        uint256 _v9d8e96
    ) external;
}

interface IHauskaRevenueDistributor {
    function _f216d88(
        uint256 _v9d8e96,
        address _v204851,
        address from,
        uint256 _v9cb6ff,
        address assetOwner,
        address _vbd9641,
        address _v3030a8
    ) external;
    
    function _f7430d9(
        address _v3030a8,
        uint32 _v3d6202,
        uint32 _v3055c2
    ) external;
    
    function _fdd13e2(address _v3030a8) external view returns (
        uint256 _v5a537e,
        uint256 _vc01f3f,
        uint256 _v89e0e7,
        uint256 _v92acd5
    );

    function _f434c53(address _v3030a8) external view returns (uint32 _v3d6202, uint32 _v3055c2);
}