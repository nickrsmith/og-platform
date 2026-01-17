// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleMockOrg {
    struct Asset {
        uint256 _v87ea5d;
        string _v6ae999;
        string _vc6ec61;
        uint256 _v2097c3;
        address _vca0dd8;
        bool _v47da9d;
        bool _vc772a5;
    }
    
    struct License {
        uint256 _v9d8e96;
        address _v204851;
        uint256 _v6c42a4;
        uint256 _va5a01b;
    }
    
    address public _v35a34c;
    mapping(uint256 => Asset) public _f3685e3;
    mapping(address => bool) public _v1f9442;
    mapping(address => License[]) public userLicenses;
    uint256 public _v9863e5;
    
    event _e8c6573(uint256 indexed _v9d8e96, string _v6ae999, address _vca0dd8);
    event _ead6604(uint256 indexed _v9d8e96);
    event _eefadba(uint256 indexed _v9d8e96, address _v204851, uint256 _v2097c3);
    
    constructor(address _principal) {
        _v35a34c = _principal;
        _v1f9442[_principal] = true;
    }
    
    function _f3fc77c(address _vca0dd8) external {
        require(msg.sender == _v35a34c, "Only _v35a34c");
        _v1f9442[_vca0dd8] = true;
    }
    
    function _f0e0147(
        string memory _v6ae999,
        string memory _vc6ec61,
        uint256 _v2097c3
    ) external returns (uint256) {
        require(_v1f9442[msg.sender], "Not a _vca0dd8");
        
        _v9863e5++;
        _f3685e3[_v9863e5] = Asset({
            _v87ea5d: _v9863e5,
            _v6ae999: _v6ae999,
            _vc6ec61: _vc6ec61,
            _v2097c3: _v2097c3,
            _vca0dd8: msg.sender,
            _v47da9d: false,
            _vc772a5: true
        });
        
        emit _e8c6573(_v9863e5, _v6ae999, msg.sender);
        return _v9863e5;
    }
    
    function _f4a3d1f(uint256 _v9d8e96) external {
        require(msg.sender == _v35a34c, "Only _v35a34c can verify");
        require(_f3685e3[_v9d8e96]._v87ea5d != 0, "Asset not found");
        
        _f3685e3[_v9d8e96]._v47da9d = true;
        emit _ead6604(_v9d8e96);
    }
    
    function _f2df134(uint256 _v9d8e96) external payable {
        Asset memory _v05fac9 = _f3685e3[_v9d8e96];
        require(_v05fac9._v87ea5d != 0, "Asset not found");
        require(_v05fac9._v47da9d, "Asset not verified");
        require(_v05fac9._vc772a5, "Asset cannot be licensed");
        require(msg.value >= _v05fac9._v2097c3, "Insufficient payment");
        
        userLicenses[msg.sender].push(License({
            _v9d8e96: _v9d8e96,
            _v204851: msg.sender,
            _v6c42a4: msg.value,
            _va5a01b: block.timestamp
        }));
        
        
        payable(_v05fac9._vca0dd8).transfer(msg.value);
        
        emit _eefadba(_v9d8e96, msg.sender, msg.value);
    }
    
    function _f57ca34(uint256 _v9d8e96) external view returns (
        uint256 _v87ea5d,
        string memory _v6ae999,
        string memory _vc6ec61,
        uint256 _v2097c3,
        address _vca0dd8,
        bool _v47da9d,
        bool _vc772a5
    ) {
        Asset memory _v05fac9 = _f3685e3[_v9d8e96];
        return (
            _v05fac9._v87ea5d,
            _v05fac9._v6ae999,
            _v05fac9._vc6ec61,
            _v05fac9._v2097c3,
            _v05fac9._vca0dd8,
            _v05fac9._v47da9d,
            _v05fac9._vc772a5
        );
    }
    
    function _f5679d0(address user) external view returns (uint256) {
        return userLicenses[user].length;
    }
}