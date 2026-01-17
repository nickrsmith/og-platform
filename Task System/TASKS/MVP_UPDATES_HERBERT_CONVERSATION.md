# MVP Updates from Herbert Conversation - Task Plan

**Status:** In Progress  
**Created:** January 16, 2026  
**Goal:** Implement critical MVP updates based on conversation with Herbert Melton (pre-NAPE)

**Reference:** `HERBERT_CONVERSATION_ANALYSIS_AND_PLAN.md` lines 51-72

---

## Overview

This task plan tracks implementation of four critical MVP updates identified in the Herbert conversation:

1. **Fee Application Options** - Allow buyer-side, seller-side, or split fee payment
2. **Referral Fee Adjustment** - Change from tier-based (0.03%/0.02%/0.01%) to fixed 0.02% (2 basis points)
3. **Fee Tier Thresholds** - Decision and implementation (currently 0-10M/10M-100M/100M+)
4. **Post-Sale Obligation Summary** - Generate obligation summary package for buyers after transaction close

---

## Phase 1: Referral Fee Adjustment (PRIORITY 1)

**Goal:** Change referral fee from tier-based to fixed 0.02% (2 basis points) across all tiers

### Task 1.1: Update Smart Contract - Referral Fee Constants ✅
- [x] Open `contracts/og-smart-contracts/contracts/EmpressaRevenueDistributor.sol`
- [x] Update referral fee constants (lines 47, 51, 55):
  ```solidity
  // OLD:
  uint32 public constant TIER_1_REFERRAL_FEE = 3;  // 0.03%
  uint32 public constant TIER_2_REFERRAL_FEE = 2;  // 0.02%
  uint32 public constant TIER_3_REFERRAL_FEE = 1;  // 0.01%
  
  // NEW:
  uint32 public constant REFERRAL_FEE = 2;  // 0.02% fixed for all tiers
  ```
- [x] Remove tier-specific referral fee constants
- [x] Update `getFeeTier()` function to return fixed `REFERRAL_FEE` for all tiers
- [x] Update `distributeRevenue()` to use fixed `REFERRAL_FEE` regardless of tier
- [x] Update comments to reflect fixed 0.02% referral fee

### Task 1.2: Update Fee Calculation Logic ✅
- [x] Locate `getFeeTier()` function in `EmpressaRevenueDistributor.sol`
- [x] Update return values to always return `REFERRAL_FEE` (2) for referral fee:
  ```solidity
  // Example:
  return (1, TIER_1_PLATFORM_FEE, REFERRAL_FEE);
  return (2, TIER_2_PLATFORM_FEE, REFERRAL_FEE);
  return (3, TIER_3_PLATFORM_FEE, REFERRAL_FEE);
  ```
- [x] Update `getFeeTierConstants()` to return fixed `REFERRAL_FEE` for all tiers
- [x] Verify referral fee calculation in `distributeRevenue()` uses fixed value

### Task 1.3: Update Interface & Events ✅
- [x] Update contract header documentation to reflect fixed 0.02% referral fee
- [x] Update `getFeeTierConstants()` function to return fixed referral fee for all tiers
- [x] Contract header comment updated with new referral fee structure

### Task 1.4: Update Backend Services ⚠️ NOT REQUIRED
- [x] Verified: Backend does not calculate referral fees
- [x] Verified: Referral fees are calculated entirely in smart contract
- [ ] **Note:** Backend only passes referral wallet address to smart contract
- [ ] **Note:** No backend code changes needed for referral fee calculation
- [ ] **Optional:** If fee preview UI shows referral fees, update display to show fixed 0.02%

### Task 1.5: Update Documentation
- [ ] Update `FEE_TIER_SCENARIOS.md` to reflect fixed 0.02% referral fee
- [ ] Update `TIERED_FEE_AND_PROMO_CODE_TASKS.md` to note referral fee is now fixed
- [ ] Update any API documentation referencing tier-based referral fees

### Task 1.6: Testing
- [ ] Unit test: Verify referral fee is 0.02% (2 basis points) for all tiers
- [ ] Unit test: Test $5M sale with 0.02% referral fee = $1,000
- [ ] Unit test: Test $25M sale with 0.02% referral fee = $5,000
- [ ] Unit test: Test $150M sale with 0.02% referral fee = $30,000
- [ ] Integration test: End-to-end transaction with new referral fee

---

## Phase 2: Fee Application Options (PRIORITY 1)

**Goal:** Allow platform fees to be paid by buyer, seller, or split between both

### Task 2.1: Verify Smart Contract Implementation ✅
- [x] Check `EmpressaRevenueDistributor.sol` for `FeeApplication` enum (EXISTS)
- [x] Verify enum values: `BUY_SIDE_ONLY`, `SELL_SIDE_ONLY`, `SPLIT` (CONFIRMED)
- [x] Verify `feeApplication` state variable exists (CONFIRMED - line 68)
- [x] Verify `buySidePercentage` state variable exists (CONFIRMED - line 69)
- [x] Review `distributeRevenue()` implementation for fee application logic (CONFIRMED - lines 478-494)

### Task 2.2: Add Fee Application Parameter to Transaction ✅
- [x] Update `distributeRevenue()` function signature to accept fee application mode:
  ```solidity
  function distributeRevenue(
      // ... existing parameters ...
      string calldata promoCode,
      FeeApplication feeMode,  // NEW
      uint256 buySidePct       // NEW (for split mode, basis points)
  ) external;
  ```
- [x] Update fee calculation logic to use `feeMode` parameter instead of global state
- [x] Add validation for `buySidePct` when `feeMode == SPLIT`
- [x] Update `IEmpressaRevenueDistributor` interface to include new parameters and enum
- [x] Update `EmpressaLicenseManager._distributeRevenue()` to pass defaults (SELL_SIDE_ONLY)
- [x] **Note:** License manager uses defaults; backend should call revenue distributor directly for marketplace transactions

### Task 2.3: Update Database Schema ✅
- [x] Check `backend/libs/database/prisma/schema.prisma`
- [x] Add `fee_application_mode` field to `Transaction` model:
  ```prisma
  feeApplicationMode String?   // 'BUY_SIDE_ONLY', 'SELL_SIDE_ONLY', 'SPLIT'
  buySidePercentage  Decimal?  // For split mode (basis points, 0-10000)
  ```
- [x] Create migration file:
  ```sql
  ALTER TABLE transactions ADD COLUMN fee_application_mode VARCHAR(50);
  ALTER TABLE transactions ADD COLUMN buy_side_percentage DECIMAL(7,2);
  ```
- [x] Run migration (migration file created; ready to run when database is available)

### Task 2.4: Update Backend DTOs ✅
- [x] Update `CreateTransactionDto` in `backend/libs/common/src/`:
  ```typescript
  feeApplicationMode?: 'BUY_SIDE_ONLY' | 'SELL_SIDE_ONLY' | 'SPLIT';
  buySidePercentage?: number; // For split mode (0-10000 basis points)
  ```
- [x] Update `CalculateRevenueSplitDto` to include fee application mode
- [x] Update `RevenueSplitDto` to include `buySideFee` and `sellSideFee` amounts
- [x] Created `FeeApplicationMode` enum in `backend/libs/common/src/enums/fee-application-mode.enum.ts`
- [x] Updated `TransactionDto` to include fee application fields for API responses

### Task 2.5: Update Revenue Service
- [ ] Update `backend/apps/core-api/src/revenue/revenue.service.ts`
- [ ] Modify `calculateRevenueSplit()` to:
  - Accept `feeApplicationMode` parameter
  - Accept `buySidePercentage` parameter (for split mode)
  - Calculate total platform fee
  - Split fees based on mode:
    - `BUY_SIDE_ONLY`: `buySideFee = totalFee`, `sellSideFee = 0`
    - `SELL_SIDE_ONLY`: `buySideFee = 0`, `sellSideFee = totalFee`
    - `SPLIT`: Calculate based on `buySidePercentage`
  - Return both `buySideFee` and `sellSideFee` in response
- [ ] Update seller proceeds calculation (deduct `sellSideFee`)
- [ ] Update buyer payment calculation (add `buySideFee`)

### Task 2.6: Update Blockchain Service
- [ ] Update `backend/apps/blockchain-service/src/` (or wherever revenue distribution is called)
- [ ] Pass `feeApplicationMode` to smart contract call
- [ ] Pass `buySidePercentage` if in split mode
- [ ] Update transaction creation to store fee application mode

### Task 2.7: Update Frontend - Listing Creation Form
- [ ] Locate asset listing creation form in `frontend/src/`
- [ ] Add fee application selector (radio buttons or dropdown):
  - "Seller Pays" (default)
  - "Buyer Pays"
  - "Split Payment"
- [ ] Add `buySidePercentage` input field (shown only when "Split Payment" selected)
  - Range: 0-100 (or 0-10000 basis points)
  - Default: 50 (50/50 split)
  - Label: "Buyer Pays %"
- [ ] Add fee breakdown preview showing:
  - Total platform fee
  - Buyer portion (if applicable)
  - Seller portion (if applicable)
  - Net seller proceeds
  - Total buyer payment
- [ ] Validate inputs (percentage must be 0-100 for split mode)

### Task 2.8: Update Frontend - Transaction Flow
- [ ] Update transaction preview page to show fee breakdown
- [ ] Display buyer-side fee prominently if buyer pays
- [ ] Display seller-side fee prominently if seller pays
- [ ] Show split breakdown if split mode
- [ ] Update transaction summary to include fee application mode

### Task 2.9: Update Frontend - Settlement/Checkout
- [ ] Update checkout page to show total buyer payment (including buy-side fees)
- [ ] Update settlement statement to show fee breakdown
- [ ] Display fee application mode clearly

### Task 2.10: Implementation Note (If Fee Application Not in Contract)
**If smart contract doesn't have fee application logic:**
- [ ] Implement `FeeApplication` enum in `EmpressaRevenueDistributor.sol`
- [ ] Add state variables: `FeeApplication public feeApplication` and `uint256 public buySidePercentage`
- [ ] Add admin function: `setFeeApplication(FeeApplication mode, uint256 buySidePct)`
- [ ] Update `distributeRevenue()` to:
  - Calculate total platform fee
  - Calculate buy-side fee: `buySideFee = (totalFee * buySidePercentage) / 10000`
  - Calculate sell-side fee: `sellSideFee = totalFee - buySideFee`
  - Apply based on mode (override calculations if not SPLIT)
- [ ] Update buyer payment calculation
- [ ] Update seller proceeds calculation
- [ ] Update events to include `buySideFee` and `sellSideFee`

### Task 2.11: Testing
- [ ] Unit test: Buy-side only (buyer pays 100% of platform fee)
- [ ] Unit test: Sell-side only (seller pays 100% of platform fee)
- [ ] Unit test: Split 50/50
- [ ] Unit test: Split 60/40 (buyer 60%, seller 40%)
- [ ] Integration test: Transaction with buy-side fees
- [ ] Integration test: Transaction with sell-side fees
- [ ] Integration test: Transaction with split fees
- [ ] Frontend test: Fee application selector works
- [ ] Frontend test: Buy-side percentage input appears/hides correctly
- [ ] Frontend test: Fee breakdown preview updates correctly

---

## Phase 3: Fee Tier Thresholds Decision (PRIORITY 2)

**Goal:** Finalize and implement fee tier thresholds (currently 0-10M/10M-100M/100M+)

### Task 3.1: Decision Documentation
- [ ] Review conversation notes about tier thresholds
- [ ] Document Herbert's suggestions:
  - Option A: 0-25M / 25M-100M / 100M+ (mentioned)
  - Option B: 0-10M / 10M-100M / 100M+ (current implementation)
  - Option C: 0-20M / 20M-100M / 100M+ (mentioned as alternative)
- [ ] Document recommendation: Keep current (0-10M/10M-100M/100M+) for MVP, adjust post-NAPE
- [ ] Note that decision can be made configurable later

### Task 3.2: Verify Current Implementation
- [ ] Check `EmpressaRevenueDistributor.sol` for tier thresholds:
  ```solidity
  uint256 public constant TIER_1_MAX = 10_000_000 * 1e6;  // $10M
  uint256 public constant TIER_2_MAX = 100_000_000 * 1e6; // $100M
  ```
- [ ] Verify `getFeeTier()` logic uses these thresholds
- [ ] Document current thresholds are correct for MVP

### Task 3.3: Make Thresholds Configurable (Future Enhancement)
- [ ] **Note:** This is optional for MVP, can be post-NAPE
- [ ] Add admin functions to update thresholds (if needed later)
- [ ] Add events for threshold updates
- [ ] Add validation (Tier 2 > Tier 1, etc.)

### Task 3.4: Documentation
- [ ] Update `HERBERT_CONVERSATION_ANALYSIS_AND_PLAN.md` with decision
- [ ] Note in task file that thresholds are kept as-is for MVP
- [ ] Add note about post-NAPE adjustment possibility

---

## Phase 4: Post-Sale Obligation Summary (PRIORITY 1)

**Goal:** Generate obligation summary package for buyers after transaction closes

### Task 4.1: Design Obligation Summary Structure
- [ ] Define summary sections:
  - **Leases Transferred**: List of all leases in transaction
  - **Division Order Requirements**: What division orders are needed
  - **JIB Deck Requirements**: What JIB decks are needed
  - **Royalty Owners**: List of royalty interest owners
  - **Override Interests**: List of override interest owners
  - **Lease Obligations**: 
    - Royalty payments due
    - Rental payments due
    - Shut-in payments due
    - Primary term expiration dates
  - **Contract Areas/AMIs**: Any AMIs or contract areas involved
- [ ] Create data model for obligation summary

### Task 4.2: Create Database Schema for Obligation Summaries
- [ ] Update `backend/libs/database/prisma/schema.prisma`
- [ ] Create `ObligationSummary` model:
  ```prisma
  model ObligationSummary {
    id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
    transactionId String      @unique @map("transaction_id") @db.Uuid
    summaryJson   Json        @map("summary_json")  // Structured obligation data
    pdfUrl        String?     @map("pdf_url")
    generatedAt   DateTime    @default(now()) @map("generated_at")
    
    transaction   Transaction @relation(fields: [transactionId], references: [id])
    
    @@map("obligation_summaries")
  }
  ```
- [ ] Create migration file
- [ ] Run migration

### Task 4.3: Create Obligation Summary Service
- [ ] Create `backend/apps/core-api/src/obligations/obligation-summary.service.ts`
- [ ] Implement `generateObligationSummary(transactionId: string)` method
- [ ] Extract data from:
  - Transaction record
  - Asset/listing data
  - Data room documents (if available)
  - Division order records (if exist)
  - Lease records (if exist)
- [ ] Structure data into obligation summary format
- [ ] Return structured JSON summary

### Task 4.4: Implement Summary Generation Logic
- [ ] Extract lease information:
  - Lease numbers
  - Lessor names
  - Counties/states
  - Acreage
  - Primary term dates
  - Royalty rates
- [ ] Extract division order requirements:
  - Well IDs/names
  - Working interest percentages
  - Owner lists
- [ ] Extract JIB requirements:
  - Well IDs/units
  - Cost allocation needs
- [ ] Extract royalty/override interests:
  - Owner names
  - Interest percentages
  - Contact information (if available)
- [ ] Extract lease obligations:
  - Payment schedules
  - Due dates
  - Amounts (if available)

### Task 4.5: Generate PDF Summary Document
- [ ] Install PDF generation library (e.g., `pdfkit`, `puppeteer`)
- [ ] Create PDF template for obligation summary
- [ ] Implement `generateObligationSummaryPDF(summaryJson: object)` method
- [ ] Format sections:
  - Header: Transaction info, buyer/seller names, closing date
  - Leases section
  - Division orders section
  - JIB decks section
  - Royalty/override interests section
  - Lease obligations section
  - Contract areas section
- [ ] Store PDF in file storage (S3 or similar)
- [ ] Return PDF URL

### Task 4.6: Create API Endpoint
- [ ] Add endpoint to `backend/apps/core-api/src/transactions/transactions.controller.ts`:
  ```typescript
  @Post(':id/obligation-summary')
  async generateObligationSummary(@Param('id') transactionId: string) {
    // Generate and return summary
  }
  
  @Get(':id/obligation-summary')
  async getObligationSummary(@Param('id') transactionId: string) {
    // Return existing summary or generate new one
  }
  ```
- [ ] Add authentication/authorization (only buyer/seller can access)
- [ ] Add validation (transaction must be closed)

### Task 4.7: Auto-Generate on Transaction Close
- [ ] Update transaction close handler
- [ ] After transaction marked as closed, automatically generate obligation summary
- [ ] Store summary in database
- [ ] Log generation success/failure

### Task 4.8: Email Delivery
- [ ] Update email service to send obligation summary
- [ ] Send to buyer email address
- [ ] Include PDF attachment (if generated)
- [ ] Include text summary in email body
- [ ] Send after transaction close

### Task 4.9: Frontend Integration
- [ ] Add "View Obligation Summary" button to transaction detail page
- [ ] Create obligation summary view page/component
- [ ] Display structured summary data:
  - Leases list
  - Division orders
  - JIB decks
  - Royalty/override interests
  - Lease obligations
- [ ] Add download PDF button
- [ ] Show summary generation status (pending/generated)
- [ ] Add loading state while generating

### Task 4.10: Integration with Existing Services
- [ ] Integrate with `DivisionOrdersService` (if division orders exist)
- [ ] Integrate with data room service (extract lease documents)
- [ ] Integrate with asset service (extract asset/listing data)
- [ ] Consider future integration with lease management service

### Task 4.11: Handle Missing Data
- [ ] Handle cases where lease information is incomplete
- [ ] Handle cases where division orders don't exist yet
- [ ] Mark sections as "Pending" or "To Be Determined" when data unavailable
- [ ] Provide guidance on how to obtain missing information

### Task 4.12: Testing
- [ ] Unit test: Summary generation with complete data
- [ ] Unit test: Summary generation with missing data
- [ ] Unit test: PDF generation
- [ ] Integration test: End-to-end summary generation after transaction close
- [ ] Integration test: Email delivery
- [ ] Frontend test: Summary display
- [ ] Frontend test: PDF download

---

## Phase 5: Promo Code UI Integration (PRIORITY 2)

**Note:** Promo code system exists in smart contract but needs UI integration

### Task 5.1: Add Promo Code Field to Listing Form
- [ ] Add promo code input field (optional) to asset listing creation form
- [ ] Add validation: Check if promo code exists and is valid
- [ ] Show fee breakdown update when promo code entered
- [ ] Display "Platform Fee: FREE" when valid promo code (e.g., NAPE26) applied

### Task 5.2: Add Promo Code Field to Transaction Flow
- [ ] Add promo code input to transaction/purchase flow
- [ ] Allow promo code entry before transaction finalization
- [ ] Validate promo code via backend API
- [ ] Update fee calculation preview

### Task 5.3: Promo Code Validation API
- [ ] Create endpoint: `POST /api/v1/promo-codes/validate`
- [ ] Accept promo code and organization ID
- [ ] Validate against smart contract
- [ ] Return validation result and fee discount info

### Task 5.4: Testing
- [ ] Test promo code entry in listing form
- [ ] Test promo code validation
- [ ] Test fee breakdown update with promo code
- [ ] Test NAPE26 makes platform fees free

---

## Current Status Summary

**Completed:**
- ✅ Task breakdown and planning
- ✅ Identified all required changes

**In Progress:**
- ⏸️ None yet

**Pending:**
- ⏸️ Phase 1: Referral Fee Adjustment
- ⏸️ Phase 2: Fee Application Options
- ⏸️ Phase 3: Fee Tier Thresholds Decision
- ⏸️ Phase 4: Post-Sale Obligation Summary
- ⏸️ Phase 5: Promo Code UI Integration

---

## Priority Order

1. **Phase 1: Referral Fee Adjustment** - Critical, affects all transactions
2. **Phase 2: Fee Application Options** - Critical for MVP, Herbert specifically requested
3. **Phase 4: Post-Sale Obligation Summary** - Critical for buyer handoff
4. **Phase 5: Promo Code UI** - Important for NAPE launch
5. **Phase 3: Fee Tier Thresholds** - Documentation only, no code changes needed

---

## Dependencies

- **Phase 1** → No dependencies
- **Phase 2** → May depend on smart contract implementation status
- **Phase 4** → May benefit from division order service (already exists)
- **Phase 5** → Depends on promo code system (already in smart contract)

---

## Key Requirements Summary

### Referral Fee
- **Fixed:** 0.02% (2 basis points) for ALL tiers
- **Applied to:** Sale amount
- **Goes to:** Referral wallet (Blank Wallet)

### Fee Application
- **Options:** Buyer pays, Seller pays, or Split
- **Default:** Seller pays (current behavior)
- **Split Mode:** Configurable percentage (e.g., 50/50)

### Obligation Summary
- **Trigger:** Auto-generated after transaction close
- **Delivery:** Email to buyer + available in UI
- **Format:** JSON data + PDF document
- **Content:** Leases, division orders, JIB decks, obligations

---

## Next Immediate Actions

1. **Start Phase 1.1** - Update referral fee constants in smart contract
2. **Verify Phase 2.1** - Check if fee application is already in smart contract
3. **Start Phase 4.1** - Design obligation summary structure
4. **Start Phase 5.1** - Add promo code field to listing form

---

## Related Documents

- `HERBERT_CONVERSATION_ANALYSIS_AND_PLAN.md` - Full analysis of conversation
- `TIERED_FEE_AND_PROMO_CODE_TASKS.md` - Existing fee tier implementation tasks
- `sc-convo-fe2d21d7-b8a8.md` - Original conversation transcript

---

**Last Updated:** January 16, 2026
