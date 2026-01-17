# Phase 2 Smart Contracts Development Plan
**Post-Sale Land Administration Smart Contracts**

**Status:** ⏸️ **PENDING REVIEW** - Awaiting approval before execution  
**Created:** January 16, 2026  
**Target Folder:** `contracts/og-smart-contracts/contracts/phase2/`

**Related Documents:**
- `SMART_CONTRACT_ARCHITECTURE_DIAGRAM.md` - Complete architecture overview
- `SMART_CONTRACT_REQUIREMENTS.md` - Detailed contract requirements from Herbert conversations
- `smart-contract-architecture.jsx` - Visual architecture diagrams
- `POST_ASSET_SALE_FEATURES_TASKS.md` - Backend/database implementation plan

---

## Executive Overview

This plan outlines the development of **Phase 2 Smart Contracts** for post-sale land administration in the O&G platform. These contracts automate lease obligations, revenue distribution, and cost allocation after an asset sale is complete.

**Phase 2 Contracts:**
1. **LeaseContract.sol** - Lease obligation tracking and automated payments
2. **DivisionOrderContract.sol** - Revenue distribution deck management
3. **JIBDeckContract.sol** - Joint Interest Billing and cost allocation

These contracts extend the MVP (Phase 1) by managing ongoing obligations and payments that occur after assets are sold.

---

## Development Phases

### **Phase 2.1: Foundation & Interfaces** ⏳ **FIRST TASK - AWAITING APPROVAL**

#### Task 2.1.1: Create Phase 2 Folder Structure
- [ ] Create `contracts/phase2/` directory
- [ ] Create `contracts/phase2/interfaces/` directory
- [ ] Create `contracts/phase2/interfaces/ILeaseContract.sol`
- [ ] Create `contracts/phase2/interfaces/IDivisionOrder.sol`
- [ ] Create `contracts/phase2/interfaces/IJIBDeck.sol`
- [ ] Create `contracts/phase2/interfaces/IPhase2Structs.sol` (shared structs)
- [ ] Create `contracts/phase2/test/` directory for tests

#### Task 2.1.2: Define Shared Data Structures
- [ ] Create `IPhase2Structs.sol` with:
  - `LeaseObligation` struct
  - `OwnerInterest` struct
  - `DivisionOrder` struct
  - `WorkingInterest` struct
  - `JIBDeck` struct
  - `CostItem` struct
  - `ObligationType` enum
  - `CostType` enum
  - `JIBStatus` enum
- [ ] Review and align with existing `IEmpressaStructs.sol`
- [ ] Ensure compatibility with Phase 1 contracts

#### Task 2.1.3: Design Contract Interfaces
- [ ] **ILeaseContract.sol:**
  - `registerLease()` - Create new lease
  - `updateWorkingInterest()` - Change ownership
  - `distributeRoyalty()` - Pay royalties
  - `payRental()` - Execute rental payments
  - `payShutIn()` - Handle shut-in payments
  - `checkObligations()` - View pending obligations
  - `transferLease()` - Transfer ownership
  - Events: `LeaseRegistered`, `ObligationDue`, `PaymentMade`
  
- [ ] **IDivisionOrder.sol:**
  - `createDivisionOrder()` - Set up new division order
  - `addOwner()` - Add new owner
  - `updateOwnerInterest()` - Change percentage
  - `removeOwner()` - Remove owner
  - `splitInterest()` - Split interest among heirs
  - `distributeRevenue()` - Distribute revenue automatically
  - `getOwnerCount()` - Query number of owners
  - Events: `DivisionOrderCreated`, `OwnerAdded`, `InterestUpdated`, `RevenueDistributed`

- [ ] **IJIBDeck.sol:**
  - `createJIBDeck()` - Initialize billing deck
  - `addCostItem()` - Add cost to deck
  - `calculateAllocations()` - Calculate each party's share
  - `approveAFE()` - Approve expenditure
  - `generateBill()` - Create bills for participants
  - `recordPayment()` - Track payments received
  - `getParticipantBalance()` - Query what party owes
  - Events: `JIBDeckCreated`, `CostAdded`, `BillGenerated`, `PaymentRecorded`

---

### **Phase 2.2: Lease Contract Implementation**

#### Task 2.2.1: Implement LeaseContract.sol
- [ ] Create `contracts/phase2/LeaseContract.sol`
- [ ] Inherit from `ILeaseContract`
- [ ] Implement storage mappings:
  - `mapping(uint256 => LeaseObligation) public leases;`
  - `mapping(uint256 => address) public leaseOwners;`
  - `mapping(uint256 => uint256) public leaseWorkingInterest;`
- [ ] Implement `registerLease()`:
  - Validate lease data
  - Store lease obligation
  - Emit `LeaseRegistered` event
  - Link to asset registry (if applicable)
- [ ] Implement `updateWorkingInterest()`:
  - Validate caller is lease owner
  - Update working interest percentage
  - Emit `WorkingInterestUpdated` event
- [ ] Implement `distributeRoyalty()`:
  - Calculate royalty amount based on production revenue
  - Validate royalty rate
  - Transfer payment to lessor
  - Record payment in obligation history
  - Emit `RoyaltyPaid` event
- [ ] Implement `payRental()`:
  - Check if rental is due
  - Calculate rental amount
  - Transfer payment to lessor
  - Update obligation status
  - Emit `RentalPaid` event
- [ ] Implement `payShutIn()`:
  - Check shut-in conditions
  - Calculate shut-in royalty
  - Transfer payment
  - Update obligation status
  - Emit `ShutInPaid` event
- [ ] Implement `checkObligations()`:
  - Query all pending obligations for a lease
  - Return obligation list with due dates
- [ ] Implement `transferLease()`:
  - Validate ownership
  - Transfer lease to new owner
  - Update lease owner mapping
  - Emit `LeaseTransferred` event

#### Task 2.2.2: Lease Contract Testing
- [ ] Create `test/phase2/LeaseContract.test.ts` (or .sol)
- [ ] Test `registerLease()` with valid/invalid data
- [ ] Test `distributeRoyalty()` calculations
- [ ] Test `payRental()` timing and amounts
- [ ] Test `payShutIn()` conditions
- [ ] Test `updateWorkingInterest()` authorization
- [ ] Test `transferLease()` ownership validation
- [ ] Test obligation tracking accuracy
- [ ] Test edge cases (expired leases, invalid percentages)
- [ ] Gas optimization testing

#### Task 2.2.3: Lease Contract Integration
- [ ] Integrate with Phase 1 `EscrowContract`:
  - Listen for `AssetSaleComplete` events
  - Auto-create lease contracts after sale
  - Extract lease data from transaction
- [ ] Test integration with `EmpressaRevenueDistributor`:
  - Verify royalty payments flow correctly
  - Test fee calculations don't interfere
- [ ] Create deployment script for LeaseContract
- [ ] Deploy to testnet (Base Sepolia or similar)

---

### **Phase 2.3: Division Order Contract Implementation**

#### Task 2.3.1: Implement DivisionOrderContract.sol
- [ ] Create `contracts/phase2/DivisionOrderContract.sol`
- [ ] Inherit from `IDivisionOrder`
- [ ] Implement storage mappings:
  - `mapping(uint256 => DivisionOrder) public divisionOrders;`
  - `mapping(uint256 => OwnerInterest[]) public orderOwners;`
  - `mapping(uint256 => mapping(address => uint256)) public ownerInterests;`
  - `mapping(uint256 => bool) public activeOrders;`
- [ ] Implement `createDivisionOrder()`:
  - Validate operator address
  - Initialize division order struct
  - Set total interest to 0 (will sum from owners)
  - Set status to active
  - Emit `DivisionOrderCreated` event
- [ ] Implement `addOwner()`:
  - Validate owner address
  - Add `OwnerInterest` to array
  - Update `ownerInterests` mapping
  - Recalculate `totalInterest` (must not exceed 100%)
  - Emit `OwnerAdded` event
  - **Critical:** Handle overflow/underflow for interest calculations
- [ ] Implement `updateOwnerInterest()`:
  - Validate caller is operator
  - Find owner in array
  - Update interest percentage
  - Recalculate total interest
  - Emit `InterestUpdated` event
- [ ] Implement `removeOwner()`:
  - Validate caller is operator
  - Remove owner from array (or mark inactive)
  - Update mappings
  - Redistribute interest (if applicable)
  - Emit `OwnerRemoved` event
- [ ] Implement `splitInterest()`:
  - Find original owner
  - Remove original owner interest
  - Add multiple new owners with split percentages
  - Validate split percentages sum correctly
  - Update total interest
  - Emit `InterestSplit` event
- [ ] Implement `distributeRevenue()`:
  - Validate revenue amount > 0
  - Iterate through all owners
  - Calculate each owner's share: `(interest * revenue) / 10000`
  - Transfer payment to each owner
  - Record distribution in event
  - Emit `RevenueDistributed` event
  - **Critical:** Handle large owner lists efficiently (gas optimization)
- [ ] Implement `getOwnerCount()`:
  - Return length of owner array for a division order
- [ ] Add validation helper functions:
  - `_validateTotalInterest()` - Ensure total = 100%
  - `_findOwnerIndex()` - Helper to find owner in array

#### Task 2.3.2: Division Order Contract Testing
- [ ] Create `test/phase2/DivisionOrderContract.test.ts`
- [ ] Test `createDivisionOrder()` initialization
- [ ] Test `addOwner()` with valid/invalid percentages
- [ ] Test `updateOwnerInterest()` recalculation
- [ ] Test `removeOwner()` and redistribution
- [ ] Test `splitInterest()` with multiple heirs:
  - 1 owner (100%) → 4 heirs (25% each)
  - Validate percentage precision
- [ ] Test `distributeRevenue()` with multiple owners:
  - 10 owners scenario
  - 50 owners scenario (gas testing)
  - Verify each owner receives correct amount
  - Test rounding/precision edge cases
- [ ] Test `totalInterest` validation (must equal 100%)
- [ ] Test edge cases:
  - Empty division order
  - Owner with 0% interest
  - Owner with 100% interest (single owner)
  - Interest overflow scenarios

#### Task 2.3.3: Division Order Integration
- [ ] Integrate with `LeaseContract`:
  - Division order can query lease for royalty rates
  - Link division order to specific lease/well
- [ ] Integrate with Phase 1 contracts:
  - Listen for `AssetSaleComplete` events
  - Auto-create division orders from sale data
  - Extract owner list from transaction documents
- [ ] Create deployment script
- [ ] Deploy to testnet

---

### **Phase 2.4: JIB Deck Contract Implementation**

#### Task 2.4.1: Implement JIBDeckContract.sol
- [ ] Create `contracts/phase2/JIBDeckContract.sol`
- [ ] Inherit from `IJIBDeck`
- [ ] Implement storage mappings:
  - `mapping(uint256 => JIBDeck) public jibDecks;`
  - `mapping(uint256 => WorkingInterest[]) public deckInterests;`
  - `mapping(uint256 => CostItem[]) public deckCosts;`
  - `mapping(uint256 => mapping(address => uint256)) public participantBills;`
- [ ] Implement `createJIBDeck()`:
  - Validate operator address
  - Initialize JIB deck struct
  - Set status to DRAFT
  - Set billing period timestamp
  - Emit `JIBDeckCreated` event
- [ ] Implement `addCostItem()`:
  - Validate caller is operator
  - Add cost item to deck
  - Update total cost
  - Link to AFE (if applicable)
  - Emit `CostAdded` event
- [ ] Implement `calculateAllocations()`:
  - Get working interest percentages (from JOA or deck)
  - For each cost item, calculate each participant's share
  - Store allocations in `participantBills` mapping
  - Update deck status to APPROVED
  - Emit `AllocationsCalculated` event
  - **Formula:** `(workingInterest * costAmount) / 10000`
- [ ] Implement `approveAFE()`:
  - Validate AFE exists
  - Record approval (may need JOA integration)
  - Update AFE status
  - Emit `AFEApproved` event
- [ ] Implement `generateBill()`:
  - For each participant, calculate total bill
  - Create bill record
  - Update deck status to BILLED
  - Emit `BillGenerated` event for each participant
- [ ] Implement `recordPayment()`:
  - Validate payment amount
  - Record payment in participant bill
  - Update deck status if all paid
  - Emit `PaymentRecorded` event
- [ ] Implement `getParticipantBalance()`:
  - Return amount owed by participant
  - Calculate: `totalBill - paymentsReceived`

#### Task 2.4.2: JIB Deck Contract Testing
- [ ] Create `test/phase2/JIBDeckContract.test.ts`
- [ ] Test `createJIBDeck()` initialization
- [ ] Test `addCostItem()` with various cost types
- [ ] Test `calculateAllocations()`:
  - 3 participants with different working interests
  - Multiple cost items
  - Verify calculations sum correctly
- [ ] Test `generateBill()` for each participant
- [ ] Test `recordPayment()`:
  - Partial payment
  - Full payment
  - Overpayment scenarios
- [ ] Test `getParticipantBalance()` accuracy
- [ ] Test AFE approval workflow
- [ ] Test deck status transitions: DRAFT → APPROVED → BILLED → PAID

#### Task 2.4.3: JIB Deck Integration
- [ ] Integrate with `DivisionOrderContract`:
  - Query division order for working interest percentages
  - Compare revenue vs. cost allocations
- [ ] **Future Integration:** Prepare for JOA contract (Phase 3):
  - Design interface to query JOA for working interest
  - Document integration points
- [ ] Create deployment script
- [ ] Deploy to testnet

---

### **Phase 2.5: Cross-Contract Integration & Events**

#### Task 2.5.1: Event-Driven Architecture
- [ ] Design event emission strategy:
  - `LeaseContract` emits events for backend monitoring
  - `DivisionOrderContract` emits events for revenue tracking
  - `JIBDeckContract` emits events for billing notifications
- [ ] Implement event listeners in backend (document only):
  - Backend should monitor events for:
    - `ObligationDue` - Send payment reminders
    - `RevenueDistributed` - Update backend records
    - `BillGenerated` - Send invoice notifications

#### Task 2.5.2: Phase 1 → Phase 2 Integration
- [ ] Update `EscrowContract` (if needed):
  - Emit additional data in `AssetSaleComplete` event:
    - Lease data
    - Owner list for division order
    - Working interest percentages
- [ ] Create integration scripts:
  - Script to auto-create lease contracts after sale
  - Script to auto-create division orders after sale
  - Script to link contracts together

#### Task 2.5.3: Error Handling & Validation
- [ ] Implement comprehensive error handling:
  - Custom errors for common failures
  - Revert with clear error messages
- [ ] Add input validation:
  - Address validation (non-zero)
  - Percentage validation (0-100%)
  - Timestamp validation (future dates)
- [ ] Implement access control:
  - Owner-only functions
  - Operator-only functions
  - Consider using OpenZeppelin's `Ownable` or `AccessControl`

---

### **Phase 2.6: Gas Optimization & Security**

#### Task 2.6.1: Gas Optimization
- [ ] Optimize storage patterns:
  - Use packed structs where possible
  - Minimize storage writes
  - Use events instead of storage for historical data
- [ ] Optimize loops:
  - Division order revenue distribution with many owners
  - Consider batching if gas limits are hit
  - Document gas costs for different scenarios
- [ ] Use libraries for common calculations:
  - Percentage calculations
  - Interest splitting algorithms

#### Task 2.6.2: Security Audit Preparation
- [ ] Review for common vulnerabilities:
  - Reentrancy attacks
  - Integer overflow/underflow (use Solidity 0.8+)
  - Access control issues
  - Front-running vulnerabilities
- [ ] Add security comments to critical functions
- [ ] Create security documentation

#### Task 2.6.3: Upgradeability Consideration
- [ ] Decide on upgradeability pattern:
  - Proxy pattern (OpenZeppelin)
  - Or immutable contracts with migration plan
- [ ] Document upgrade strategy
- [ ] If using proxies, implement initialization functions

---

### **Phase 2.7: Documentation & Deployment**

#### Task 2.7.1: Contract Documentation
- [ ] Add NatSpec comments to all contracts:
  - `@title`, `@author`, `@notice`, `@dev` tags
  - Function parameter documentation
  - Return value documentation
- [ ] Create contract interaction diagrams
- [ ] Document gas costs for each function

#### Task 2.7.2: Testing Documentation
- [ ] Document test scenarios covered
- [ ] Create test data examples
- [ ] Document edge cases tested

#### Task 2.7.3: Deployment Documentation
- [ ] Create deployment guide:
  - Deployment order (dependencies)
  - Constructor parameters
  - Initialization steps
- [ ] Document network addresses:
  - Testnet deployments
  - Mainnet deployments (when ready)

#### Task 2.7.4: Integration Guide
- [ ] Document how backend should integrate:
  - Event monitoring
  - Contract calling patterns
  - Error handling
- [ ] Create example integration code

---

## Dependencies & Prerequisites

### **Required Before Starting:**
- ✅ Phase 1 contracts deployed (Asset Registry, Revenue Distributor, Escrow)
- ✅ Contract architecture reviewed and approved
- ✅ Herbert approval on contract design approach

### **External Dependencies:**
- Hardhat development environment
- OpenZeppelin contracts library (for security patterns)
- Testnet access (Base Sepolia or similar)
- USDC token for testing payments

### **Technical Considerations:**
- **Gas Costs:** Division orders with 50+ owners may be expensive
- **Precision:** All percentages use basis points (10000 = 100%)
- **Data Size:** Large owner lists may require batching
- **Layer 2:** Consider Base L2 for lower gas costs

---

## Risk Assessment

### **High Risk:**
- **Gas Costs:** Large division orders (50+ owners) may exceed gas limits
  - **Mitigation:** Implement batching, use Layer 2, optimize algorithms
- **Complexity:** Interest splitting and inheritance scenarios
  - **Mitigation:** Extensive testing, code review, formal verification

### **Medium Risk:**
- **Integration Complexity:** Cross-contract dependencies
  - **Mitigation:** Clear interfaces, integration testing, documentation
- **Data Accuracy:** Percentage calculations must be exact
  - **Mitigation:** Use libraries, extensive testing, validation

### **Low Risk:**
- **Upgradeability:** Future changes may be needed
  - **Mitigation:** Design for extensibility, document migration path

---

## Success Criteria

### **Phase 2.1 Complete When:**
- ✅ All interfaces defined and documented
- ✅ Shared structs created and reviewed
- ✅ Folder structure established

### **Phase 2.2-2.4 Complete When:**
- ✅ All three contracts implemented
- ✅ All unit tests passing
- ✅ Integration tests passing
- ✅ Gas costs documented and acceptable

### **Phase 2 Complete When:**
- ✅ All contracts deployed to testnet
- ✅ Integration with Phase 1 contracts working
- ✅ Documentation complete
- ✅ Security review completed
- ✅ Ready for mainnet deployment

---

## Timeline Estimate

- **Phase 2.1 (Foundation):** 1 week
- **Phase 2.2 (Lease Contract):** 2-3 weeks
- **Phase 2.3 (Division Order):** 3-4 weeks (most complex)
- **Phase 2.4 (JIB Deck):** 2-3 weeks
- **Phase 2.5-2.7 (Integration & Docs):** 2 weeks

**Total Estimate:** 10-13 weeks (2.5-3 months)

---

## Next Steps After Approval

1. ✅ Review and approve this plan
2. ✅ Begin **Task 2.1.1: Create Phase 2 Folder Structure**
3. ⏸️ Proceed through tasks sequentially
4. ⏸️ Regular reviews at phase completion

---

## Notes & Decisions

- **Storage Strategy:** Use mappings + arrays for dynamic data (owners, costs)
- **Precision:** All percentages in basis points (10000 = 100%)
- **Events:** Heavy use of events for backend monitoring
- **Gas Optimization:** Priority for division order revenue distribution
- **Testing:** Comprehensive unit tests + integration tests required

---

**Last Updated:** January 16, 2026  
**Status:** ⏸️ Awaiting Review & Approval
