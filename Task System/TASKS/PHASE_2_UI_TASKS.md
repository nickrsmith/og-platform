# Phase 2 UI Implementation - Task Plan

**Status:** In Progress  
**Created:** 2025-01-16  
**Goal:** Build UI-only implementation of Phase 2 (Land Administration) features for presentation to Herbert before backend development

**Related Documents:**
- `POST_ASSET_SALE_FEATURES_TASKS.md` - Backend implementation tasks (future work)
- `HERBERT_CONVERSATION_ANALYSIS_AND_PLAN.md` - Requirements and vision
- `LAND_SYSTEM_VISION.md` - Complete land system architecture

---

## Overview

This task plan focuses exclusively on **UI/UX implementation** for Phase 2 (Land Administration) features. The goal is to create a working prototype UI that can be demonstrated to Herbert for feedback before committing to full backend development.

**Key Principles:**
- UI-first approach - Build interfaces and workflows visually
- Mock data - Use static/simulated data for demonstration
- No backend dependencies - All UI should work independently
- Rapid iteration - Quick to modify based on feedback

---

## Phase 1: Foundation & Navigation

### Task 1.1: Add Phase 2 Navigation ✅ COMPLETED
- [x] Add "Phase 2" button to header
- [x] Create Phase 2 route structure (`/phase2/*`)
- [x] Add Phase 2 to sidebar navigation
- [x] Create Phase 2 landing page

### Task 1.2: Phase 2 Layout Structure
- [ ] Create Phase 2 layout component with tabs/sub-navigation
- [ ] Design main navigation tabs:
  - [ ] Leases
  - [ ] Division Orders
  - [ ] JIB Decks
  - [ ] AMI & Contract Areas
  - [ ] Title Curative
- [ ] Add breadcrumb navigation
- [ ] Create phase 2 header with context

---

## Phase 2: Lease Management UI

### Task 2.1: Lease List View
- [ ] Create lease list page (`/phase2/leases`)
- [ ] Design lease card/table component:
  - [ ] Lease name/identifier
  - [ ] Lessor/Lessee names
  - [ ] Lease date and expiration
  - [ ] Status badge (Active, Expired, etc.)
  - [ ] Primary term information
  - [ ] Royalty rate display
- [ ] Add filters:
  - [ ] Status filter (Active, Expired, Renewed, etc.)
  - [ ] Date range filter
  - [ ] Lessor/Lessee filter
- [ ] Add search functionality
- [ ] Add sorting options
- [ ] Create mock data for leases

### Task 2.2: Lease Detail View
- [ ] Create lease detail page (`/phase2/leases/:id`)
- [ ] Design lease information sections:
  - [ ] Basic Info (lease date, term, parties)
  - [ ] Lease Terms (royalty, bonus, delay rental)
  - [ ] Provisions (Pugh, depth severance, etc.)
  - [ ] Status & Dates (expiration, HBP status)
  - [ ] Documents (lease doc, recordings)
- [ ] Add action buttons:
  - [ ] Edit Lease
  - [ ] Create Assignment
  - [ ] Add Amendment
  - [ ] View Obligations
- [ ] Create mock lease detail data

### Task 2.3: Lease Obligations View
- [ ] Create lease obligations page (`/phase2/leases/:id/obligations`)
- [ ] Design obligation calendar/table:
  - [ ] Upcoming obligations (royalties, rentals, shut-ins)
  - [ ] Due dates with visual indicators
  - [ ] Status tracking (Paid, Pending, Overdue)
  - [ ] Payment history
- [ ] Add obligation filters (by type, date range, status)
- [ ] Create mock obligation data

### Task 2.4: Lease Assignment & Amendment UI
- [ ] Create lease assignment form (`/phase2/leases/:id/assign`)
- [ ] Design assignment form:
  - [ ] From/To lessee selection
  - [ ] Assignment date
  - [ ] Retained interest (ORRI) input
  - [ ] Document upload
- [ ] Create lease amendment form (`/phase2/leases/:id/amend`)
- [ ] Design amendment form:
  - [ ] Amendment type selection
  - [ ] Amendment date
  - [ ] Description/notes
  - [ ] Document upload
- [ ] Add form validation and error handling

---

## Phase 3: Division Orders UI

### Task 3.1: Division Order List View
- [ ] Create division order list page (`/phase2/division-orders`)
- [ ] Design division order card/table:
  - [ ] Well name/identifier
  - [ ] Operator organization
  - [ ] Status badge
  - [ ] Total decimal interest
  - [ ] Production start date
- [ ] Add filters (status, well, operator)
- [ ] Add search functionality
- [ ] Create mock division order data

### Task 3.2: Division Order Detail View
- [ ] Create division order detail page (`/phase2/division-orders/:id`)
- [ ] Design division order information:
  - [ ] Well information
  - [ ] Operator details
  - [ ] Status and dates
  - [ ] Owner interest breakdown (table/list)
  - [ ] Revenue streams
- [ ] Add owner management:
  - [ ] Add owner button
  - [ ] Edit owner interest
  - [ ] Remove owner
- [ ] Create owner interest visualization (pie chart/table)

### Task 3.3: Division Order Owner Management
- [ ] Create add owner form (`/phase2/division-orders/:id/owners/new`)
- [ ] Design owner form:
  - [ ] Owner type (Mineral, Working Interest, Override)
  - [ ] Owner selection (user/organization or external)
  - [ ] Decimal interest input
  - [ ] NRI/WI calculations
  - [ ] Payment information
  - [ ] Contact information
- [ ] Add owner detail/edit view
- [ ] Add owner interest validation

### Task 3.4: Working Interest Sale Invoice & Ownership Update
- [ ] Create working interest sale invoice page (`/phase2/division-orders/:id/sale-invoice`)
- [ ] Design invoice-based sale form:
  - [ ] **Sale Details Section:**
    - [ ] Current owner (selling party)
    - [ ] Current working interest % (auto-filled, editable)
    - [ ] Percentage being sold (input)
    - [ ] Remaining interest % (auto-calculated)
    - [ ] Sale price/amount
    - [ ] Buyer information (user/organization or external)
  - [ ] **Payment Collection:**
    - [ ] Invoice amount display
    - [ ] Payment method selection
    - [ ] Payment status tracking
    - [ ] Payment confirmation
  - [ ] **Recording & Documentation:**
    - [ ] Recording location/office
    - [ ] Recording date
    - [ ] Document upload (assignment/PSA)
    - [ ] Recording confirmation
  - [ ] **Auto-Update Functionality:**
    - [ ] Preview of ownership changes
    - [ ] Automatic ownership percentage update after payment
    - [ ] Automatic division order update
    - [ ] Status change notifications
- [ ] Add "Create Sale Invoice" button to division order detail page
- [ ] Design post-sale ownership update workflow:
  - [ ] Payment confirmation triggers auto-update
  - [ ] Division order ownership recalculated
  - [ ] Seller's remaining interest updated
  - [ ] Buyer added to division order
  - [ ] Historical ownership tracking maintained
- [ ] Add ownership history/audit trail view:
  - [ ] Show all ownership changes over time
  - [ ] Link sales to recordings
  - [ ] Track "8-9 times" ownership changes over well life
- [ ] Create mock invoice and payment flow
- [ ] **User Control Requirement:** User must be able to manually adjust remaining interest if needed ("say nope, now 25, whatever")

**Context from Conversation (sc-2-c34b2b47-6800):**
- Herbert: "We have 100% working interest, sell part of it, now I only have 50%. Do I have to go back and start over with the 50 contract or can I disperse mine out?"
- Nick: "The user should have control over that... I need to be able to get in there and say nope, now 25, whatever"
- Herbert: Ownership changes "8-9 times" from lease to well death
- This is a sale that needs to go through recording

---

## Phase 4: JIB Decks UI

### Task 4.1: JIB Deck List View
- [ ] Create JIB deck list page (`/phase2/jib-decks`)
- [ ] Design JIB deck card/table:
  - [ ] Well name/identifier
  - [ ] Billing period
  - [ ] Operator
  - [ ] Total cost
  - [ ] Status badge
- [ ] Add filters (period, well, status)
- [ ] Add create new JIB deck button
- [ ] Create mock JIB deck data

### Task 4.2: JIB Deck Detail View
- [ ] Create JIB deck detail page (`/phase2/jib-decks/:id`)
- [ ] Design JIB deck sections:
  - [ ] Well and period information
  - [ ] Cost breakdown by category
  - [ ] Cost table with:
    - [ ] Category
    - [ ] Description
    - [ ] Amount
    - [ ] Vendor
    - [ ] Invoice number
  - [ ] Total cost summary
  - [ ] Working interest allocation
- [ ] Add cost management:
  - [ ] Add cost button
  - [ ] Edit/delete cost
  - [ ] Link to AFE

### Task 4.3: JIB Invoice Management
- [ ] Create invoice list view (within JIB deck)
- [ ] Design invoice table:
  - [ ] Non-operator organization
  - [ ] Working interest %
  - [ ] Invoice amount
  - [ ] Status
  - [ ] Due date
  - [ ] Payment info
- [ ] Add generate invoice functionality
- [ ] Add invoice detail view
- [ ] Create invoice payment tracking UI

### Task 4.4: AFE Management UI
- [ ] Create AFE list view (`/phase2/afes`)
- [ ] Design AFE card/table:
  - [ ] AFE number
  - [ ] Well name
  - [ ] Estimated cost
  - [ ] Status
- [ ] Create AFE detail view (`/phase2/afes/:id`)
- [ ] Design AFE sections:
  - [ ] Basic information
  - [ ] Estimated vs approved cost
  - [ ] Participation decisions
  - [ ] Linked JIB costs
- [ ] Add AFE approval workflow UI

---

## Phase 5: AMI & Contract Areas UI

### Task 5.1: Contract Area List View
- [ ] Create contract area list page (`/phase2/contract-areas`)
- [ ] Design contract area card/table:
  - [ ] Name
  - [ ] Effective/expiration dates
  - [ ] Number of participants
  - [ ] Description preview
- [ ] Add map view option (placeholder for GeoJSON)
- [ ] Add create new contract area button

### Task 5.2: Contract Area Detail View
- [ ] Create contract area detail page (`/phase2/contract-areas/:id`)
- [ ] Design contract area sections:
  - [ ] Basic information
  - [ ] Geographic boundary (map placeholder)
  - [ ] Participants table
  - [ ] Effective dates
- [ ] Add participant management:
  - [ ] Add participant form
  - [ ] Edit participant
  - [ ] Remove participant
- [ ] Link to related AMIs

### Task 5.3: AMI Management UI
- [ ] Create AMI list view (`/phase2/amis`)
- [ ] Create AMI detail view (`/phase2/amis/:id`)
- [ ] Design AMI sections:
  - [ ] Linked contract area
  - [ ] AMI terms
  - [ ] Notification requirements
  - [ ] Participation obligations
- [ ] Add AMI opportunity notification UI (mock)

### Task 5.4: JOA Management UI
- [ ] Create JOA list view (`/phase2/joas`)
- [ ] Create JOA detail view (`/phase2/joas/:id`)
- [ ] Design JOA sections:
  - [ ] Well information
  - [ ] Operator designation
  - [ ] JOA terms and provisions
  - [ ] Document reference
- [ ] Add JOA participants view

---

## Phase 6: Title Curative UI

### Task 6.1: Title Opinion List View
- [ ] Create title opinion list page (`/phase2/title-opinions`)
- [ ] Design title opinion card/table:
  - [ ] Linked tract/lease
  - [ ] Attorney name
  - [ ] Opinion date
  - [ ] Document type (DOTO, etc.)
  - [ ] Curative requirements count
- [ ] Add filters (date, attorney, lease)
- [ ] Add upload title opinion button

### Task 6.2: Title Opinion Detail View
- [ ] Create title opinion detail page (`/phase2/title-opinions/:id`)
- [ ] Design title opinion sections:
  - [ ] Basic information
  - [ ] Linked lease/tract
  - [ ] Document viewer (placeholder)
  - [ ] Curative requirements list
  - [ ] Extracted information (mock AI extraction)
- [ ] Add curative requirement management:
  - [ ] Add requirement
  - [ ] Update status
  - [ ] Mark as completed

### Task 6.3: Curative Requirement Management
- [ ] Create curative requirement detail view
- [ ] Design requirement sections:
  - [ ] Requirement type
  - [ ] Description
  - [ ] Status tracking
  - [ ] Resolution document
  - [ ] Completion tracking
- [ ] Add workflow status indicators

### Task 6.4: Abstract Management UI
- [ ] Create abstract list view (`/phase2/abstracts`)
- [ ] Create abstract detail view (`/phase2/abstracts/:id`)
- [ ] Design abstract sections:
  - [ ] Tract information
  - [ ] Abstract number
  - [ ] Abstractor information
  - [ ] Version tracking
  - [ ] Document viewer
- [ ] Add abstract version comparison UI

---

## Phase 7: Post-Sale Obligation Summary UI

### Task 7.1: Obligation Summary View
- [ ] Add obligation summary section to transaction detail page
- [ ] Design summary sections:
  - [ ] Leases acquired
  - [ ] Division order requirements
  - [ ] Contract area obligations
  - [ ] Title curative requirements
- [ ] Add download summary PDF button (mock)
- [ ] Create summary preview modal/page

### Task 7.2: Transaction-to-Lease Linking UI
- [ ] Add "View Obligations" button to completed transactions
- [ ] Create transaction obligations view
- [ ] Show linked leases from transaction
- [ ] Display lease obligations calendar
- [ ] Link to Phase 2 lease management

---

## Phase 8: Mock Data & Prototyping

### Task 8.1: Create Mock Data Service
- [ ] Create mock data file for leases
- [ ] Create mock data file for division orders
- [ ] Create mock data file for JIB decks
- [ ] Create mock data file for AMIs/contract areas
- [ ] Create mock data file for title opinions
- [ ] Create mock data service/hook pattern

### Task 8.2: UI Component Library
- [ ] Create reusable lease components
- [ ] Create reusable division order components
- [ ] Create reusable JIB components
- [ ] Create reusable status badges
- [ ] Create reusable date/period displays
- [ ] Create reusable interest percentage displays

### Task 8.3: Forms & Validation
- [ ] Create reusable form components
- [ ] Add form validation patterns
- [ ] Create error message components
- [ ] Add loading states
- [ ] Add success/error toast notifications

---

## Phase 9: Polish & Presentation

### Task 9.1: Visual Design
- [ ] Ensure consistent styling with existing UI
- [ ] Add icons for Phase 2 features
- [ ] Create empty states for lists
- [ ] Add loading skeletons
- [ ] Polish animations and transitions

### Task 9.2: Responsive Design
- [ ] Ensure mobile responsiveness
- [ ] Test tablet layouts
- [ ] Optimize for different screen sizes
- [ ] Test mobile navigation

### Task 9.3: User Experience
- [ ] Add helpful tooltips
- [ ] Create onboarding hints
- [ ] Add contextual help text
- [ ] Create demo mode/tour
- [ ] Add breadcrumb navigation
- [ ] Ensure keyboard navigation

---

## Mock Data Structure

### Sample Lease Data
```typescript
{
  id: string;
  assetId?: string;
  lessorOrgName: string;
  lesseeOrgName: string;
  leaseDate: Date;
  primaryTermMonths: number;
  primaryTermExpires: Date;
  royaltyRate: number; // 0.25 = 25%
  bonusAmount: number;
  delayRentalAmount: number;
  leaseStatus: 'ACTIVE' | 'EXPIRED' | 'RENEWED';
  heldByProduction: boolean;
  // ... other fields
}
```

### Sample Division Order Data
```typescript
{
  id: string;
  wellId: string;
  wellName: string;
  operatorOrgName: string;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE';
  owners: Array<{
    id: string;
    name: string;
    decimalInterest: number;
    ownerType: 'MINERAL' | 'WORKING_INTEREST' | 'OVERRIDE';
  }>;
  // ... other fields
}
```

---

## Status Tracking

**Current Phase:** Phase 1 (Foundation & Navigation)  
**Overall Progress:** ~5% (Navigation setup complete)

**Next Steps:**
1. Complete Phase 1 layout structure
2. Begin Phase 2: Lease Management UI
3. Create mock data structure
4. Build lease list view

---

## Notes

- **UI-First Approach**: All data is mock/simulated for demonstration
- **Backend Integration**: Will be added later based on Herbert's feedback
- **Rapid Prototyping**: Focus on getting visual workflows complete quickly
- **User Testing**: Prepare for user testing with Herbert

---

**Last Updated:** 2025-01-16