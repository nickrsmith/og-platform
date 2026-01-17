// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IHauskaContracts.sol";

contract HauskaRevenueDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant DISTRIBUTOR_ADMIN_ROLE = keccak256("DISTRIBUTOR_ADMIN_ROLE");
    bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");
    bytes32 public constant PRINCIPAL_ROLE = keccak256("PRINCIPAL_ROLE");
    
    address public immutable factory;
    address public immutable usdcToken;
    
    // Revenue tracking
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
    
    // Per-organization revenue tracking
    mapping(address => uint256) public orgCreatorRevenue;
    mapping(address => uint256) public orgHauskaRevenue;
    mapping(address => uint256) public orgIntegratorRevenue;
    
    // Fee overrides for special cases
    mapping(address => bool) public hasCustomFees;
    mapping(address => uint32) public customHauskaFees;
    mapping(address => uint32) public customIntegratorFees;
    
    event RevenueDistributed(
        address orgContract,
        uint256 assetId,
        uint256 ownerAmount,
        uint256 hauskaAmount,
        uint256 integratorAmount
    );
    
    event CustomFeesSet(
        address indexed orgContract,
        uint32 hauskaFee,
        uint32 integratorFee
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
    
    modifier onlyAuthorized() {
        require(hasRole(AUTHORIZED_CONTRACT_ROLE, msg.sender), "Caller not authorized");
        _;
    }
    
    constructor(address _factory, address _usdcToken) {
        require(_factory != address(0), "Invalid factory");
        require(_usdcToken != address(0), "Invalid USDC token");
        
        factory = _factory;
        usdcToken = _usdcToken;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ADMIN_ROLE, msg.sender);
    }

    // Organization-level earnings functions for principals
    function getOrgEarnings(address orgContract) external view returns (
        uint256 pendingHauska,
        uint256 pendingIntegrator,
        uint256 pendingCreators,
        uint256 distributedHauska,
        uint256 distributedIntegrator,
        uint256 distributedCreators
    ) {
        // Get pending earnings for this organization
        pendingHauska = pendingHauskaEarnings;
        pendingIntegrator = pendingIntegratorEarnings[orgContract];
        
        // Calculate pending creators earnings for this organization
        IHauskaOrgContract org = IHauskaOrgContract(orgContract);
        address[] memory creators = org.getCreators();
        pendingCreators = 0;
        for (uint256 i = 0; i < creators.length; i++) {
            pendingCreators += pendingCreatorEarnings[creators[i]];
        }
        
        // Get distributed amounts for this organization
        distributedHauska = distributedHauskaEarnings[orgContract];
        distributedIntegrator = distributedIntegratorEarnings[orgContract];
        distributedCreators = distributedCreatorsEarnings[orgContract];
    }

    function _getOrgPendingEarnings(address orgContract) private view returns (uint256 pendingHauska, uint256 pendingIntegrator, uint256 pendingCreators) {
        // Get pending earnings for this organization
        pendingHauska = pendingHauskaEarnings;
        pendingIntegrator = pendingIntegratorEarnings[orgContract];
        
        // Calculate pending creators earnings for this organization
        IHauskaOrgContract org = IHauskaOrgContract(orgContract);
        address[] memory creators = org.getCreators();
        pendingCreators = 0;
        for (uint256 i = 0; i < creators.length; i++) {
            pendingCreators += pendingCreatorEarnings[creators[i]];
        }
    }

    function _getOrgDistributedEarnings(address orgContract) private view returns (uint256 distributedHauska, uint256 distributedIntegrator, uint256 distributedCreators) {
        // Get distributed amounts for this organization
        distributedHauska = distributedHauskaEarnings[orgContract];
        distributedIntegrator = distributedIntegratorEarnings[orgContract];
        distributedCreators = distributedCreatorsEarnings[orgContract];
    }
    
    function addAuthorizedContract(address contractAddress) external onlyRole(DISTRIBUTOR_ADMIN_ROLE) {
        _grantRole(AUTHORIZED_CONTRACT_ROLE, contractAddress);
    }
    
    function removeAuthorizedContract(address contractAddress) external onlyRole(DISTRIBUTOR_ADMIN_ROLE) {
        _revokeRole(AUTHORIZED_CONTRACT_ROLE, contractAddress);
    }
    
    function distributeRevenue(
        uint256 assetId,
        address licensee,
        address from,
        uint256 amount,
        address assetOwner,
        address integrationPartner,
        address orgContract
    ) external onlyAuthorized nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(assetOwner != address(0), "Invalid asset owner");
        
        // Get fee percentages
        (uint32 integratorFeePct, uint32 hauskaFeePct) = _getFees(orgContract);
        
        // Calculate fees
        uint256 hauskaFee = (amount * hauskaFeePct) / (10000 + hauskaFeePct + integratorFeePct);
        uint256 integratorFee = 0;
        
        if (integrationPartner != address(0)) {
            integratorFee = (amount * integratorFeePct) / (10000 + hauskaFeePct + integratorFeePct);
        }
        
        uint256 ownerAmount = amount * 10000 / (10000 + hauskaFeePct + integratorFeePct);
        
        // Transfer from payer to this contract
        IERC20(usdcToken).safeTransferFrom(from, address(this), amount);
        
        // Update earnings tracking
        totalRevenueDistributed[orgContract] += amount;
        
        // Accumulate pending earnings (not distributed immediately)
        if (ownerAmount > 0) {
            pendingCreatorEarnings[assetOwner] += ownerAmount;
            totalCreatorEarnings[assetOwner] += ownerAmount;
            emit EarningsAccumulated(assetOwner, ownerAmount, "creator");
        }
        
        if (hauskaFee > 0) {
            pendingHauskaEarnings += hauskaFee;
            totalHauskaEarnings += hauskaFee;
            emit EarningsAccumulated(factory, hauskaFee, "hauska");
        }
        
        if (integratorFee > 0) {
            pendingIntegratorEarnings[orgContract] += integratorFee;
            totalIntegratorEarnings[orgContract] += integratorFee;
            emit EarningsAccumulated(integrationPartner, integratorFee, "integrator");
        } else {
            // If no integration partner, refund to licensee
            uint256 refundAmount = (amount * integratorFeePct) / (10000 + hauskaFeePct + integratorFeePct);
            if (refundAmount > 0) {
                IERC20(usdcToken).safeTransfer(licensee, refundAmount);
            }
        }
        
        // Update per-org tracking
        orgCreatorRevenue[orgContract] += ownerAmount;
        orgHauskaRevenue[orgContract] += hauskaFee;
        if (integratorFee > 0) {
            orgIntegratorRevenue[orgContract] += integratorFee;
        }
        
        emit RevenueDistributed(
            orgContract,
            assetId,
            ownerAmount,
            hauskaFee,
            integratorFee
        );
    }
    
    function setCustomFees(
        address orgContract,
        uint32 hauskaFeePct,
        uint32 integratorFeePct
    ) external onlyRole(DISTRIBUTOR_ADMIN_ROLE) {
        require(hauskaFeePct <= 2000, "Hauska fee too high"); // Max 20%
        require(integratorFeePct <= 500, "Integrator fee too high"); // Max 5%
        
        hasCustomFees[orgContract] = true;
        customHauskaFees[orgContract] = hauskaFeePct;
        customIntegratorFees[orgContract] = integratorFeePct;
        
        emit CustomFeesSet(orgContract, hauskaFeePct, integratorFeePct);
    }
    
    function removeCustomFees(address orgContract) external onlyRole(DISTRIBUTOR_ADMIN_ROLE) {
        hasCustomFees[orgContract] = false;
        delete customHauskaFees[orgContract];
        delete customIntegratorFees[orgContract];
    }
    
    function _getFees(address orgContract) private view returns (uint32 integratorFee, uint32 hauskaFee) {
        if (hasCustomFees[orgContract]) {
            return (customIntegratorFees[orgContract], customHauskaFees[orgContract]);
        } else {
            return IHauskaContractFactory(factory).getPlatformFees();
        }
    }
    
    // Analytics functions
    function getRevenueStats(address orgContract) external view returns (
        uint256 total,
        uint256 creatorTotal,
        uint256 hauskaTotal,
        uint256 integratorTotal
    ) {
        total = totalRevenueDistributed[orgContract];
        creatorTotal = orgCreatorRevenue[orgContract];
        hauskaTotal = orgHauskaRevenue[orgContract];
        integratorTotal = orgIntegratorRevenue[orgContract];
        
        return (total, creatorTotal, hauskaTotal, integratorTotal);
    }
    
    function getOrgPendingTotal(address orgContract) external view returns (uint256) {
        (uint256 pendingHauska, uint256 pendingIntegrator, uint256 pendingCreators) = _getOrgPendingEarnings(orgContract);
        return pendingHauska + pendingIntegrator + pendingCreators;
    }
    
    function getOrgDistributedTotal(address orgContract) external view returns (uint256) {
        (uint256 distributedHauska, uint256 distributedIntegrator, uint256 distributedCreators) = _getOrgDistributedEarnings(orgContract);
        return distributedHauska + distributedIntegrator + distributedCreators;
    }
    
    // Principal withdrawal of all organization earnings
    function withdrawAllOrgEarnings(address orgContract) external nonReentrant {
        // Verify caller is principal of the organization
        IHauskaOrgContract org = IHauskaOrgContract(orgContract);
        require(org.hasRole(PRINCIPAL_ROLE, msg.sender), "Not organization principal");
        
        // Get all pending earnings for this organization
        (uint256 pendingHauska, uint256 pendingIntegrator, uint256 pendingCreators) = _getOrgPendingEarnings(orgContract);
        
        uint256 totalAmount = pendingHauska + pendingIntegrator + pendingCreators;
        require(totalAmount > 0, "No pending organization earnings");
        
        // Transfer Hauska earnings to factory
        if (pendingHauska > 0) {
            pendingHauskaEarnings = 0;
            distributedHauskaEarnings[orgContract] += pendingHauska;
            IERC20(usdcToken).safeTransfer(factory, pendingHauska);
            emit EarningsWithdrawn(factory, pendingHauska, "hauska");
        }
        
        // Transfer integrator earnings to integrator address
        if (pendingIntegrator > 0) {
            address integrator = org.getIntegrator();
            pendingIntegratorEarnings[orgContract] = 0;
            distributedIntegratorEarnings[orgContract] += pendingIntegrator;
            IERC20(usdcToken).safeTransfer(integrator, pendingIntegrator);
            emit EarningsWithdrawn(integrator, pendingIntegrator, "integrator");
        }
        
        // Transfer creator earnings to individual creators
        if (pendingCreators > 0) {
            address[] memory creators = org.getCreators();
            for (uint256 i = 0; i < creators.length; i++) {
                uint256 creatorAmount = pendingCreatorEarnings[creators[i]];
                if (creatorAmount > 0) {
                    pendingCreatorEarnings[creators[i]] = 0;
                    IERC20(usdcToken).safeTransfer(creators[i], creatorAmount);
                    emit EarningsWithdrawn(creators[i], creatorAmount, "creator");
                }
            }
            distributedCreatorsEarnings[orgContract] += pendingCreators;
        }
    }

    function getCustomFees(address orgContract) external view returns (uint32 hauskaFeePct, uint32 integratorFeePct) {
        if (hasCustomFees[orgContract]) {
            return (customIntegratorFees[orgContract], customHauskaFees[orgContract]);
        } else {
            return IHauskaContractFactory(factory).getPlatformFees();
        }
    }
}