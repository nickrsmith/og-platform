// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEmpressaStructs {
    enum FxPool { PII, DT, VDAS }
    enum LicensePermissions { _v69bd4e, Resell, Both }
    enum CountryCode { US, RU, JP, CN, UK, DE, FR, CA, AU, BR }
    
    struct VerifiedDigitalAsset {
        uint256 _v9d8e96;
        address _vca0dd8;
        address _v579233;
        address _v3624db;
        string _vc6ec61;
        bytes32 _vfd7108;
        bytes32 _vd4500a;
        uint256 _vc69227;
        bool _v47da9d;
        uint256 _vb1ba65;
        uint256 _v1b2e38;
        uint256 _v2097c3;
        bool _vd92342;
        bool _vc772a5;
        FxPool _v7c582f;
        string _vcab70c;
        CountryCode[] _v0c96e3;
    }
    
    struct LicenseData {
        uint256 _v87c9ae;
        uint256 _v9d8e96;
        address _v147f2a;
        address _v204851;
        uint256 _v9c15cd;
        uint256 _v09603a;
        LicensePermissions[] _vf10eb2;
        CountryCode[] _v0c96e3;
    }
    
    struct AssetGroup {
        uint256 _vd6b1fa;
        uint256[] _vf13eb5;
        string _v6ae999;
        uint256 _v2459dc;
        address _v579233;
    }

}