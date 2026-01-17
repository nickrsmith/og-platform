# Post-Asset Sale Features Implementation - Task Plan

**Status:** Pending  
**Created:** 2025-01-16  
**Goal:** Implement land administration platform, smart contract layer for leases, and AI integration for post-asset sale features

**Related Documents:**
- `HERBERT_CONVERSATION_ANALYSIS_AND_PLAN.md` - Conversation analysis and requirements
- `LAND_SYSTEM_VISION.md` - Complete land system vision and architecture
- `MONETIZATION_PLANNING.md` - Monetization and business model

---

## Overview

This task plan tracks the implementation of post-asset sale features for the Empressa marketplace. These features enable land administration workflows that occur after an asset sale is complete, including:

1. **Land Administration Platform** (Separate Service)
   - Division orders management
   - JIB decks (joint interest billing)
   - Lease obligation tracking
   - Contract area/AMI management
   - Title curative workflows

2. **Smart Contract Layer for Leases**
   - Lease smart contracts (automated payment obligations)
   - Division order smart contracts
   - Joint Operating Agreement (JOA) smart contracts
   - AMI (Area of Mutual Interest) contracts

3. **AI Integration**
   - AI to read DOTO (Drilling Order Title Opinion) documents
   - Auto-generate division order decks from documents
   - Automated lease obligation extraction

---

## Phase 1: Foundation - Database Schema & Core Models

### Task 1.1: Lease Management Schema ✅ COMPLETED
- [x] Create `leases` table
  - [ ] Link to existing `assets` table
  - [ ] Track lessor/lessee (organizations)
  - [ ] Store lease terms (primary term, royalty rate, bonus, delay rental)
  - [ ] Track lease provisions (Pugh clause, depth severance, continuous operations, shut-in royalty)
  - [ ] Monitor lease status (active, expired, terminated, renewed, disputed)
  - [ ] Track held-by-production status
  - [x] Store lease documents and recording information
- [x] Create `lease_assignments` table
  - [ ] Track lease transfers between organizations
  - [ ] Store retained interests (ORRI)
  - [x] Link to assignment documents
- [x] Create `lease_amendments` table
  - [ ] Track lease modifications
  - [ ] Store amendment types and descriptions
  - [x] Link to amendment documents
- [x] Add Prisma models for leases, assignments, and amendments
- [ ] Create database migrations (pending)

**Database Schema Reference:** See `LAND_SYSTEM_VISION.md` lines 200-270

### Task 1.2: Division Orders Schema (Enhance Existing)
- [ ] Review existing `division-orders` module in `core-api`
- [ ] Enhance division orders schema:
  - [ ] Link to wells/assets
  - [ ] Track owner information and addresses
  - [ ] Store tax ID (SSN/EIN) for W-9 purposes
  - [ ] Track division order status (pending, signed, rejected, superseded)
  - [ ] Store payment information
  - [ ] Link to division order documents
- [ ] Create `royalty_interests` table
  - [ ] Track royalty, NPRI, ORRI interests
  - [ ] Store decimal interest percentages
  - [ ] Link to tracts/wells
- [ ] Create `royalty_payments` table
  - [ ] Track payment history
  - [ ] Store production periods and volumes
  - [ ] Calculate revenue and interest payments
- [ ] Add Prisma models
- [ ] Update database migrations

**Note:** Check existing implementation at `backend/apps/core-api/src/division-orders/`

### Task 1.3: JIB (Joint Interest Billing) Schema ✅ COMPLETED
- [x] Create `jib_decks` table
  - [ ] Link to wells/units
  - [ ] Track working interest percentages
  - [ ] Store billing periods
  - [ ] Track deck status
- [ ] Create `jib_costs` table
  - [ ] Categorize costs (drilling, completion, operations, etc.)
  - [ ] Allocate costs to working interest owners
  - [ ] Track cost approvals
- [ ] Create `afes` (Authorization for Expenditure) table
  - [ ] Link to wells/units
  - [ ] Track AFE amounts and approvals
  - [ ] Store participation decisions
  - [ ] Link to JIB costs
- [x] Create `jib_invoices` table
  - [ ] Generate invoices from JIB decks
  - [ ] Track payment status
  - [x] Store payment history
- [x] Add Prisma models
- [ ] Create database migrations (pending)

### Task 1.4: AMI (Area of Mutual Interest) & Contract Area Schema ✅ COMPLETED
- [x] Create `contract_areas` table
  - [ ] Define geographic boundaries
  - [ ] Store polygon coordinates (GeoJSON)
  - [ ] Track effective dates
  - [ ] Link to participating organizations
- [ ] Create `amis` (Area of Mutual Interest) table
  - [ ] Link to contract areas
  - [ ] Store AMI terms and obligations
  - [ ] Track notification requirements
  - [ ] Store participating parties
- [ ] Create `joas` (Joint Operating Agreement) table
  - [ ] Link to wells/units
  - [ ] Store operating agreements
  - [ ] Track operator designation
  - [x] Store JOA terms and provisions
- [x] Add Prisma models
- [ ] Create database migrations (pending)

### Task 1.5: Title Curative Workflows Schema ✅ COMPLETED
- [x] Create `title_opinions` table
  - [ ] Store title opinion documents (DOTO)
  - [ ] Link to tracts/leases
  - [ ] Track opinion dates and attorneys
  - [ ] Store curative requirements
- [ ] Create `curative_requirements` table
  - [ ] Link to title opinions
  - [ ] Track requirement types
  - [ ] Monitor curative status
  - [ ] Store resolution documents
- [ ] Create `abstracts` table
  - [ ] Store abstract documents
  - [ ] Link to tracts
  - [ ] Track abstractor information
  - [x] Version abstracts
- [x] Add Prisma models
- [ ] Create database migrations (pending)

---

## Phase 2: Land Administration Service (New Separate Service)

### Task 2.1: Create Land Administration Service Structure
- [ ] Create new NestJS service: `land-admin-service`
  - [ ] Set up in `backend/apps/land-admin-service/`
  - [ ] Configure module structure (leases, division-orders, jib, ami, title-curative)
  - [ ] Set up authentication/authorization
  - [ ] Configure database connection (shared Prisma schema)
  - [ ] Set up API gateway configuration
- [ ] Create service-specific configuration
  - [ ] Environment variables
  - [ ] Port configuration (suggest: 3010)
  - [ ] Service health checks
- [ ] Update `nest-cli.json` to include new service
- [ ] Update `package.json` workspace dependencies

### Task 2.2: Lease Management Module
- [ ] Create `LeasesModule`
- [ ] Implement `LeasesController`:
  - [ ] `GET /leases` - List all leases
  - [ ] `GET /leases/:id` - Get lease details
  - [ ] `POST /leases` - Create new lease
  - [ ] `PUT /leases/:id` - Update lease
  - [ ] `GET /leases/:id/obligations` - Get lease obligations
  - [ ] `GET /leases/:id/assignments` - Get lease assignments
  - [ ] `POST /leases/:id/assignments` - Create lease assignment
  - [ ] `GET /leases/expiring` - Get expiring leases
  - [ ] `GET /leases/hbp` - Get held-by-production leases
- [ ] Implement `LeasesService`:
  - [ ] CRUD operations for leases
  - [ ] Calculate lease obligations (royalties, rentals, shut-ins)
  - [ ] Track lease expiration dates
  - [ ] Validate lease provisions
  - [ ] Generate lease summaries
- [ ] Create DTOs for lease operations
- [ ] Add validation pipes
- [ ] Write unit tests

### Task 2.3: Division Orders Module (Enhance/Create)
- [ ] Review existing `division-orders` module in `core-api`
- [ ] Decide: Enhance existing or create new in `land-admin-service`
- [ ] Implement `DivisionOrdersController`:
  - [ ] `GET /division-orders` - List division orders
  - [ ] `GET /division-orders/:id` - Get division order details
  - [ ] `POST /division-orders` - Create division order
  - [ ] `PUT /division-orders/:id` - Update division order
  - [ ] `POST /division-orders/:id/sign` - Mark as signed
  - [ ] `GET /division-orders/well/:wellId` - Get division orders for well
  - [ ] `GET /division-orders/owner/:ownerId` - Get division orders for owner
- [ ] Implement `DivisionOrdersService`:
  - [ ] CRUD operations for division orders
  - [ ] Calculate owner interest percentages
  - [ ] Validate W-9 information
  - [ ] Track division order status
  - [ ] Generate division order documents
- [ ] Implement `RoyaltyInterestsService`:
  - [ ] Calculate royalty interest allocations
  - [ ] Track NPRI and ORRI interests
  - [ ] Generate royalty payment calculations
- [ ] Create DTOs
- [ ] Write unit tests

### Task 2.4: JIB Decks Module
- [ ] Create `JibDecksModule`
- [ ] Implement `JibDecksController`:
  - [ ] `GET /jib-decks` - List JIB decks
  - [ ] `GET /jib-decks/:id` - Get JIB deck details
  - [ ] `POST /jib-decks` - Create JIB deck
  - [ ] `PUT /jib-decks/:id` - Update JIB deck
  - [ ] `POST /jib-decks/:id/generate-invoice` - Generate invoice from deck
  - [ ] `GET /jib-decks/well/:wellId` - Get JIB decks for well
- [ ] Implement `JibDecksService`:
  - [ ] CRUD operations for JIB decks
  - [ ] Allocate costs by working interest
  - [ ] Calculate owner shares
  - [ ] Generate JIB invoices
  - [ ] Track payment status
- [ ] Implement `AfesService`:
  - [ ] Create and manage AFEs
  - [ ] Track AFE approvals
  - [ ] Record participation decisions
  - [ ] Link AFEs to JIB costs
- [ ] Create DTOs
- [ ] Write unit tests

### Task 2.5: AMI & Contract Area Module
- [ ] Create `ContractAreasModule`
- [ ] Implement `ContractAreasController`:
  - [ ] `GET /contract-areas` - List contract areas
  - [ ] `GET /contract-areas/:id` - Get contract area details
  - [ ] `POST /contract-areas` - Create contract area
  - [ ] `GET /contract-areas/:id/participants` - Get participants
  - [ ] `GET /amis` - List AMI agreements
  - [ ] `GET /amis/:id` - Get AMI details
  - [ ] `POST /amis` - Create AMI agreement
  - [ ] `GET /joas` - List JOA agreements
  - [ ] `GET /joas/:id` - Get JOA details
  - [ ] `POST /joas` - Create JOA agreement
- [ ] Implement `ContractAreasService`:
  - [ ] Manage contract area boundaries (GeoJSON)
  - [ ] Validate geographic intersections
  - [ ] Track participating organizations
- [ ] Implement `AmisService`:
  - [ ] Manage AMI terms and obligations
  - [ ] Track notification requirements
  - [ ] Monitor participation obligations
- [ ] Implement `JoasService`:
  - [ ] Manage JOA agreements
  - [ ] Track operator designation
  - [ ] Store JOA terms
- [ ] Create DTOs
- [ ] Write unit tests

### Task 2.6: Title Curative Module
- [ ] Create `TitleCurativeModule`
- [ ] Implement `TitleCurativeController`:
  - [ ] `GET /title-opinions` - List title opinions
  - [ ] `GET /title-opinions/:id` - Get title opinion details
  - [ ] `POST /title-opinions` - Upload title opinion (DOTO)
  - [ ] `GET /title-opinions/:id/curative-requirements` - Get curative requirements
  - [ ] `POST /curative-requirements` - Create curative requirement
  - [ ] `PUT /curative-requirements/:id` - Update curative status
  - [ ] `GET /abstracts` - List abstracts
  - [ ] `GET /abstracts/:id` - Get abstract details
  - [ ] `POST /abstracts` - Upload abstract
- [ ] Implement `TitleCurativeService`:
  - [ ] Store and manage title opinions
  - [ ] Extract curative requirements from documents
  - [ ] Track curative workflow status
  - [ ] Monitor requirement resolution
- [ ] Implement `AbstractsService`:
  - [ ] Store and version abstracts
  - [ ] Link abstracts to tracts
  - [ ] Track abstractor information
- [ ] Create DTOs
- [ ] Write unit tests

---

## Phase 3: Post-Sale Obligation Summary Integration

### Task 3.1: Transaction-to-Lease Linking
- [ ] Update `core-api` transaction completion workflow
- [ ] After asset sale completion:
  - [ ] Extract lease information from asset data
  - [ ] Create lease records in database
  - [ ] Link leases to transaction
  - [ ] Create division order records
  - [ ] Generate obligation summary document
- [ ] Implement `ObligationSummaryService`:
  - [ ] Extract lease obligations from transactions
  - [ ] Generate PDF summary using template
  - [ ] Email summary to buyer
  - [ ] Store summary document in data room

### Task 3.2: Obligation Summary Template
- [ ] Design PDF template for obligation summaries
  - [ ] Include transaction details
  - [ ] List all leases acquired
  - [ ] Show lease obligations (royalties, rentals, shut-ins)
  - [ ] Include division order requirements
  - [ ] Show contract area/AMI obligations
  - [ ] List title curative requirements
- [ ] Implement PDF generation service
- [ ] Test template with sample data
- [ ] Integrate with transaction completion workflow

---

## Phase 4: Smart Contract Layer for Leases

### Task 4.1: Lease Smart Contract Design
- [ ] Design `LeaseContract.sol`:
  - [ ] Store lease terms (royalty rate, rental amount, dates)
  - [ ] Track lessor and lessee addresses
  - [ ] Automated royalty payment distribution
  - [ ] Rental payment automation
  - [ ] Shut-in payment handling
  - [ ] Lease expiration tracking
  - [ ] Events for lease actions
- [ ] Design contract interfaces
- [ ] Create contract documentation
- [ ] Review with team

### Task 4.2: Division Order Smart Contract
- [ ] Design `DivisionOrderContract.sol`:
  - [ ] Store owner interest percentages
  - [ ] Track owner addresses
  - [ ] On-chain division order verification
  - [ ] Automated royalty distribution by interest
  - [ ] Events for division order updates
- [ ] Design contract interfaces
- [ ] Create contract documentation
- [ ] Review with team

### Task 4.3: JOA (Joint Operating Agreement) Smart Contract
- [ ] Design `JoaContract.sol`:
  - [ ] Store working interest percentages
  - [ ] Define operator and non-operator roles
  - [ ] Automated cost allocation
  - [ ] AFE approval workflow (on-chain voting)
  - [ ] Automated billing based on working interest
  - [ ] Events for JOA actions
- [ ] Design contract interfaces
- [ ] Create contract documentation
- [ ] Review with team

### Task 4.4: AMI (Area of Mutual Interest) Smart Contract
- [ ] Design `AmiContract.sol`:
  - [ ] Store contract area boundaries (or hash)
  - [ ] Track participating parties
  - [ ] Automated notification on new opportunities
  - [ ] Track participation obligations
  - [ ] Events for AMI triggers
- [ ] Design contract interfaces
- [ ] Create contract documentation
- [ ] Review with team

### Task 4.5: Implement Lease Smart Contracts
- [ ] Create `contracts/LeaseContract.sol`
- [ ] Implement lease term storage
- [ ] Implement automated royalty payments
- [ ] Implement rental payment logic
- [ ] Add lease expiration checks
- [ ] Write unit tests
- [ ] Deploy to testnet
- [ ] Integration testing

### Task 4.6: Implement Division Order Smart Contract
- [ ] Create `contracts/DivisionOrderContract.sol`
- [ ] Implement owner interest tracking
- [ ] Implement royalty distribution logic
- [ ] Add verification mechanisms
- [ ] Write unit tests
- [ ] Deploy to testnet
- [ ] Integration testing

### Task 4.7: Implement JOA Smart Contract
- [ ] Create `contracts/JoaContract.sol`
- [ ] Implement working interest tracking
- [ ] Implement cost allocation logic
- [ ] Implement AFE approval workflow (voting mechanism)
- [ ] Implement automated billing
- [ ] Write unit tests
- [ ] Deploy to testnet
- [ ] Integration testing

### Task 4.8: Implement AMI Smart Contract
- [ ] Create `contracts/AmiContract.sol`
- [ ] Implement contract area storage
- [ ] Implement participant tracking
- [ ] Implement notification mechanism
- [ ] Implement participation obligation tracking
- [ ] Write unit tests
- [ ] Deploy to testnet
- [ ] Integration testing

---

## Phase 5: AI Integration

### Task 5.1: AI Service Setup
- [ ] Evaluate AI/ML service options:
  - [ ] OpenAI GPT-4 with vision
  - [ ] Anthropic Claude with document analysis
  - [ ] AWS Textract for structured data extraction
  - [ ] Custom OCR + NLP solution
- [ ] Set up AI service integration in `land-admin-service`
- [ ] Configure API keys and authentication
- [ ] Create AI service abstraction layer

### Task 5.2: DOTO (Drilling Order Title Opinion) Document Reader
- [ ] Design document parsing workflow:
  - [ ] Upload DOTO document
  - [ ] Extract text via OCR/AI
  - [ ] Parse structured information
  - [ ] Extract curative requirements
  - [ ] Store extracted data
- [ ] Implement `DotoReaderService`:
  - [ ] Document upload and storage
  - [ ] AI-powered text extraction
  - [ ] Parse title information
  - [ ] Extract lease terms
  - [ ] Extract curative requirements
  - [ ] Store in database
- [ ] Create AI prompt templates for DOTO parsing
- [ ] Test with sample DOTO documents
- [ ] Refine extraction accuracy

### Task 5.3: Auto-Generate Division Order Decks
- [ ] Design division order generation workflow:
  - [ ] Input: Well/unit data, owner information
  - [ ] Process: Calculate interests, validate data
  - [ ] Output: Division order deck document
- [ ] Implement `DivisionOrderGeneratorService`:
  - [ ] Extract owner data from documents
  - [ ] Calculate interest percentages
  - [ ] Generate division order documents
  - [ ] Validate W-9 information
  - [ ] Create division order records
- [ ] Create document templates
- [ ] Test with sample data
- [ ] Integration with division orders module

### Task 5.4: Automated Lease Obligation Extraction
- [ ] Design lease obligation extraction:
  - [ ] Input: Lease documents
  - [ ] Process: AI extraction of obligations
  - [ ] Output: Structured obligation data
- [ ] Implement `LeaseObligationExtractorService`:
  - [ ] Extract royalty rates from documents
  - [ ] Extract rental amounts and due dates
  - [ ] Identify shut-in provisions
  - [ ] Extract lease expiration dates
  - [ ] Identify special provisions (Pugh, depth severance, etc.)
  - [ ] Store obligations in database
- [ ] Create AI prompt templates
- [ ] Test with sample lease documents
- [ ] Refine extraction accuracy

---

## Phase 6: Frontend Integration

### Task 6.1: Land Administration Dashboard
- [ ] Create new frontend section: "Land Administration"
- [ ] Build lease management UI:
  - [ ] Lease list view with filters
  - [ ] Lease detail view
  - [ ] Lease obligation calendar
  - [ ] Lease expiration alerts
- [ ] Build division orders UI:
  - [ ] Division order list view
  - [ ] Division order detail view
  - [ ] Owner interest breakdown
- [ ] Build JIB decks UI:
  - [ ] JIB deck list view
  - [ ] Cost breakdown visualization
  - [ ] Invoice generation and tracking
- [ ] Integrate with `land-admin-service` API

### Task 6.2: Post-Sale Obligation View
- [ ] Add "Obligations" tab to transaction details
- [ ] Display obligation summary after sale completion
- [ ] Show lease obligations
- [ ] Show division order requirements
- [ ] Download obligation summary PDF
- [ ] Link to land administration dashboard

---

## Phase 7: Testing & Documentation

### Task 7.1: Integration Testing
- [ ] Test complete workflow: Asset sale → Lease creation → Obligation summary
- [ ] Test lease management end-to-end
- [ ] Test division order generation and tracking
- [ ] Test JIB deck creation and invoicing
- [ ] Test smart contract integrations
- [ ] Test AI document extraction

### Task 7.2: Documentation
- [ ] Document land administration service API
- [ ] Document smart contract interfaces
- [ ] Document AI integration workflows
- [ ] Create user guides for land administration features
- [ ] Update system architecture documentation

---

## Dependencies & Considerations

### External Dependencies
- **AI/ML Service**: Need to select and configure AI service for document analysis
- **PDF Generation**: Library for generating obligation summary PDFs
- **GeoJSON Support**: For contract area boundary storage
- **OCR Service**: If using separate OCR for document processing

### Technical Considerations
- **Service Separation**: Land administration is a separate service from core marketplace
- **Database Sharing**: May share database with core-api or use separate database
- **Authentication**: Land admin service should integrate with existing auth system
- **Blockchain Integration**: Smart contracts need to integrate with existing blockchain infrastructure

### Business Considerations
- **Pricing Model**: Determine if land administration features are free, paid, or tiered
- **Access Control**: Who can access land administration features (buyers only, sellers, all organizations?)
- **Data Migration**: Existing transactions may not have lease/obligation data

---

## Status Tracking

**Current Phase:** Phase 1 (Foundation)  
**Overall Progress:** ~15% (Phase 1 schema definitions complete, migrations pending)

**Next Steps:**
1. Review and approve task plan
2. Begin Phase 1.1: Lease Management Schema
3. Set up development environment for land-admin-service

---

**Last Updated:** 2025-01-16