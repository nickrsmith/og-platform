# Tiered Fee Structure & Promo Code Implementation - Task Plan

**Status:** In Progress  
**Created:** 2024  
**Goal:** Implement tiered fee structure with promo code support (NAPE26) and flexible platform fee application

---

## Overview

This task plan tracks the implementation of:
- **Tiered Fee Structure:** Based on cumulative organization revenue
  - Tier 1 (0-10M): 1.5% platform fee
  - Tier 2 (10M-100M): 1% platform fee
  - Tier 3 (100M+): 0.5% platform fee
- **Promo Code System:** NAPE26 makes platform fees FREE (0%)
- **Platform Fee Application:** Configurable (buy side, sell side, or split)
- **Referral Fees:** Tier-based (0.03%, 0.02%, 0.01%) - unaffected by promo codes
- **Platform Fee Distribution:** Split equally (25% each) among Empressa, HM, NV, Blank wallets

---

## Phase 1: Fee Tier System Design ✅ COMPLETED

### Task 1.1: Define Fee Tier Structure ✅
- [x] Document Tier 1: 0-10M = 1.5% platform, 0.03% referral
- [x] Document Tier 2: 10M-100M = 1% platform, 0.02% referral
- [x] Document Tier 3: 100M+ = 0.5% platform, 0.01% referral
- [x] Create FEE_TIER_SCENARIOS.md with all scenarios
- [x] Document platform fee application options (buy/sell/split)
- [x] Document platform fee distribution (25% each to 4 wallets)

### Task 1.2: Document Promo Code System ✅
- [x] Define NAPE26 promo code behavior (0% platform fee)
- [x] Document that referral fees are unaffected by promo codes
- [x] Create promo code scenarios in FEE_TIER_SCENARIOS.md
- [x] Document promo code validation requirements

---

## Phase 2: Smart Contract Updates - Core Fee Logic

### Task 2.1: Update EmpressaRevenueDistributor - Fee Tier Calculation
- [ ] Add cumulative revenue tracking per organization
- [ ] Implement `getFeeTier()` function:
  - [ ] Takes cumulative revenue as input
  - [ ] Returns tier (1, 2, or 3)
  - [ ] Returns platform fee percentage (150, 100, or 50 basis points)
  - [ ] Returns referral fee percentage (3, 2, or 1 basis points)
- [ ] Update `distributeRevenue()` to:
  - [ ] Get current cumulative revenue for org
  - [ ] Determine fee tier
  - [ ] Calculate platform fee based on tier
  - [ ] Calculate referral fee based on tier
  - [ ] Apply promo code if provided (reduce platform fee to 0%)

### Task 2.2: Update EmpressaRevenueDistributor - Promo Code System
- [ ] Add promo code struct:
  ```solidity
  struct PromoCode {
      string code;
      bool isActive;
      uint256 expiryTimestamp;
      uint256 maxUses;
      uint256 currentUses;
      bool makesFree; // true for NAPE26
  }
  ```
- [ ] Add mapping: `mapping(string => PromoCode) public promoCodes;`
- [ ] Add mapping: `mapping(string => mapping(address => uint256)) public promoCodeUsage;` // per org
- [ ] Add admin functions:
  - [ ] `createPromoCode(string code, uint256 expiry, uint256 maxUses, bool makesFree)`
  - [ ] `deactivatePromoCode(string code)`
  - [ ] `updatePromoCodeExpiry(string code, uint256 newExpiry)`
- [ ] Add validation function: `validatePromoCode(string code, address orgContract) returns (bool)`
- [ ] Update `distributeRevenue()` to accept optional `promoCode` parameter
- [ ] Apply promo code logic: if valid and `makesFree = true`, set platform fee to 0%

### Task 2.3: Update EmpressaRevenueDistributor - Platform Fee Application
- [ ] Add enum for fee application:
  ```solidity
  enum FeeApplication {
      BUY_SIDE_ONLY,    // 100% on buyer
      SELL_SIDE_ONLY,   // 100% on seller
      SPLIT             // Configurable split
  }
  ```
- [ ] Add state variable: `FeeApplication public feeApplication;`
- [ ] Add state variable: `uint256 public buySidePercentage;` // For split (basis points, 0-10000)
- [ ] Add admin function: `setFeeApplication(FeeApplication application, uint256 buySidePct)`
- [ ] Update `distributeRevenue()` to:
  - [ ] Calculate total platform fee
  - [ ] Split based on `feeApplication`:
    - BUY_SIDE_ONLY: buyer pays 100%, seller pays 0%
    - SELL_SIDE_ONLY: buyer pays 0%, seller pays 100%
    - SPLIT: use `buySidePercentage` to split
  - [ ] Track buy-side and sell-side fees separately
  - [ ] Update buyer payment amount (if buy-side fee > 0)
  - [ ] Update seller proceeds (if sell-side fee > 0)

### Task 2.4: Update EmpressaRevenueDistributor - Platform Fee Distribution
- [ ] Update platform fee distribution to split equally (25% each):
  - [ ] Empressa Wallet: 25%
  - [ ] HM Wallet: 25%
  - [ ] NV Wallet: 25%
  - [ ] Blank Wallet: 25%
- [ ] Keep referral fee separate (goes to Blank Wallet)
- [ ] Update earnings tracking for all 4 platform fee recipients
- [ ] Update events to include all 4 platform fee amounts

### Task 2.5: Update EmpressaRevenueDistributor - Cumulative Revenue Tracking
- [ ] Add mapping: `mapping(address => uint256) public cumulativeOrgRevenue;`
- [ ] Update `distributeRevenue()` to:
  - [ ] Read current cumulative revenue BEFORE calculating fees
  - [ ] Determine tier based on current cumulative revenue
  - [ ] After distribution, update cumulative revenue: `cumulativeOrgRevenue[orgContract] += amount`
- [ ] Add view function: `getOrgRevenueTier(address orgContract) returns (uint8 tier, uint256 cumulativeRevenue)`

---

## Phase 3: Smart Contract Updates - Interface & Events

### Task 3.1: Update IEmpressaContracts Interface
- [ ] Add promo code parameter to `distributeRevenue()`:
  ```solidity
  function distributeRevenue(
      uint256 assetId,
      address licensee,
      address from,
      uint256 amount,
      address assetOwner,
      address referralWallet,
      address orgContract,
      string calldata promoCode  // NEW
  ) external;
  ```
- [ ] Add fee tier getter functions to interface
- [ ] Add promo code management functions to interface
- [ ] Add fee application getter functions to interface

### Task 3.2: Update Events
- [ ] Update `RevenueDistributed` event to include:
  - [ ] `uint8 tier` - fee tier used
  - [ ] `string promoCode` - promo code used (empty if none)
  - [ ] `uint256 buySideFee` - fee paid by buyer
  - [ ] `uint256 sellSideFee` - fee paid by seller
  - [ ] `uint256 platformFeeTotal` - total platform fee
- [ ] Add new event: `PromoCodeUsed(address indexed orgContract, string promoCode, uint256 savings)`
- [ ] Add new event: `FeeApplicationUpdated(FeeApplication application, uint256 buySidePct)`
- [ ] Add new event: `PromoCodeCreated(string code, uint256 expiry, uint256 maxUses)`

---

## Phase 4: Smart Contract Updates - Calling Contracts

### Task 4.1: Update EmpressaLicenseManager
- [ ] Update `distributeRevenue()` calls to include promo code parameter
- [ ] Add promo code parameter to license/purchase functions (if applicable)
- [ ] Pass promo code through to revenue distributor
- [ ] Update interface imports

### Task 4.2: Update EmpressaLicenseManagerV2
- [ ] Update `distributeRevenue()` calls to include promo code parameter
- [ ] Add promo code parameter to license/purchase functions
- [ ] Pass promo code through to revenue distributor
- [ ] Update interface imports

### Task 4.3: Update Other Calling Contracts
- [ ] Find all contracts that call `distributeRevenue()`
- [ ] Update all calls to include promo code parameter (can be empty string "")
- [ ] Test compilation after updates

---

## Phase 5: Backend API Updates

### Task 5.1: Update Revenue Service
- [ ] Update `calculateRevenueSplit()` to:
  - [ ] Accept cumulative revenue as parameter
  - [ ] Determine fee tier
  - [ ] Calculate platform fee based on tier
  - [ ] Accept promo code parameter
  - [ ] Apply promo code discount if valid
  - [ ] Calculate buy-side and sell-side fees based on fee application setting
- [ ] Add function: `getFeeTier(cumulativeRevenue)` returns tier info
- [ ] Add function: `validatePromoCode(code, orgContract)` returns validation result
- [ ] Update DTOs to include:
  - [ ] `cumulativeRevenue` field
  - [ ] `promoCode` field
  - [ ] `feeTier` field
  - [ ] `buySideFee` and `sellSideFee` fields

### Task 5.2: Update Blockchain Service
- [ ] Update revenue distribution calls to include promo code
- [ ] Track cumulative revenue per organization
- [ ] Query fee tier from contract
- [ ] Validate promo codes before transaction

### Task 5.3: Update Database Schema
- [ ] Add `cumulative_revenue` field to Organization table
- [ ] Add `promo_code` field to Transaction table
- [ ] Add `fee_tier` field to Transaction table
- [ ] Add `buy_side_fee` and `sell_side_fee` fields to Transaction table
- [ ] Create PromoCode table:
  - [ ] `code` (string, unique)
  - [ ] `is_active` (boolean)
  - [ ] `expiry_timestamp` (timestamp)
  - [ ] `max_uses` (integer)
  - [ ] `current_uses` (integer)
  - [ ] `makes_free` (boolean)
- [ ] Create PromoCodeUsage table (track usage per org)

---

## Phase 6: Frontend Updates

### Task 6.1: Update Transaction UI
- [ ] Add promo code input field to purchase/license forms
- [ ] Add promo code validation (check if valid before submission)
- [ ] Display fee tier information
- [ ] Display platform fee breakdown (buy-side vs sell-side)
- [ ] Show savings when promo code is applied
- [ ] Display "FREE" when NAPE26 is used

### Task 6.2: Update Fee Display
- [ ] Show tier-based fees in fee calculator
- [ ] Show cumulative revenue and current tier
- [ ] Show platform fee split (25% each to 4 wallets)
- [ ] Show referral fee separately
- [ ] Update fee preview when promo code is entered

### Task 6.3: Admin Panel Updates
- [ ] Add promo code management UI:
  - [ ] Create new promo codes
  - [ ] View existing promo codes
  - [ ] Deactivate promo codes
  - [ ] View usage statistics
- [ ] Add fee application configuration UI:
  - [ ] Set fee application mode (buy/sell/split)
  - [ ] Set buy-side percentage for split mode
- [ ] Add fee tier monitoring:
  - [ ] View cumulative revenue per organization
  - [ ] View current tier per organization
  - [ ] View tier transition history

---

## Phase 7: Testing

### Task 7.1: Unit Tests - Fee Tier Calculation
- [ ] Test Tier 1 calculation (0-10M)
- [ ] Test Tier 2 calculation (10M-100M)
- [ ] Test Tier 3 calculation (100M+)
- [ ] Test tier transition (crossing boundaries)
- [ ] Test cumulative revenue tracking

### Task 7.2: Unit Tests - Promo Code System
- [ ] Test NAPE26 promo code (makes platform fee 0%)
- [ ] Test promo code validation (active, not expired, within usage limits)
- [ ] Test promo code expiry
- [ ] Test promo code usage limits
- [ ] Test invalid promo codes
- [ ] Test that referral fees are unaffected by promo codes

### Task 7.3: Unit Tests - Platform Fee Application
- [ ] Test buy-side only (100% on buyer)
- [ ] Test sell-side only (100% on seller)
- [ ] Test split mode (50/50, 60/40, etc.)
- [ ] Test fee distribution (25% each to 4 wallets)
- [ ] Test with promo code (should still respect fee application mode)

### Task 7.4: Integration Tests
- [ ] Test full transaction flow with tier 1
- [ ] Test full transaction flow with tier 2
- [ ] Test full transaction flow with tier 3
- [ ] Test transaction with NAPE26 promo code
- [ ] Test transaction crossing tier boundaries
- [ ] Test multiple transactions updating cumulative revenue

### Task 7.5: Scenario Validation
- [ ] Validate Scenario 1: Tier 1 default ($5M sale)
- [ ] Validate Scenario 2: Tier 2 default ($25M sale)
- [ ] Validate Scenario 3: Tier 3 default ($150M sale)
- [ ] Validate Scenario 6: Tier 1 with NAPE26
- [ ] Validate Scenario 7: Tier 2 with NAPE26
- [ ] Validate Scenario 8: Tier 3 with NAPE26
- [ ] Validate all fee calculations match scenarios document

---

## Phase 8: Documentation

### Task 8.1: Update Contract Documentation
- [ ] Update NatSpec comments for all new functions
- [ ] Document fee tier system
- [ ] Document promo code system
- [ ] Document platform fee application modes
- [ ] Update README with new fee structure

### Task 8.2: Update API Documentation
- [ ] Document new revenue calculation endpoints
- [ ] Document promo code validation endpoints
- [ ] Document fee tier query endpoints
- [ ] Update request/response examples

### Task 8.3: Update User Documentation
- [ ] Create guide for fee tiers
- [ ] Create guide for promo codes
- [ ] Update transaction flow documentation
- [ ] Create admin guide for promo code management

---

## Phase 9: Deployment

### Task 9.1: Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation complete
- [ ] Promo codes configured (NAPE26 created)
- [ ] Fee application mode configured
- [ ] Wallet addresses verified

### Task 9.2: Testnet Deployment
- [ ] Deploy updated contracts to testnet
- [ ] Initialize promo codes (create NAPE26)
- [ ] Set fee application mode
- [ ] Test transactions on testnet
- [ ] Verify fee calculations
- [ ] Verify promo code functionality

### Task 9.3: Mainnet Deployment
- [ ] Deploy to mainnet
- [ ] Initialize promo codes
- [ ] Set fee application mode
- [ ] Monitor first transactions
- [ ] Verify all functionality

---

## Current Status Summary

**Completed:**
- ✅ Fee tier structure defined
- ✅ Promo code system designed (NAPE26)
- ✅ All scenarios documented in FEE_TIER_SCENARIOS.md
- ✅ Platform fee application modes documented
- ✅ Platform fee distribution documented (25% each to 4 wallets)

**In Progress:**
- ⏸️ Smart contract implementation (Phase 2)

**Pending:**
- ⏸️ All other phases

---

## Key Requirements Summary

### Fee Tiers
- **Tier 1 (0-10M):** 1.5% platform, 0.03% referral
- **Tier 2 (10M-100M):** 1% platform, 0.02% referral
- **Tier 3 (100M+):** 0.5% platform, 0.01% referral

### Promo Codes
- **NAPE26:** Makes platform fees FREE (0%) for all tiers
- Referral fees unaffected by promo codes

### Platform Fee Application
- **Buy Side Only:** Buyer pays 100% of platform fee
- **Sell Side Only:** Seller pays 100% of platform fee
- **Split:** Configurable percentage split between buyer and seller

### Platform Fee Distribution
- **Empressa Wallet:** 25%
- **HM Wallet:** 25%
- **NV Wallet:** 25%
- **Blank Wallet:** 25%
- **Referral Fee:** Additional amount to Blank Wallet (tier-based)

---

## Next Immediate Actions

1. **Start Phase 2.1** - Implement fee tier calculation in EmpressaRevenueDistributor
2. **Start Phase 2.2** - Implement promo code system
3. **Start Phase 2.3** - Implement platform fee application modes
4. **Test incrementally** - Test each feature as it's implemented

---

**Last Updated:** 2024
