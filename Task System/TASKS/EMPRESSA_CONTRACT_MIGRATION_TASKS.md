# Empressa Contract Migration - Task Plan

**Status:** In Progress  
**Created:** [Current Date]  
**Goal:** Migrate all smart contracts from Hauska branding to Empressa Marketplace LLC with new 5-payee slot revenue distribution system

---

## Overview

This task plan tracks the migration of smart contracts from Hauska to Empressa Marketplace LLC, including:
- Branding changes (Hauska → Empressa)
- New revenue distribution system (5-payee slots + referral)
- Interface updates
- Contract renaming and updates

---

## Phase 1: Core Revenue Distributor ✅ COMPLETED

### Task 1.1: Create EmpressaRevenueDistributor Contract ✅
- [x] Create new `EmpressaRevenueDistributor.sol` contract
- [x] Implement 5-payee slot system:
  - [x] Empressa Marketplace LLC (2%)
  - [x] NV Wallet (0% placeholder)
  - [x] HM Wallet (0% placeholder)
  - [x] Broker Wallet (0% placeholder) - renamed from Blank
  - [x] Seller Wallet (remaining balance)
- [x] Implement referral fee (0.002%)
- [x] Update all fee calculations
- [x] Update earnings tracking mappings
- [x] Update withdrawal functions
- [x] Update events

### Task 1.2: Rename Blank Wallet to Broker Wallet ✅
- [x] Update all references from "blank" to "broker"
- [x] Update variable names
- [x] Update function names
- [x] Update comments and documentation

---

## Phase 2: Interface Files

### Task 2.1: Create IEmpressaContracts.sol ✅
- [x] Create new interface file
- [x] Replace all IHauska* interfaces with IEmpressa*
- [x] Update IEmpressaRevenueDistributor interface with new function signatures
- [x] Update all interface method signatures

### Task 2.2: Create IEmpressaStructs.sol ✅
- [x] Create new structs interface file
- [x] Rename IHauskaStructs to IEmpressaStructs
- [x] Keep all enum and struct definitions

### Task 2.3: Update EmpressaRevenueDistributor to use new interfaces
- [ ] Update import statement to use IEmpressaContracts
- [ ] Update all interface references (IEmpressaOrgContract, etc.)
- [ ] Test compilation

---

## Phase 3: Core Contract Updates

### Task 3.1: Update HauskaOrgContract → EmpressaOrgContract ✅
- [x] Rename contract file
- [x] Replace all "Hauska" references with "Empressa"
- [x] Update interface imports (IHauska* → IEmpressa*)
- [x] Update comments and documentation
- [x] Update fee calculation functions to use new structure (2% + 0.002%)
- [x] Update events
- [ ] Test compilation (pending full contract suite)

### Task 3.2: Update HauskaContractFactory → EmpressaContractFactory ✅
- [x] Rename contract file
- [x] Replace all "Hauska" references with "Empressa"
- [x] Update `getPlatformFees()` to return new fee structure (empressaFee instead of hauskaFee)
- [x] Update default fees (2% Empressa, 0% integrator for compatibility)
- [x] Update error names (EmpressaFeeTooHigh)
- [x] Update event names (PlatformFeesUpdated)
- [x] Update comments and documentation
- [ ] Test compilation (pending full contract suite)

### Task 3.3: Update HauskaLicenseManager → EmpressaLicenseManager ✅
- [x] Rename contract file
- [x] Replace all "Hauska" references with "Empressa"
- [x] Update revenue distributor calls to use new interface
- [x] Update `distributeRevenue()` calls with new signature (referralWallet parameter)
- [x] Update interface imports
- [x] Test compilation

### Task 3.4: Update HauskaLicenseManagerV2 → EmpressaLicenseManagerV2
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update revenue distributor calls
- [ ] Update interface imports
- [ ] Test compilation

---

## Phase 4: Supporting Contract Updates

### Task 4.1: Update HauskaAssetRegistry → EmpressaAssetRegistry
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update interface imports
- [ ] Update comments
- [ ] Test compilation

### Task 4.2: Update HauskaGroupManager → EmpressaGroupManager
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update interface imports
- [ ] Test compilation

### Task 4.3: Update HauskaAssetNFT → EmpressaAssetNFT
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update interface imports
- [ ] Test compilation

### Task 4.4: Update HauskaLicenseNFT → EmpressaLicenseNFT
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update interface imports
- [ ] Test compilation

### Task 4.5: Update HauskaLicenseMetadata → EmpressaLicenseMetadata
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update metadata strings (JSON, SVG)
- [ ] Update "HAUSKA LICENSE" text to "EMPRESSA LICENSE"
- [ ] Update interface imports
- [ ] Test compilation

### Task 4.6: Update HauskaProxy → EmpressaProxy
- [ ] Rename contract file
- [ ] Replace all "Hauska" references with "Empressa"
- [ ] Update comments
- [ ] Test compilation

### Task 4.7: Update OrgDeployer.sol
- [ ] Update to deploy `EmpressaOrgContract` instead of `HauskaOrgContract`
- [ ] Update import statements
- [ ] Test compilation

---

## Phase 5: Testing & Validation

### Task 5.1: Compilation Testing
- [ ] Compile all contracts with Hardhat
- [ ] Fix any compilation errors
- [ ] Verify all imports resolve correctly
- [ ] Check for missing interface implementations

### Task 5.2: Unit Testing
- [ ] Write tests for EmpressaRevenueDistributor
- [ ] Test fee calculations (2% Empressa, 0.002% referral)
- [ ] Test 5-payee slot distribution
- [ ] Test withdrawal functions
- [ ] Test wallet address updates
- [ ] Test edge cases (zero amounts, missing wallets, etc.)

### Task 5.3: Integration Testing
- [ ] Test full transaction flow with new revenue distributor
- [ ] Test license manager → revenue distributor integration
- [ ] Test organization contract → revenue distributor integration
- [ ] Verify all events are emitted correctly

### Task 5.4: Fee Calculation Verification
- [ ] Verify $110k deal: $2,200 Empressa + $2.20 referral + $107,797.80 seller
- [ ] Verify $1M deal: $20,000 Empressa + $20 referral + $979,980 seller
- [ ] Test with various deal sizes
- [ ] Verify rounding/precision handling

---

## Phase 6: Documentation

### Task 6.1: Update Contract Documentation
- [ ] Update all contract NatSpec comments
- [ ] Update README files
- [ ] Update deployment documentation
- [ ] Document new fee structure

### Task 6.2: Update Planning Documents
- [ ] Update MONETIZATION_CONTRACT_CHANGES.md with completed tasks
- [ ] Update SMART_CONTRACT_VERSIONS_COMPARISON.md if needed
- [ ] Create migration guide

---

## Phase 7: Cleanup

### Task 7.1: Remove Old Contracts (Optional)
- [ ] Decide if old Hauska contracts should be kept or removed
- [ ] If removing: Delete old contract files
- [ ] Update any references to old contracts

### Task 7.2: Update Deployment Scripts
- [ ] Update deployment scripts to use new contract names
- [ ] Update constructor parameters for new wallet addresses
- [ ] Test deployment on testnet

---

## Current Status Summary

**Completed:**
- ✅ EmpressaRevenueDistributor contract created
- ✅ Blank wallet renamed to Broker wallet
- ✅ IEmpressaContracts.sol interface created
- ✅ IEmpressaStructs.sol interface created
- ✅ EmpressaOrgContract created (renamed from HauskaOrgContract)
- ✅ All interface references updated in EmpressaOrgContract
- ✅ Fee calculation functions updated to new structure
- ✅ EmpressaRevenueDistributor updated to use new interfaces (Task 2.3)
- ✅ EmpressaLicenseManager created (renamed from HauskaLicenseManager) (Task 3.3)

**Pending:**
- ⏸️ All Phase 3-7 tasks

---

## Notes

- All changes are being made to vanilla contracts only (not obfuscated)
- Keep original Hauska contracts as backup until migration is complete
- Test thoroughly before deploying to any network
- **OLD fee structure:** 2% Empressa + 0.002% referral + 0% (NV/HM/Broker) + remainder to seller
- **NEW fee structure (to be implemented):** Tiered fees based on cumulative revenue
  - Tier 1 (0-10M): 1.5% platform + 0.03% referral
  - Tier 2 (10M-100M): 1% platform + 0.02% referral
  - Tier 3 (100M+): 0.5% platform + 0.01% referral
  - Platform fee split: 25% each to Empressa, HM, NV, Blank wallets
  - NAPE26 promo code: Makes platform fees FREE (0%)
  - See TIERED_FEE_AND_PROMO_CODE_TASKS.md for full implementation plan

---

## Next Immediate Actions

1. **⚠️ IMPORTANT:** New tiered fee system needs to be implemented
   - See TIERED_FEE_AND_PROMO_CODE_TASKS.md for complete plan
   - Fee structure has changed from flat 2% to tiered system
   - Promo code system (NAPE26) needs to be added
   - Platform fee application modes (buy/sell/split) need to be implemented
2. **Update EmpressaRevenueDistributor** - Implement tiered fee system
3. **Add promo code system** - Implement NAPE26 promo code functionality
4. **Update fee distribution** - Change from 2% Empressa to 25% split among 4 wallets

---

**Last Updated:** [Current Date]
