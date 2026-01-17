# MVP Critical Path - Next Steps

**Last Updated:** January 16, 2026  
**Status:** In Progress

---

## ✅ COMPLETED (Smart Contract Layer)

1. **Phase 1: Referral Fee Adjustment** ✅
   - Fixed 0.02% referral fee across all tiers
   - Smart contract updated

2. **Phase 2.2: Fee Application (Smart Contract)** ✅
   - Per-transaction fee application support
   - Buyer/Seller/Split modes implemented

---

## 🚨 CRITICAL MVP TASKS (In Priority Order)

### **PRIORITY 1: Fee Application Backend & Frontend** 
**Why:** Seller must be able to choose who pays fees (Herbert requirement)

#### Immediate Next Steps:
1. **Task 2.3: Database Schema** (30 min)
   - Add `fee_application_mode` and `buy_side_percentage` to Transaction model
   - Create and run migration

2. **Task 2.4: Backend DTOs** (30 min)
   - Update DTOs to include fee application fields
   - Update types/interfaces

3. **Task 2.5: Revenue Service** (1-2 hours)
   - Update `calculateRevenueSplit()` to handle fee application modes
   - Calculate buy-side and sell-side fees
   - Return proper fee breakdown

4. **Task 2.6: Blockchain Service** (1 hour)
   - Pass fee application parameters to smart contract
   - Update transaction creation flow

5. **Task 2.7: Frontend - Listing Form** (2-3 hours)
   - Add fee application selector (Buyer/Seller/Split)
   - Add buy-side percentage input (for split mode)
   - Show fee breakdown preview

6. **Task 2.8-2.9: Frontend - Transaction Display** (1-2 hours)
   - Show fee breakdown in transaction preview
   - Update settlement/checkout displays

**Estimated Time:** 6-8 hours total

---

### **PRIORITY 2: Promo Code UI Integration**
**Why:** Needed for NAPE26 launch (Herbert requirement)

#### Immediate Next Steps:
1. **Task 5.1: Add Promo Code Field** (1 hour)
   - Add promo code input to listing creation form
   - Add promo code input to transaction/purchase flow

2. **Task 5.2: Validation API** (1 hour)
   - Create promo code validation endpoint
   - Return validation result and fee discount info

3. **Task 5.3: Fee Preview Update** (1 hour)
   - Update fee breakdown when promo code entered
   - Show "FREE" when NAPE26 applied

**Estimated Time:** 3 hours total

---

### **PRIORITY 3: Post-Sale Obligation Summary**
**Why:** Critical for buyer handoff (Herbert requirement)

#### Immediate Next Steps:
1. **Task 4.1: Design Summary Structure** (30 min)
   - Define what sections to include
   - Create data model

2. **Task 4.2: Database Schema** (30 min)
   - Create `ObligationSummary` model
   - Migration

3. **Task 4.3-4.4: Service Implementation** (3-4 hours)
   - Create obligation summary service
   - Extract data from transactions/assets
   - Structure summary JSON

4. **Task 4.5: PDF Generation** (2-3 hours)
   - Install PDF library
   - Create template
   - Generate PDF document

5. **Task 4.6-4.7: API & Auto-Generation** (1-2 hours)
   - Create endpoints
   - Auto-generate on transaction close

6. **Task 4.9: Frontend Display** (1-2 hours)
   - Add "View Obligation Summary" button
   - Display summary data
   - Download PDF

**Estimated Time:** 8-12 hours total

---

## 📋 Recommended Work Order

### **Week 1: Core Transaction Features**
1. ✅ Fee Application Backend (Tasks 2.3-2.6) - **4-5 hours**
2. ✅ Fee Application Frontend (Tasks 2.7-2.9) - **3-4 hours**
3. ✅ Promo Code UI (Tasks 5.1-5.3) - **3 hours**

**Total Week 1:** ~10-12 hours

### **Week 2: Buyer Handoff Features**
1. ✅ Obligation Summary (Tasks 4.1-4.7) - **8-12 hours**
2. ✅ Frontend Display (Task 4.9) - **1-2 hours**
3. ✅ Testing & Polish - **2-4 hours**

**Total Week 2:** ~11-18 hours

---

## 🎯 MVP Definition (Post-Herbert Conversation)

### **Must Have:**
- ✅ Referral fee fixed at 0.02% (DONE)
- ⏸️ Seller can choose fee application (Buyer/Seller/Split)
- ⏸️ Promo code UI (NAPE26)
- ⏸️ Obligation summary after transaction close

### **Nice to Have (Post-MVP):**
- Fee tier threshold changes (documentation only)
- Advanced obligation tracking
- Lease management dashboard

---

## 🔧 Quick Wins (Can Do in Parallel)

These can be done alongside the critical path:

1. **Phase 1.5: Documentation Updates** (1 hour)
   - Update FEE_TIER_SCENARIOS.md with fixed referral fee
   - Update task tracking

2. **Phase 3: Fee Tier Decision** (30 min)
   - Document decision to keep current thresholds
   - Note in analysis document

---

## 📝 Notes

- **Smart contract is done** - all critical contract changes complete
- **Backend needs updates** - DTOs, services, blockchain integration
- **Frontend needs updates** - forms, displays, fee breakdowns
- **No database breaking changes** - just new fields

---

**Recommendation:** Start with Task 2.3 (Database Schema) - it's quick and unblocks everything else.
