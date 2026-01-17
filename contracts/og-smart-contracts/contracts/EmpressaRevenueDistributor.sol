// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IEmpressaContracts.sol";

/**
 * @title EmpressaRevenueDistributor
 * @notice Distributes revenue from asset sales with tiered fee system:
 *         Fee Tiers (based on cumulative org revenue):
 *         - Tier 1 (0-10M): 1.5% platform, 0.02% referral (fixed)
 *         - Tier 2 (10M-100M): 1% platform, 0.02% referral (fixed)
 *         - Tier 3 (100M+): 0.5% platform, 0.02% referral (fixed)
 *         Platform fee split equally (25% each) to:
 *         1. Empressa Marketplace LLC
 *         2. NV Wallet
 *         3. HM Wallet
 *         4. Blank Wallet
 *         Plus: Referral Fee Wallet (fixed 0.02% for all tiers)
 */
contract EmpressaRevenueDistributor is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant DISTRIBUTOR_ADMIN_ROLE = keccak256("DISTRIBUTOR_ADMIN_ROLE");
    bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");
    bytes32 public constant PRINCIPAL_ROLE = keccak256("PRINCIPAL_ROLE");
    
    address public immutable factory;
    address public immutable usdcToken;
    
    // Wallet addresses for payee slots
    address public empressaMarketplaceWallet;  // Empressa Marketplace LLC wallet
    address public nvWallet;                   // NV wallet
    address public hmWallet;                   // HM wallet
    address public blankWallet;                // Blank wallet (renamed from broker)
    
    // Tier thresholds (in USDC, 6 decimals)
    uint256 public constant TIER_1_MAX = 10_000_000 * 1e6;  // $10M
    uint256 public constant TIER_2_MAX = 100_000_000 * 1e6; // $100M
    
    // Tier-based fee percentages (basis points: 10000 = 100%)
    // Tier 1: 0-10M
    uint32 public constant TIER_1_PLATFORM_FEE = 150;      // 1.5% = 150 basis points
    
    // Tier 2: 10M-100M
    uint32 public constant TIER_2_PLATFORM_FEE = 100;     // 1% = 100 basis points
    
    // Tier 3: 100M+
    uint32 public constant TIER_3_PLATFORM_FEE = 50;       // 0.5% = 50 basis points
    
    // Referral fee is fixed at 0.02% (2 basis points) for all tiers
    uint32 public constant REFERRAL_FEE = 2;               // 0.02% = 2 basis points
    
    // Platform fee distribution (25% each to 4 wallets)
    uint32 public constant PLATFORM_FEE_SHARE = 2500;      // 25% = 2500 basis points
    
    // Platform fee application modes
    enum FeeApplication {
        BUY_SIDE_ONLY,    // 100% on buyer
        SELL_SIDE_ONLY,   // 100% on seller
        SPLIT             // Configurable split between buyer and seller
    }
    
    // Fee application configuration
    FeeApplication public feeApplication = FeeApplication.SELL_SIDE_ONLY; // Default: seller pays
    uint256 public buySidePercentage = 5000; // For split mode: 50% (5000 basis points = 50%)
    
    // Revenue tracking
    mapping(address => uint256) public totalRevenueDistributed;
    
    // Cumulative revenue per organization (for tier determination)
    mapping(address => uint256) public cumulativeOrgRevenue;
    
    // Promo code system
    struct PromoCode {
        string code;
        bool isActive;
        uint256 expiryTimestamp;
        uint256 maxUses;
        uint256 currentUses;
        bool makesFree;  // true for NAPE26 - makes platform fee 0%
    }
    
    mapping(string => PromoCode) public promoCodes;
    mapping(string => mapping(address => uint256)) public promoCodeUsage; // promo code => org => usage count
    
    // Pending earnings (accumulated, not yet withdrawn) - per organization
    mapping(address => uint256) public pendingEmpressaEarnings;
    mapping(address => uint256) public pendingReferralEarnings;
    mapping(address => uint256) public pendingNVEarnings;
    mapping(address => uint256) public pendingHMEarnings;
    mapping(address => uint256) public pendingBrokerEarnings;
    mapping(address => uint256) public pendingSellerEarnings;
    
    // Total earnings (including withdrawn amounts)
    mapping(address => uint256) public totalEmpressaEarnings;
    mapping(address => uint256) public totalReferralEarnings;
    mapping(address => uint256) public totalNVEarnings;
    mapping(address => uint256) public totalHMEarnings;
    mapping(address => uint256) public totalBrokerEarnings;
    mapping(address => uint256) public totalSellerEarnings;
    
    // Distributed earnings tracking per organization
    mapping(address => uint256) public distributedEmpressaEarnings;
    mapping(address => uint256) public distributedReferralEarnings;
    mapping(address => uint256) public distributedNVEarnings;
    mapping(address => uint256) public distributedHMEarnings;
    mapping(address => uint256) public distributedBrokerEarnings;
    mapping(address => uint256) public distributedSellerEarnings;
    
    // Per-organization revenue tracking
    mapping(address => uint256) public orgEmpressaRevenue;
    mapping(address => uint256) public orgReferralRevenue;
    mapping(address => uint256) public orgNVRevenue;
    mapping(address => uint256) public orgHMRevenue;
    mapping(address => uint256) public orgBrokerRevenue;
    mapping(address => uint256) public orgSellerRevenue;
    
    event RevenueDistributed(
        address indexed orgContract,
        uint256 indexed assetId,
        uint256 sellerAmount,
        uint256 empressaAmount,
        uint256 referralAmount,
        uint256 nvAmount,
        uint256 hmAmount,
        uint256 blankAmount,
        uint8 tier,
        uint256 buySideFee,
        uint256 sellSideFee,
        string promoCode
    );
    
    event WalletAddressSet(
        string walletType,
        address indexed oldAddress,
        address indexed newAddress
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
    
    event PromoCodeUsed(
        address indexed orgContract,
        string promoCode,
        uint256 savings
    );
    
    event PromoCodeCreated(
        string code,
        uint256 expiry,
        uint256 maxUses,
        bool makesFree
    );
    
    event PromoCodeDeactivated(string code);
    
    event FeeApplicationUpdated(
        FeeApplication application,
        uint256 buySidePct
    );
    
    modifier onlyAuthorized() {
        require(hasRole(AUTHORIZED_CONTRACT_ROLE, msg.sender), "Caller not authorized");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(DISTRIBUTOR_ADMIN_ROLE, msg.sender), "Caller not admin");
        _;
    }
    
    constructor(
        address _factory,
        address _usdcToken,
        address _empressaMarketplaceWallet,
        address _nvWallet,
        address _hmWallet,
        address _blankWallet
    ) {
        require(_factory != address(0), "Invalid factory");
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_empressaMarketplaceWallet != address(0), "Invalid Empressa wallet");
        require(_nvWallet != address(0), "Invalid NV wallet");
        require(_hmWallet != address(0), "Invalid HM wallet");
        require(_blankWallet != address(0), "Invalid Blank wallet");
        
        factory = _factory;
        usdcToken = _usdcToken;
        empressaMarketplaceWallet = _empressaMarketplaceWallet;
        nvWallet = _nvWallet;
        hmWallet = _hmWallet;
        blankWallet = _blankWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Set wallet addresses (admin only)
     */
    function setEmpressaWallet(address _wallet) external onlyAdmin {
        address oldWallet = empressaMarketplaceWallet;
        empressaMarketplaceWallet = _wallet;
        emit WalletAddressSet("Empressa", oldWallet, _wallet);
    }
    
    function setNVWallet(address _wallet) external onlyAdmin {
        address oldWallet = nvWallet;
        nvWallet = _wallet;
        emit WalletAddressSet("NV", oldWallet, _wallet);
    }
    
    function setHMWallet(address _wallet) external onlyAdmin {
        address oldWallet = hmWallet;
        hmWallet = _wallet;
        emit WalletAddressSet("HM", oldWallet, _wallet);
    }
    
    function setBlankWallet(address _wallet) external onlyAdmin {
        address oldWallet = blankWallet;
        blankWallet = _wallet;
        emit WalletAddressSet("Blank", oldWallet, _wallet);
    }
    
    /**
     * @notice Get fee tier based on cumulative revenue
     * @param cumulativeRevenue The cumulative revenue for the organization
     * @return tier The tier number (1, 2, or 3)
     * @return platformFeePct Platform fee percentage in basis points
     * @return referralFeePct Referral fee percentage in basis points
     */
    function getFeeTier(uint256 cumulativeRevenue) public pure returns (
        uint8 tier,
        uint32 platformFeePct,
        uint32 referralFeePct
    ) {
        if (cumulativeRevenue < TIER_1_MAX) {
            // Tier 1: 0 - $10M
            return (1, TIER_1_PLATFORM_FEE, REFERRAL_FEE);
        } else if (cumulativeRevenue < TIER_2_MAX) {
            // Tier 2: $10M - $100M
            return (2, TIER_2_PLATFORM_FEE, REFERRAL_FEE);
        } else {
            // Tier 3: $100M+
            return (3, TIER_3_PLATFORM_FEE, REFERRAL_FEE);
        }
    }
    
    /**
     * @notice Get organization's current fee tier
     * @param orgContract The organization contract address
     * @return tier The tier number (1, 2, or 3)
     * @return cumulativeRevenue Current cumulative revenue
     * @return platformFeePct Platform fee percentage in basis points
     * @return referralFeePct Referral fee percentage in basis points
     */
    function getOrgRevenueTier(address orgContract) external view returns (
        uint8 tier,
        uint256 cumulativeRevenue,
        uint32 platformFeePct,
        uint32 referralFeePct
    ) {
        cumulativeRevenue = cumulativeOrgRevenue[orgContract];
        (tier, platformFeePct, referralFeePct) = getFeeTier(cumulativeRevenue);
    }
    
    /**
     * @notice Validate promo code for an organization
     * @param promoCode The promo code string
     * @param orgContract The organization contract address
     * @return isValid True if promo code is valid and can be used
     */
    function validatePromoCode(string calldata promoCode, address orgContract) public view returns (bool isValid) {
        // Empty promo code is always valid (no promo applied)
        if (bytes(promoCode).length == 0) {
            return true;
        }
        
        PromoCode memory code = promoCodes[promoCode];
        
        // Check if promo code exists
        if (bytes(code.code).length == 0) {
            return false;
        }
        
        // Check if promo code is active
        if (!code.isActive) {
            return false;
        }
        
        // Check if promo code has expired
        if (code.expiryTimestamp > 0 && block.timestamp > code.expiryTimestamp) {
            return false;
        }
        
        // Check if promo code has reached max uses
        if (code.maxUses > 0 && code.currentUses >= code.maxUses) {
            return false;
        }
        
        return true;
    }
    
    /**
     * @notice Create a new promo code (admin only)
     * @param code The promo code string
     * @param expiryTimestamp Expiry timestamp (0 = no expiry)
     * @param maxUses Maximum number of uses (0 = unlimited)
     * @param makesFree If true, makes platform fee 0% (like NAPE26)
     */
    function createPromoCode(
        string calldata code,
        uint256 expiryTimestamp,
        uint256 maxUses,
        bool makesFree
    ) external onlyAdmin {
        require(bytes(code).length > 0, "Promo code cannot be empty");
        require(bytes(promoCodes[code].code).length == 0, "Promo code already exists");
        
        promoCodes[code] = PromoCode({
            code: code,
            isActive: true,
            expiryTimestamp: expiryTimestamp,
            maxUses: maxUses,
            currentUses: 0,
            makesFree: makesFree
        });
        
        emit PromoCodeCreated(code, expiryTimestamp, maxUses, makesFree);
    }
    
    /**
     * @notice Deactivate a promo code (admin only)
     * @param code The promo code string
     */
    function deactivatePromoCode(string calldata code) external onlyAdmin {
        require(bytes(promoCodes[code].code).length > 0, "Promo code does not exist");
        promoCodes[code].isActive = false;
        emit PromoCodeDeactivated(code);
    }
    
    /**
     * @notice Update promo code expiry (admin only)
     * @param code The promo code string
     * @param newExpiry New expiry timestamp (0 = no expiry)
     */
    function updatePromoCodeExpiry(string calldata code, uint256 newExpiry) external onlyAdmin {
        require(bytes(promoCodes[code].code).length > 0, "Promo code does not exist");
        promoCodes[code].expiryTimestamp = newExpiry;
    }
    
    /**
     * @notice Get promo code details
     * @param code The promo code string
     * @return promoCode The promo code struct
     */
    function getPromoCode(string calldata code) external view returns (PromoCode memory promoCode) {
        return promoCodes[code];
    }
    
    /**
     * @notice Initialize NAPE26 promo code (admin only)
     * @dev Creates the NAPE26 promo code that makes platform fees FREE (0%)
     * @param expiryTimestamp Expiry timestamp (0 = no expiry)
     * @param maxUses Maximum number of uses (0 = unlimited)
     */
    function initializeNAPE26(uint256 expiryTimestamp, uint256 maxUses) external onlyAdmin {
        require(bytes(promoCodes["NAPE26"].code).length == 0, "NAPE26 already exists");
        
        promoCodes["NAPE26"] = PromoCode({
            code: "NAPE26",
            isActive: true,
            expiryTimestamp: expiryTimestamp,
            maxUses: maxUses,
            currentUses: 0,
            makesFree: true
        });
        
        emit PromoCodeCreated("NAPE26", expiryTimestamp, maxUses, true);
    }
    
    /**
     * @notice Set platform fee application mode (admin only)
     * @param application The fee application mode (BUY_SIDE_ONLY, SELL_SIDE_ONLY, or SPLIT)
     * @param buySidePct For SPLIT mode: buy-side percentage in basis points (0-10000)
     *                    For BUY_SIDE_ONLY: ignored (treated as 10000)
     *                    For SELL_SIDE_ONLY: ignored (treated as 0)
     */
    function setFeeApplication(FeeApplication application, uint256 buySidePct) external onlyAdmin {
        if (application == FeeApplication.SPLIT) {
            require(buySidePct <= 10000, "Buy-side percentage cannot exceed 100%");
            buySidePercentage = buySidePct;
        } else if (application == FeeApplication.BUY_SIDE_ONLY) {
            buySidePercentage = 10000; // 100% on buyer
        } else {
            buySidePercentage = 0; // 100% on seller
        }
        
        feeApplication = application;
        emit FeeApplicationUpdated(application, buySidePercentage);
    }
    
    /**
     * @notice Get current fee application configuration
     * @return application Current fee application mode
     * @return buySidePct Current buy-side percentage (basis points)
     */
    function getFeeApplication() external view returns (FeeApplication application, uint256 buySidePct) {
        return (feeApplication, buySidePercentage);
    }
    
    /**
     * @notice Distribute revenue from asset sale
     * @param assetId The asset ID being sold
     * @param licensee The buyer/licensee address
     * @param from The address paying (usually same as licensee)
     * @param amount The total sale amount
     * @param assetOwner The seller/asset owner address
     * @param referralWallet The referral fee wallet (can be address(0) if no referral)
     * @param orgContract The organization contract address
     * @param promoCode Optional promo code (empty string if none)
     * @param feeMode Fee application mode (BUY_SIDE_ONLY, SELL_SIDE_ONLY, or SPLIT). If SPLIT, use buySidePct parameter.
     * @param buySidePct For SPLIT mode: buy-side percentage in basis points (0-10000). Ignored for BUY_SIDE_ONLY or SELL_SIDE_ONLY.
     */
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
    ) external onlyAuthorized nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(assetOwner != address(0), "Invalid asset owner");
        require(orgContract != address(0), "Invalid org contract");
        
        // Get current cumulative revenue BEFORE this transaction
        uint256 currentCumulativeRevenue = cumulativeOrgRevenue[orgContract];
        
        // Determine fee tier based on current cumulative revenue
        (uint8 tier, uint32 platformFeePct, uint32 referralFeePct) = getFeeTier(currentCumulativeRevenue);
        
        // Check and apply promo code if provided
        bool promoCodeApplied = false;
        uint256 platformFeeSavings = 0;
        if (bytes(promoCode).length > 0) {
            require(validatePromoCode(promoCode, orgContract), "Invalid or expired promo code");
            
            PromoCode memory code = promoCodes[promoCode];
            if (code.makesFree) {
                // Promo code makes platform fee FREE (0%)
                platformFeeSavings = (amount * platformFeePct) / 10000;
                platformFeePct = 0;
                promoCodeApplied = true;
                
                // Increment usage counter
                promoCodes[promoCode].currentUses++;
                promoCodeUsage[promoCode][orgContract]++;
            }
        }
        
        // Calculate platform fee based on tier (may be 0% if promo code applied)
        uint256 platformFeeTotal = (amount * platformFeePct) / 10000;
        
        // Validate and prepare fee application parameters
        uint256 effectiveBuySidePct = buySidePct;
        if (feeMode == FeeApplication.SPLIT) {
            require(buySidePct <= 10000, "Buy-side percentage cannot exceed 100%");
        } else if (feeMode == FeeApplication.BUY_SIDE_ONLY) {
            effectiveBuySidePct = 10000; // 100% on buyer
        } else {
            // SELL_SIDE_ONLY
            effectiveBuySidePct = 0; // 100% on seller
        }
        
        // Split platform fee between buy-side and sell-side based on fee application mode
        uint256 buySideFee = 0;
        uint256 sellSideFee = 0;
        
        if (platformFeeTotal > 0) {
            if (feeMode == FeeApplication.BUY_SIDE_ONLY) {
                buySideFee = platformFeeTotal;
                sellSideFee = 0;
            } else if (feeMode == FeeApplication.SELL_SIDE_ONLY) {
                buySideFee = 0;
                sellSideFee = platformFeeTotal;
            } else {
                // SPLIT mode
                buySideFee = (platformFeeTotal * effectiveBuySidePct) / 10000;
                sellSideFee = platformFeeTotal - buySideFee;
            }
        }
        
        // Split platform fee equally (25% each) among 4 wallets
        // Note: The total platform fee is split among wallets, but the payment responsibility
        // (buy-side vs sell-side) is tracked separately
        uint256 platformFeeShare = (platformFeeTotal * PLATFORM_FEE_SHARE) / 10000;
        uint256 empressaFee = platformFeeShare;
        uint256 nvFee = platformFeeShare;
        uint256 hmFee = platformFeeShare;
        uint256 blankFee = platformFeeShare;
        
        // Calculate referral fee (fixed 0.02% for all tiers, always on seller side)
        uint256 referralFee = 0;
        if (referralWallet != address(0)) {
            referralFee = (amount * REFERRAL_FEE) / 10000;
        }
        
        // Calculate amounts:
        // - Buyer pays: amount + buySideFee
        // - Seller receives: amount - sellSideFee - referralFee
        uint256 sellerAmount = amount - sellSideFee - referralFee;
        
        // Transfer from payer to this contract
        IERC20(usdcToken).safeTransferFrom(from, address(this), amount);
        
        // Update earnings tracking
        totalRevenueDistributed[orgContract] += amount;
        
        // Update cumulative revenue AFTER calculating fees (for next transaction)
        cumulativeOrgRevenue[orgContract] += amount;
        
        // Accumulate pending earnings (not distributed immediately)
        if (empressaFee > 0) {
            pendingEmpressaEarnings[orgContract] += empressaFee;
            totalEmpressaEarnings[orgContract] += empressaFee;
            emit EarningsAccumulated(empressaMarketplaceWallet, empressaFee, "empressa");
        }
        
        if (nvFee > 0) {
            pendingNVEarnings[orgContract] += nvFee;
            totalNVEarnings[orgContract] += nvFee;
            emit EarningsAccumulated(nvWallet, nvFee, "nv");
        }
        
        if (hmFee > 0) {
            pendingHMEarnings[orgContract] += hmFee;
            totalHMEarnings[orgContract] += hmFee;
            emit EarningsAccumulated(hmWallet, hmFee, "hm");
        }
        
        if (blankFee > 0) {
            pendingBrokerEarnings[orgContract] += blankFee;
            totalBrokerEarnings[orgContract] += blankFee;
            emit EarningsAccumulated(blankWallet, blankFee, "blank");
        }
        
        if (referralFee > 0 && referralWallet != address(0)) {
            pendingReferralEarnings[referralWallet] += referralFee;
            totalReferralEarnings[referralWallet] += referralFee;
            emit EarningsAccumulated(referralWallet, referralFee, "referral");
        }
        
        if (sellerAmount > 0) {
            pendingSellerEarnings[assetOwner] += sellerAmount;
            totalSellerEarnings[assetOwner] += sellerAmount;
            emit EarningsAccumulated(assetOwner, sellerAmount, "seller");
        }
        
        // Emit promo code usage event if applied
        if (promoCodeApplied && platformFeeSavings > 0) {
            emit PromoCodeUsed(orgContract, promoCode, platformFeeSavings);
        }
        
        // Update per-org tracking
        orgEmpressaRevenue[orgContract] += empressaFee;
        orgReferralRevenue[orgContract] += referralFee;
        orgNVRevenue[orgContract] += nvFee;
        orgHMRevenue[orgContract] += hmFee;
        orgBrokerRevenue[orgContract] += blankFee;
        orgSellerRevenue[orgContract] += sellerAmount;
        
        emit RevenueDistributed(
            orgContract,
            assetId,
            sellerAmount,
            empressaFee,
            referralFee,
            nvFee,
            hmFee,
            blankFee,
            tier,
            buySideFee,
            sellSideFee,
            promoCode
        );
    }
    
    /**
     * @notice Get organization earnings breakdown
     */
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
    ) {
        pendingEmpressa = pendingEmpressaEarnings[orgContract];
        pendingNV = pendingNVEarnings[orgContract];
        pendingHM = pendingHMEarnings[orgContract];
        pendingBroker = pendingBrokerEarnings[orgContract];
        
        // Referral earnings are tracked per referral wallet, not per org
        // Would need to track this differently if needed per org
        pendingReferral = 0;
        
        // Seller earnings are tracked per seller address
        // Would need to query all sellers for this org if needed
        pendingSeller = 0;
        
        distributedEmpressa = distributedEmpressaEarnings[orgContract];
        distributedReferral = distributedReferralEarnings[orgContract];
        distributedNV = distributedNVEarnings[orgContract];
        distributedHM = distributedHMEarnings[orgContract];
        distributedBroker = distributedBrokerEarnings[orgContract];
        distributedSeller = distributedSellerEarnings[orgContract];
    }
    
    /**
     * @notice Get revenue statistics for an organization
     */
    function getRevenueStats(address orgContract) external view returns (
        uint256 total,
        uint256 empressaTotal,
        uint256 referralTotal,
        uint256 nvTotal,
        uint256 hmTotal,
        uint256 brokerTotal,
        uint256 sellerTotal
    ) {
        total = totalRevenueDistributed[orgContract];
        empressaTotal = orgEmpressaRevenue[orgContract];
        referralTotal = orgReferralRevenue[orgContract];
        nvTotal = orgNVRevenue[orgContract];
        hmTotal = orgHMRevenue[orgContract];
        brokerTotal = orgBrokerRevenue[orgContract];
        sellerTotal = orgSellerRevenue[orgContract];
    }
    
    /**
     * @notice Get total pending earnings for an organization
     */
    function getOrgPendingTotal(address orgContract) external view returns (uint256) {
        return pendingEmpressaEarnings[orgContract] +
               pendingNVEarnings[orgContract] +
               pendingHMEarnings[orgContract] +
               pendingBrokerEarnings[orgContract];
        // Note: Referral and seller earnings are tracked per wallet, not per org
    }
    
    /**
     * @notice Get total distributed earnings for an organization
     */
    function getOrgDistributedTotal(address orgContract) external view returns (uint256) {
        return distributedEmpressaEarnings[orgContract] +
               distributedReferralEarnings[orgContract] +
               distributedNVEarnings[orgContract] +
               distributedHMEarnings[orgContract] +
               distributedBrokerEarnings[orgContract] +
               distributedSellerEarnings[orgContract];
    }
    
    /**
     * @notice Withdraw all pending earnings for an organization (Principal only)
     */
    function withdrawAllOrgEarnings(address orgContract) external nonReentrant {
        // Verify caller is principal of the organization
        IEmpressaOrgContract org = IEmpressaOrgContract(orgContract);
        require(org.hasRole(PRINCIPAL_ROLE, msg.sender), "Not organization principal");
        
        uint256 totalAmount = 0;
        
        // Transfer Empressa earnings
        uint256 empressaAmount = pendingEmpressaEarnings[orgContract];
        if (empressaAmount > 0) {
            pendingEmpressaEarnings[orgContract] = 0;
            distributedEmpressaEarnings[orgContract] += empressaAmount;
            IERC20(usdcToken).safeTransfer(empressaMarketplaceWallet, empressaAmount);
            emit EarningsWithdrawn(empressaMarketplaceWallet, empressaAmount, "empressa");
            totalAmount += empressaAmount;
        }
        
        // Transfer NV earnings (0% for now, but handle for future)
        uint256 nvAmount = pendingNVEarnings[orgContract];
        if (nvAmount > 0) {
            pendingNVEarnings[orgContract] = 0;
            distributedNVEarnings[orgContract] += nvAmount;
            IERC20(usdcToken).safeTransfer(nvWallet, nvAmount);
            emit EarningsWithdrawn(nvWallet, nvAmount, "nv");
            totalAmount += nvAmount;
        }
        
        // Transfer HM earnings (0% for now, but handle for future)
        uint256 hmAmount = pendingHMEarnings[orgContract];
        if (hmAmount > 0) {
            pendingHMEarnings[orgContract] = 0;
            distributedHMEarnings[orgContract] += hmAmount;
            IERC20(usdcToken).safeTransfer(hmWallet, hmAmount);
            emit EarningsWithdrawn(hmWallet, hmAmount, "hm");
            totalAmount += hmAmount;
        }
        
        // Transfer Blank earnings
        uint256 blankAmount = pendingBrokerEarnings[orgContract];
        if (blankAmount > 0) {
            pendingBrokerEarnings[orgContract] = 0;
            distributedBrokerEarnings[orgContract] += blankAmount;
            IERC20(usdcToken).safeTransfer(blankWallet, blankAmount);
            emit EarningsWithdrawn(blankWallet, blankAmount, "blank");
            totalAmount += blankAmount;
        }
        
        require(totalAmount > 0, "No pending organization earnings");
    }
    
    /**
     * @notice Withdraw referral earnings (anyone with pending referral earnings)
     */
    function withdrawReferralEarnings() external nonReentrant {
        uint256 amount = pendingReferralEarnings[msg.sender];
        require(amount > 0, "No pending referral earnings");
        
        pendingReferralEarnings[msg.sender] = 0;
        IERC20(usdcToken).safeTransfer(msg.sender, amount);
        emit EarningsWithdrawn(msg.sender, amount, "referral");
    }
    
    /**
     * @notice Withdraw seller earnings (anyone with pending seller earnings)
     */
    function withdrawSellerEarnings() external nonReentrant {
        uint256 amount = pendingSellerEarnings[msg.sender];
        require(amount > 0, "No pending seller earnings");
        
        pendingSellerEarnings[msg.sender] = 0;
        IERC20(usdcToken).safeTransfer(msg.sender, amount);
        emit EarningsWithdrawn(msg.sender, amount, "seller");
    }
    
    /**
     * @notice Add authorized contract that can call distributeRevenue
     */
    function addAuthorizedContract(address contractAddress) external onlyAdmin {
        _grantRole(AUTHORIZED_CONTRACT_ROLE, contractAddress);
    }
    
    /**
     * @notice Remove authorized contract
     */
    function removeAuthorizedContract(address contractAddress) external onlyAdmin {
        _revokeRole(AUTHORIZED_CONTRACT_ROLE, contractAddress);
    }
    
    /**
     * @notice Get fee tier constants
     * @return tier1PlatformFee Tier 1 platform fee (basis points)
     * @return tier1ReferralFee Tier 1 referral fee (basis points)
     * @return tier2PlatformFee Tier 2 platform fee (basis points)
     * @return tier2ReferralFee Tier 2 referral fee (basis points)
     * @return tier3PlatformFee Tier 3 platform fee (basis points)
     * @return tier3ReferralFee Tier 3 referral fee (basis points)
     */
    function getFeeTierConstants() external pure returns (
        uint32 tier1PlatformFee,
        uint32 tier1ReferralFee,
        uint32 tier2PlatformFee,
        uint32 tier2ReferralFee,
        uint32 tier3PlatformFee,
        uint32 tier3ReferralFee
    ) {
        // Referral fee is fixed at 0.02% (2 basis points) for all tiers
        return (
            TIER_1_PLATFORM_FEE,
            REFERRAL_FEE,
            TIER_2_PLATFORM_FEE,
            REFERRAL_FEE,
            TIER_3_PLATFORM_FEE,
            REFERRAL_FEE
        );
    }
}
