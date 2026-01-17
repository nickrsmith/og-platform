// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IEmpressaStructs.sol";
import "./interfaces/IEmpressaContracts.sol";

interface IAssetRegistry {
    function _fc9b17f(address _v3030a8, uint256 _v9d8e96) external view returns (bool);
    function _f57ca34(address _v3030a8, uint256 _v9d8e96) external view returns (IEmpressaStructs.VerifiedDigitalAsset memory);
}

contract EmpressaGroupManager is AccessControl, IEmpressaStructs {
    bytes32 public constant _c5ed259 = keccak256("_c5ed259");
    bytes32 public constant _cc9dbe0 = keccak256("_cc9dbe0");
    
    address public immutable _v9b2fda;
    
    
    mapping(address => mapping(uint256 => AssetGroup)) public orgGroups;
    mapping(address => uint256) public orgGroupCounts;
    mapping(address => mapping(address => uint256[])) public creatorGroups;
    
    event _e48af46(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        string _v6ae999,
        address indexed _vca0dd8
    );
    
    event _eb8ffa3(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        uint256 newPrice
    );
    
    event _e8d30a0(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        uint256 _v9d8e96
    );
    
    event _eb50152(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa,
        uint256 _v9d8e96
    );
    
    event _e2527ea(
        address indexed _v3030a8,
        uint256 indexed _vd6b1fa
    );
    
    modifier _m225f92() {
        require(hasRole(_cc9dbe0, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor(address _assetRegistry) {
        require(_assetRegistry != address(0), "Invalid _v05fac9 registry");
        _v9b2fda = _assetRegistry;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_c5ed259, msg.sender);
    }
    
    function _fcbb231(address _v3030a8) external onlyRole(_c5ed259) {
        _grantRole(_cc9dbe0, _v3030a8);
    }
    
    function _f9083ea(address _v3030a8) external onlyRole(_c5ed259) {
        _revokeRole(_cc9dbe0, _v3030a8);
    }
    
    function _ff1bf61(
        string memory groupName,
        uint256[] memory assetIds,
        uint256 _v2459dc,
        address _vca0dd8
    ) external _m225f92 returns (uint256) {
        require(bytes(groupName).length > 0, "Group _v6ae999 cannot be empty");
        require(assetIds.length > 0, "Group must have _f3685e3");
        
        address _v3030a8 = msg.sender;
        
        
        for (uint256 _v042dc4 = 0; _v042dc4 < assetIds.length; _v042dc4++) {
            require(
                IAssetRegistry(_v9b2fda)._fc9b17f(_v3030a8, assetIds[_v042dc4]),
                "All _f3685e3 must be verified"
            );
            
            IEmpressaStructs.VerifiedDigitalAsset memory _v64292b = IAssetRegistry(_v9b2fda)._f57ca34(_v3030a8, assetIds[_v042dc4]);
            require(_v64292b._v579233 == _vca0dd8, "Creator must own all assets in the group");
        }
        
        orgGroupCounts[_v3030a8]++;
        uint256 _vd6b1fa = orgGroupCounts[_v3030a8];
        
        AssetGroup storage _va97183 = orgGroups[_v3030a8][_vd6b1fa];
        _va97183._vd6b1fa = _vd6b1fa;
        _va97183._vf13eb5 = assetIds;
        _va97183._v6ae999 = groupName;
        _va97183._v2459dc = _v2459dc;
        _va97183._v579233 = _vca0dd8;
        
        creatorGroups[_v3030a8][_vca0dd8].push(_vd6b1fa);
        
        emit _e48af46(_v3030a8, _vd6b1fa, groupName, _vca0dd8);
        
        return _vd6b1fa;
    }
    
    function _f190db0(
        uint256 _vd6b1fa,
        uint256 _v9d8e96,
        address caller
    ) external _m225f92 {
        address _v3030a8 = msg.sender;
        AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];
        
        require(_v64292b._vd6b1fa != 0, "Group does not exist");
        require(_v64292b._v579233 == caller, "Only _v64292b _v579233 can modify");
        require(
            IAssetRegistry(_v9b2fda)._fc9b17f(_v3030a8, _v9d8e96),
            "Asset must be verified"
        );
        
        
        for (uint256 _v042dc4 = 0; _v042dc4 < _v64292b._vf13eb5.length; _v042dc4++) {
            require(_v64292b._vf13eb5[_v042dc4] != _v9d8e96, "Asset already in _v64292b");
        }
        
        _v64292b._vf13eb5.push(_v9d8e96);
        emit _e8d30a0(_v3030a8, _vd6b1fa, _v9d8e96);
    }
    
    function _f7a9209(
        uint256 _vd6b1fa,
        uint256 _v9d8e96,
        address caller
    ) external _m225f92 {
        address _v3030a8 = msg.sender;
        AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];
        
        require(_v64292b._vd6b1fa != 0, "Group does not exist");
        require(_v64292b._v579233 == caller, "Only _v64292b _v579233 can modify");
        require(_v64292b._vf13eb5.length > 1, "Cannot remove _v213ed3 _v05fac9");
        
        
        for (uint256 _v042dc4 = 0; _v042dc4 < _v64292b._vf13eb5.length; _v042dc4++) {
            if (_v64292b._vf13eb5[_v042dc4] == _v9d8e96) {
                _v64292b._vf13eb5[_v042dc4] = _v64292b._vf13eb5[_v64292b._vf13eb5.length - 1];
                _v64292b._vf13eb5.pop();
                emit _eb50152(_v3030a8, _vd6b1fa, _v9d8e96);
                return;
            }
        }
        
        revert("Asset not in _v64292b");
    }
    
    function _ff9ba9d(
        uint256 _vd6b1fa,
        uint256 newPrice,
        address caller
    ) external _m225f92 {
        address _v3030a8 = msg.sender;
        AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];
        
        require(_v64292b._vd6b1fa != 0, "Group does not exist");
        require(_v64292b._v579233 == caller, "Only _v64292b _v579233 can modify");
        
        _v64292b._v2459dc = newPrice;
        emit _eb8ffa3(_v3030a8, _vd6b1fa, newPrice);
    }
    
    function _f624914(
        address _v3030a8,
        uint256 _vd6b1fa
    ) external view returns (AssetGroup memory) {
        AssetGroup memory _v64292b = orgGroups[_v3030a8][_vd6b1fa];
        (uint32 _v7c582f, uint32 _vcaab70c) = IEmpressaRevenueDistributor(IEmpressaOrgContract(_v3030a8)._vedea5b())._f434c53(_v3030a8);
        _v64292b._v2459dc = _v64292b._v2459dc * (10000 + _v7c582f + _vcaab70c) / 10000;
        return _v64292b;
    }
    
    function _f44066c(
        address _v3030a8,
        address _vca0dd8
    ) external view returns (uint256[] memory) {
        return creatorGroups[_v3030a8][_vca0dd8];
    }

    function _faeb40b(uint256 _vd6b1fa, address caller) external _m225f92 {
        address _v3030a8 = msg.sender;
        AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];

        require(_v64292b._vd6b1fa != 0, "Group does not exist");
        require(_v64292b._v579233 == caller, "Only _v64292b _v579233 can delete");

        address _vca0dd8 = _v64292b._v579233;
        uint256[] storage _v8c7d3e = creatorGroups[_v3030a8][_vca0dd8];
        
        for (uint256 i = 0; i < _v8c7d3e.length; i++) {
            if (_v8c7d3e[i] == _vd6b1fa) {
                _v8c7d3e[i] = _v8c7d3e[_v8c7d3e.length - 1];
                _v8c7d3e.pop();
                break;
            }
        }

        orgGroupCounts[_v3030a8]--;
        delete orgGroups[_v3030a8][_vd6b1fa];
    }
    
    function _f496efd(address _v3030a8) external view returns (uint256) {
        return orgGroupCounts[_v3030a8];
    }
    
    function _f8c7d3e(
        address _v3030a8,
        uint256 _v9d8e96
    ) external _m225f92 {
        uint256 _v042dc4 = orgGroupCounts[_v3030a8];
        
        for (uint256 _vd6b1fa = 1; _vd6b1fa <= _v042dc4; _vd6b1fa++) {
            AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];
            
            if (_v64292b._vd6b1fa == 0) continue;
            
            for (uint256 i = 0; i < _v64292b._vf13eb5.length; i++) {
                if (_v64292b._vf13eb5[i] == _v9d8e96) {
                    if (_v64292b._vf13eb5.length == 1) {
                        address _vca0dd8 = _v64292b._v579233;
                        uint256[] storage _v8c7d3e = creatorGroups[_v3030a8][_vca0dd8];
                        
                        for (uint256 j = 0; j < _v8c7d3e.length; j++) {
                            if (_v8c7d3e[j] == _vd6b1fa) {
                                _v8c7d3e[j] = _v8c7d3e[_v8c7d3e.length - 1];
                                _v8c7d3e.pop();
                                break;
                            }
                        }
                        
                        delete orgGroups[_v3030a8][_vd6b1fa];
                        orgGroupCounts[_v3030a8]--;
                        emit _e2527ea(_v3030a8, _vd6b1fa);
                    } else {
                        _v64292b._vf13eb5[i] = _v64292b._vf13eb5[_v64292b._vf13eb5.length - 1];
                        _v64292b._vf13eb5.pop();
                        emit _eb50152(_v3030a8, _vd6b1fa, _v9d8e96);
                    }
                    break;
                }
            }
        }
    }

    function _f29547b(
        address _v3030a8,
        uint256 _v9d8e96
    ) external _m225f92 {
        uint256 _v042dc4 = orgGroupCounts[_v3030a8];
        
        for (uint256 _vd6b1fa = 1; _vd6b1fa <= _v042dc4; _vd6b1fa++) {
            AssetGroup storage _v64292b = orgGroups[_v3030a8][_vd6b1fa];
            for (uint256 i = 0; i < _v64292b._vf13eb5.length; i++) {
                if (_v64292b._vf13eb5[i] > _v9d8e96) {
                    _v64292b._vf13eb5[i]--;
                }
            }
        }
    }
}