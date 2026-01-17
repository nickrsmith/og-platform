// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IHauskaContracts.sol";

contract HauskaRevenueDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant _cbfeac8 = keccak256("_cbfeac8");
    bytes32 public constant _c15d343 = keccak256("_c15d343");
    bytes32 public constant _c1522a0 = keccak256("_c1522a0");
    
    address public immutable _v7b202d;
    address public immutable _v0fa623;
    
    mapping(address => uint256) public totalRevenueDistributed;
    
    // Pending earnings (accumulated, not yet withdrawn)
    mapping(address => uint256) public pendingCreatorEarnings;
    mapping(address => uint256) public pendingIntegratorEarnings;
    uint256 public pendingHauskaEarnings;
    
    // Total earnings (including withdrawn amounts)
    mapping(address => uint256) public totalCreatorEarnings;
    mapping(address => uint256) public totalIntegratorEarnings;
    uint256 public totalHauskaEarnings;
    
    // Distributed earnings tracking per organization
    mapping(address => uint256) public distributedHauskaEarnings;
    mapping(address => uint256) public distributedIntegratorEarnings;
    mapping(address => uint256) public distributedCreatorsEarnings;
    
    mapping(address => uint256) public orgCreatorRevenue;
    mapping(address => uint256) public orgHauskaRevenue;
    mapping(address => uint256) public orgIntegratorRevenue;
    
    
    mapping(address => bool) public hasCustomFees;
    mapping(address => uint32) public customHauskaFees;
    mapping(address => uint32) public customIntegratorFees;
    
    event _eefb66c(
        address _v3030a8,
        uint256 _v9d8e96,
        uint256 _vcf4b0b,
        uint256 hauskaAmount,
        uint256 integratorAmount
    );
    
    event _ee5edb3(
        address indexed _v3030a8,
        uint32 _vf0d665,
        uint32 _v9aa481
    );
    
    event EarningsWithdrawn(
        address indexed recipient,
        uint256 amount,
        string recipientType
    );
    
    event EarningsAccumulated(
        address indexed recipient,
        uint256 amount,
        string recipientType
    );
    
    modifier _m5b7b5c() {
        require(hasRole(_c15d343, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor(address _factory, address _vec75e2) {
        require(_factory != address(0), "Invalid _v7b202d");
        require(_vec75e2 != address(0), "Invalid USDC token");
        
        _v7b202d = _factory;
        _v0fa623 = _vec75e2;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(_cbfeac8, msg.sender);
    }
    
    function _f484414(address contractAddress) external onlyRole(_cbfeac8) {
        _grantRole(_c15d343, contractAddress);
    }
    
    function _f6baf4e(address contractAddress) external onlyRole(_cbfeac8) {
        _revokeRole(_c15d343, contractAddress);
    }
    
    function _f216d88(
        uint256 _v9d8e96,
        address _v204851,
        address from,
        uint256 _v9cb6ff,
        address assetOwner,
        address _vbd9641,
        address _v3030a8
    ) external _m5b7b5c nonReentrant {
        require(_v9cb6ff > 0, "Amount must be greater than 0");
        require(assetOwner != address(0), "Invalid _v05fac9 _v579233");
        
        (uint32 _v3055c2, uint32 _v3d6202) = _f2d56cb(_v3030a8);
        uint256 _vf0d665 = (_v9cb6ff * _v3d6202) / (10000 + _v3d6202 + _v3055c2);
        uint256 _v9aa481 = 0;
        
        if (_vbd9641 != address(0)) {
            _v9aa481 = (_v9cb6ff * _v3055c2) / (10000 + _v3d6202 + _v3055c2);
        }
        
        uint256 _vcf4b0b = _v9cb6ff * 10000 / (10000 + _v3d6202 + _v3055c2);
        
        IERC20(_v0fa623).safeTransferFrom(from, address(this), _v9cb6ff);
        
        totalRevenueDistributed[_v3030a8] += _v9cb6ff;

        if (_vcf4b0b > 0) {
            pendingCreatorEarnings[assetOwner] += _vcf4b0b;
            totalCreatorEarnings[assetOwner] += _vcf4b0b;
            emit EarningsAccumulated(assetOwner, _vcf4b0b, "creator");
        }
        
        if (_vf0d665 > 0) {
            pendingHauskaEarnings += _vf0d665;
            totalHauskaEarnings += _vf0d665;
            emit EarningsAccumulated(_v7b202d, _vf0d665, "hauska");
        }
        
        if (_v9aa481 > 0) {
            pendingIntegratorEarnings[_v3030a8] += _v9aa481;
            totalIntegratorEarnings[_v3030a8] += _v9aa481;
            emit EarningsAccumulated(_vbd9641, _v9aa481, "integrator");
        } else {
            // If no integration partner, refund to licensee
            uint256 refundAmount = (_v9cb6ff * _v3055c2) / (10000 + _v3d6202 + _v3055c2);
            if (refundAmount > 0) {
                IERC20(_v0fa623).safeTransfer(_v204851, refundAmount);
            }
        }
        
        orgCreatorRevenue[_v3030a8] += _vcf4b0b;
        orgHauskaRevenue[_v3030a8] += _vf0d665;
        if (_v9aa481 > 0) {
            orgIntegratorRevenue[_v3030a8] += _v9aa481;
        }
        
        emit _eefb66c(
            _v3030a8,
            _v9d8e96,
            _vcf4b0b,
            _vf0d665,
            _v9aa481
        );
    }
    
    function _f7430d9(
        address _v3030a8,
        uint32 _v3d6202,
        uint32 _v3055c2
    ) external onlyRole(_cbfeac8) {
        require(_v3d6202 <= 2000, "Hauska _v9c15cd too high"); 
        require(_v3055c2 <= 500, "Integrator _v9c15cd too high"); 
        
        hasCustomFees[_v3030a8] = true;
        customHauskaFees[_v3030a8] = _v3d6202;
        customIntegratorFees[_v3030a8] = _v3055c2;
        
        emit _ee5edb3(_v3030a8, _v3d6202, _v3055c2);
    }
    
    function _fc19fc5(address _v3030a8) external onlyRole(_cbfeac8) {
        hasCustomFees[_v3030a8] = false;
        delete customHauskaFees[_v3030a8];
        delete customIntegratorFees[_v3030a8];
    }
    
    function _f2d56cb(address _v3030a8) private view returns (uint32 _v9aa481, uint32 _vf0d665) {
        if (hasCustomFees[_v3030a8]) {
            return (customIntegratorFees[_v3030a8], customHauskaFees[_v3030a8]);
        } else {
            return IHauskaContractFactory(_v7b202d)._f6ede20();
        }
    }
    
    
    function _fdd13e2(address _v3030a8) external view returns (
        uint256 _v5a537e,
        uint256 _vc01f3f,
        uint256 _v89e0e7,
        uint256 _v92acd5
    ) {
        _v5a537e = totalRevenueDistributed[_v3030a8];
        _vc01f3f = orgCreatorRevenue[_v3030a8];
        _v89e0e7 = orgHauskaRevenue[_v3030a8];
        _v92acd5 = orgIntegratorRevenue[_v3030a8];
        
        return (_v5a537e, _vc01f3f, _v89e0e7, _v92acd5);
    }
    function _f434c53(address _v3030a8) external view returns (uint32 _v3d6202, uint32 _v3055c2) {
        if (hasCustomFees[_v3030a8]) {
            return (customIntegratorFees[_v3030a8], customHauskaFees[_v3030a8]);
        } else {
            return IHauskaContractFactory(_v7b202d)._f6ede20();
        }
    }

    function _f9e8b2a(address _v3030a8) external view returns (
        uint256 _v89e0e7,
        uint256 _v92acd5,
        uint256 _vc01f3f,
        uint256 _v89e0e7Distributed,
        uint256 _v92acd5Distributed,
        uint256 _vc01f3fDistributed
    ) {
        _v89e0e7 = pendingHauskaEarnings;
        _v92acd5 = pendingIntegratorEarnings[_v3030a8];
        
        IHauskaOrgContract org = IHauskaOrgContract(_v3030a8);
        address[] memory creators = org._f8a9b2c();
        _vc01f3f = 0;
        for (uint256 i = 0; i < creators.length; i++) {
            _vc01f3f += pendingCreatorEarnings[creators[i]];
        }
        
        _v89e0e7Distributed = distributedHauskaEarnings[_v3030a8];
        _v92acd5Distributed = distributedIntegratorEarnings[_v3030a8];
        _vc01f3fDistributed = distributedCreatorsEarnings[_v3030a8];
    }

    function _f8c7d3f(address _v3030a8) private view returns (uint256 _v89e0e7, uint256 _v92acd5, uint256 _vc01f3f) {
        _v89e0e7 = pendingHauskaEarnings;
        _v92acd5 = pendingIntegratorEarnings[_v3030a8];
        
        IHauskaOrgContract org = IHauskaOrgContract(_v3030a8);
        address[] memory creators = org._f8a9b2c();
        _vc01f3f = 0;
        for (uint256 i = 0; i < creators.length; i++) {
            _vc01f3f += pendingCreatorEarnings[creators[i]];
        }
    }

    function _f9d4e2b(address _v3030a8) private view returns (uint256 _v89e0e7, uint256 _v92acd5, uint256 _vc01f3f) {
        _v89e0e7 = distributedHauskaEarnings[_v3030a8];
        _v92acd5 = distributedIntegratorEarnings[_v3030a8];
        _vc01f3f = distributedCreatorsEarnings[_v3030a8];
    }
    
    function _f8c7d3e(address _v3030a8) external view returns (uint256) {
        (uint256 _v89e0e7, uint256 _v92acd5, uint256 _vc01f3f) = _f8c7d3f(_v3030a8);
        return _v89e0e7 + _v92acd5 + _vc01f3f;
    }
    
    function _f9d4e2a(address _v3030a8) external view returns (uint256) {
        (uint256 _v89e0e7, uint256 _v92acd5, uint256 _vc01f3f) = _f9d4e2b(_v3030a8);
        return _v89e0e7 + _v92acd5 + _vc01f3f;
    }
    
    function _f7a8b9c(address _v3030a8) external nonReentrant {
        IHauskaOrgContract org = IHauskaOrgContract(_v3030a8);
        require(org.hasRole(_c1522a0, msg.sender), "Not organization principal");
        
        (uint256 _v89e0e7, uint256 _v92acd5, uint256 _vc01f3f) = _f8c7d3f(_v3030a8);
        
        uint256 totalAmount = _v89e0e7 + _v92acd5 + _vc01f3f;
        require(totalAmount > 0, "No pending organization earnings");
        
        if (_v89e0e7 > 0) {
            pendingHauskaEarnings = 0;
            distributedHauskaEarnings[_v3030a8] += _v89e0e7;
            IERC20(_v0fa623).safeTransfer(_v7b202d, _v89e0e7);
            emit EarningsWithdrawn(_v7b202d, _v89e0e7, "hauska");
        }
        
        if (_v92acd5 > 0) {
            address integrator = org._fbd9641();
            pendingIntegratorEarnings[_v3030a8] = 0;
            distributedIntegratorEarnings[_v3030a8] += _v92acd5;
            IERC20(_v0fa623).safeTransfer(integrator, _v92acd5);
            emit EarningsWithdrawn(integrator, _v92acd5, "integrator");
        }
        
        if (_vc01f3f > 0) {
            address[] memory creators = org._f8a9b2c();
            for (uint256 i = 0; i < creators.length; i++) {
                uint256 creatorAmount = pendingCreatorEarnings[creators[i]];
                if (creatorAmount > 0) {
                    pendingCreatorEarnings[creators[i]] = 0;
                    IERC20(_v0fa623).safeTransfer(creators[i], creatorAmount);
                    emit EarningsWithdrawn(creators[i], creatorAmount, "creator");
                }
            }
            distributedCreatorsEarnings[_v3030a8] += _vc01f3f;
        }
    }
}