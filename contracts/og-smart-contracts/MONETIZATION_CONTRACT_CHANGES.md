# Monetization Contract Changes Plan

## Overview
Restructuring the revenue distribution system to replace Empressa branding with Empressa Marketplace LLC and implement a new 5-payee slot system with referral fees.

## Changes Required

### 1. Branding Changes
- Replace all "Empressa" references with "Empressa Marketplace LLC" or appropriate variable names
- Update contract names, variable names, comments, and events

### 2. New Payment Structure

**Current Structure:**
- Empressa fee (5% default)
- Integrator fee (1% default)
- Creator/Seller amount (94% default)

**New Structure:**
- **Empressa Marketplace LLC**: 2% of sales price
- **Referral Fee Wallet**: 0.002% of sales price
- **NV Wallet**: 0% (placeholder for future use)
- **HM Wallet**: 0% (placeholder for future use)
- **Blank Wallet**: 0% (placeholder for future use)
- **Seller Wallet**: Remaining balance (97.998%)

### 3. Payee Slots

Each transaction will have 5 payee slots:
1. Empressa Marketplace LLC wallet
2. NV wallet
3. HM wallet
4. Blank wallet
5. Seller wallet

Plus a separate referral fee wallet (not a slot, but a separate payee).

## Implementation Details

### Contract: EmpressaRevenueDistributor → EmpressaRevenueDistributor

**New State Variables:**
```solidity
// Wallet addresses
address public empressaMarketplaceWallet;  // Empressa Marketplace LLC wallet
address public nvWallet;                   // NV wallet (placeholder)
address public hmWallet;                    // HM wallet (placeholder)
address public blankWallet;                // Blank wallet (placeholder)
address public referralFeeWallet;          // Referral fee wallet

// Fee percentages (basis points)
uint32 public constant EMPRESSA_FEE_PCT = 200;      // 2% = 200 basis points
uint32 public constant REFERRAL_FEE_PCT = 2;        // 0.002% = 2 basis points (0.02 / 10000)
uint32 public constant NV_FEE_PCT = 0;              // 0%
uint32 public constant HM_FEE_PCT = 0;              // 0%
uint32 public constant BLANK_FEE_PCT = 0;          // 0%

// Earnings tracking (replacing Empressa/Integrator tracking)
mapping(address => uint256) public pendingEmpressaEarnings;
mapping(address => uint256) public pendingReferralEarnings;
mapping(address => uint256) public pendingNVEarnings;
mapping(address => uint256) public pendingHMEarnings;
mapping(address => uint256) public pendingBlankEarnings;
mapping(address => uint256) public pendingSellerEarnings;

mapping(address => uint256) public totalEmpressaEarnings;
mapping(address => uint256) public totalReferralEarnings;
mapping(address => uint256) public totalNVEarnings;
mapping(address => uint256) public totalHMEarnings;
mapping(address => uint256) public totalBlankEarnings;
mapping(address => uint256) public totalSellerEarnings;

// Per-organization revenue tracking
mapping(address => uint256) public orgEmpressaRevenue;
mapping(address => uint256) public orgReferralRevenue;
mapping(address => uint256) public orgNVRevenue;
mapping(address => uint256) public orgHMRevenue;
mapping(address => uint256) public orgBlankRevenue;
mapping(address => uint256) public orgSellerRevenue;
```

**New distributeRevenue Function:**
```solidity
function distributeRevenue(
    uint256 assetId,
    address licensee,
    address from,
    uint256 amount,
    address assetOwner,  // Seller wallet
    address referralWallet,  // Referral fee wallet (can be address(0))
    address orgContract
) external onlyAuthorized nonReentrant {
    require(amount > 0, "Amount must be greater than 0");
    require(assetOwner != address(0), "Invalid asset owner");
    
    // Calculate fees (basis points)
    uint256 empressaFee = (amount * EMPRESSA_FEE_PCT) / 10000;
    uint256 referralFee = 0;
    if (referralWallet != address(0)) {
        referralFee = (amount * REFERRAL_FEE_PCT) / 10000;
    }
    uint256 nvFee = 0;  // Placeholder
    uint256 hmFee = 0;   // Placeholder
    uint256 blankFee = 0; // Placeholder
    
    // Seller gets remaining balance
    uint256 sellerAmount = amount - empressaFee - referralFee - nvFee - hmFee - blankFee;
    
    // Transfer from payer to this contract
    IERC20(usdcToken).safeTransferFrom(from, address(this), amount);
    
    // Update earnings tracking
    totalRevenueDistributed[orgContract] += amount;
    
    // Accumulate pending earnings
    if (empressaFee > 0) {
        pendingEmpressaEarnings[orgContract] += empressaFee;
        totalEmpressaEarnings[orgContract] += empressaFee;
        emit EarningsAccumulated(empressaMarketplaceWallet, empressaFee, "empressa");
    }
    
    if (referralFee > 0 && referralWallet != address(0)) {
        pendingReferralEarnings[referralWallet] += referralFee;
        totalReferralEarnings[referralWallet] += referralFee;
        emit EarningsAccumulated(referralWallet, referralFee, "referral");
    }
    
    // Placeholder wallets (0% for now)
    // NV, HM, Blank tracking kept for future use
    
    if (sellerAmount > 0) {
        pendingSellerEarnings[assetOwner] += sellerAmount;
        totalSellerEarnings[assetOwner] += sellerAmount;
        emit EarningsAccumulated(assetOwner, sellerAmount, "seller");
    }
    
    // Update per-org tracking
    orgEmpressaRevenue[orgContract] += empressaFee;
    orgReferralRevenue[orgContract] += referralFee;
    orgSellerRevenue[orgContract] += sellerAmount;
    
    emit RevenueDistributed(
        orgContract,
        assetId,
        sellerAmount,
        empressaFee,
        referralFee,
        nvFee,
        hmFee,
        blankFee
    );
}
```

## Files to Modify

### Primary Contract
1. **EmpressaRevenueDistributor.sol** → **EmpressaRevenueDistributor.sol**
   - Rename contract
   - Replace all Empressa references
   - Implement new 5-payee slot system
   - Update fee calculation logic
   - Update earnings tracking
   - Update withdrawal functions

### Interface Files
2. **IEmpressaContracts.sol** → **IEmpressaContracts.sol**
   - Update interface names
   - Update function signatures
   - Update return types

3. **IEmpressaStructs.sol** → **IEmpressaStructs.sol**
   - Update interface name (if needed)

### Other Contracts (Branding Only)
4. **EmpressaOrgContract.sol** → **EmpressaOrgContract.sol**
   - Rename contract
   - Replace Empressa references in comments/events
   - Update interface references

5. **EmpressaContractFactory.sol** → **EmpressaContractFactory.sol**
   - Rename contract
   - Update getPlatformFees() to return new fee structure
   - Replace Empressa references

6. **EmpressaLicenseManager.sol** → **EmpressaLicenseManager.sol**
   - Rename contract
   - Update revenue distributor calls
   - Replace Empressa references

7. **EmpressaLicenseManagerV2.sol** → **EmpressaLicenseManagerV2.sol**
   - Same as above

8. **EmpressaAssetRegistry.sol** → **EmpressaAssetRegistry.sol**
   - Rename contract
   - Replace Empressa references

9. **EmpressaGroupManager.sol** → **EmpressaGroupManager.sol**
   - Rename contract
   - Replace Empressa references

10. **EmpressaAssetNFT.sol** → **EmpressaAssetNFT.sol**
    - Rename contract
    - Replace Empressa references

11. **EmpressaLicenseNFT.sol** → **EmpressaLicenseNFT.sol**
    - Rename contract
    - Replace Empressa references

12. **EmpressaLicenseMetadata.sol** → **EmpressaLicenseMetadata.sol**
    - Rename contract
    - Replace Empressa references in metadata

13. **EmpressaProxy.sol** → **EmpressaProxy.sol**
    - Rename contract
    - Replace Empressa references

14. **OrgDeployer.sol**
    - Update to deploy EmpressaOrgContract instead of EmpressaOrgContract

## Fee Calculation Example

**For a $100,000 sale:**
- Empressa Marketplace LLC: $100,000 × 2% = $2,000
- Referral Fee: $100,000 × 0.002% = $2
- NV Wallet: $0 (placeholder)
- HM Wallet: $0 (placeholder)
- Blank Wallet: $0 (placeholder)
- Seller: $100,000 - $2,000 - $2 = $97,998

**Total:** $100,000 ✓

## Migration Considerations

1. **Existing Deployments**: Need to handle existing contracts on-chain
2. **Interface Compatibility**: May need to maintain backward compatibility
3. **Wallet Addresses**: Need to set Empressa, NV, HM, Blank wallet addresses in constructor or via admin function
4. **Referral Wallet**: Can be passed per transaction (optional)

## Next Steps

1. ✅ Create this planning document
2. ⏳ Rename and update EmpressaRevenueDistributor.sol
3. ⏳ Update interface files
4. ⏳ Update other contracts (branding only)
5. ⏳ Test fee calculations
6. ⏳ Update events and error messages
7. ⏳ Test withdrawal functions
