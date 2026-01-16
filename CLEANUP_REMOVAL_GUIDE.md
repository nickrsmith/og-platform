# Cleanup Removal Guide - MVP Starting Point

**Purpose:** This document lists all files, directories, and code references that should be removed from the `og_application` folder to create a clean repository starting point for Zain to hook up the frontend to the backend.

**Based on:** PROJECT_DISCUSSION.md decisions and MVP requirements

---

## 🎯 Removal Strategy

### Key Principles:
1. **Remove non-MVP features** - Anything not needed for the 2-week MVP launch
2. **Remove deferred features** - P2P/lens-platform real-time sync (deferred until after MVP)
3. **Remove replaced integrations** - CLEAR (replaced with Persona), FuLa (replaced with Pinata only)
4. **Remove development tooling** - Task System (internal dev tool, not part of MVP)
5. **Remove historical documentation** - Status docs, troubleshooting logs, implementation notes
6. **Keep core architecture** - Frontend UI, backend services, IPFS (Pinata), core-api structure

---

## 📁 Directories to Remove

### 1. Task System (Development Tooling)
**Reason:** Internal development task management system, not part of MVP application

```
Task System/
├── ENHANCED_SYSTEM_SUMMARY.md
├── TASK_SYSTEM_FILES_CHECKLIST.md
├── TASK_SYSTEM_IMPROVEMENTS_REVIEW.md
├── TASK_SYSTEM_SETUP_GUIDE.md
└── TASKS/
    ├── .task-config.json
    ├── CODE_REVIEW_GUIDE.md
    ├── WORKFLOW.md
    └── templates/
        ├── quality-gates-checklist.md
        ├── security-checklist.md
        ├── task-template.md
        └── work-log-template.md
```

### 2. Admin Panel Recreation Docs
**Reason:** Not MVP-related, appears to be planning documentation

```
admin_panel/
└── RECREATE_ADMIN_PANEL.md
```

---

## 📄 Root-Level Documentation Files to Remove

### Historical Status & Cleanup Documents
**Reason:** These are historical status documents, not needed for clean start

- `AUDIT_OVERVIEW.md` - Historical audit document
- `CLEANUP_COMPLETE.md` - Cleanup status (historical)
- `CLEANUP_SCRIPT.ps1` - One-time cleanup script (already run)
- `MIGRATION_NOTES.md` - Historical migration notes
- `SETUP_COMPLETE.md` - Historical setup status
- `PRE_GITHUB_CHECKLIST.md` - Pre-repo checklist (historical)

### Planning & Implementation Documents (Keep MVP Guide, Remove Others)
**Reason:** Keep only the essential MVP guide, remove detailed implementation plans that are now outdated

- `MVP_IMPLEMENTATION_PLAN.md` - Detailed plan (superseded by discussion notes)
- `COMPREHENSIVE_APPLICATION_DOCUMENTATION.md` - Comprehensive doc (too detailed for MVP start)

**Keep:**
- `MVP_GUIDE.md` - Essential MVP reference (keep)
- `PROJECT_DISCUSSION.md` - Zain's custom instructions (keep)

---

## 📄 Frontend Documentation Files to Remove

### CLEAR Integration (Replaced with Persona)
**Reason:** CLEAR is being replaced with Persona for identity verification

```
frontend/
└── CLEAR_INTEGRATION.md
```

**Also search and remove CLEAR references from:**
- `frontend/WEB3AUTH_CLEAR_INTEGRATION_ANALYSIS.md` - CLEAR-specific analysis
- Any code files referencing CLEAR (see code cleanup section)

### Beta/Testing Documentation
**Reason:** Historical beta testing docs, not needed for clean start

```
frontend/
├── BETA_AI_BLOCKCHAIN_INTEGRATION_PLAN.md
├── BETA_INTEGRATION_CHECKLIST.md
├── BETA_INTEGRATION_SUMMARY.md
├── BETA_QUICK_START.md
├── BETA_SETUP_SUMMARY.md
└── BETA_TESTING.md
```

### Web3Auth Implementation Status Docs
**Reason:** Historical implementation status, not needed if implementation is complete

```
frontend/
├── WEB3AUTH_BACKEND_REQUIREMENT.md
├── WEB3AUTH_CLEAR_INTEGRATION_ANALYSIS.md
├── WEB3AUTH_DASHBOARD_SETUP_GUIDE.md
├── WEB3AUTH_FIX_NEEDED.md
├── WEB3AUTH_FIXES_IMPLEMENTED.md
├── WEB3AUTH_IMPACT_ANALYSIS.md
├── WEB3AUTH_IMPLEMENTATION_COMPLETE.md
├── WEB3AUTH_IMPLEMENTATION_STATUS.md
├── WEB3AUTH_IMPORT_FIX.md
├── WEB3AUTH_MIGRATION_STRATEGY.md
├── WEB3AUTH_PACKAGE_FIX.md
├── WEB3AUTH_TESTING_GUIDE.md
└── WEB3AUTH_WALLET_SETUP.md
```

**Note:** Keep Web3Auth code implementation, just remove status/troubleshooting docs

### Deployment & Troubleshooting Docs
**Reason:** Historical troubleshooting and deployment status docs

```
frontend/
├── BLANK_PAGE_DIAGNOSIS.md
├── BLANK_PAGE_TROUBLESHOOTING.md
├── BUFFER_BIND_ERROR_FIX.md
├── BUFFER_FIX_FINAL.md
├── BUFFER_FIX_PLUGIN_ORDER.md
├── BUFFER_FIX_VITE_PLUGIN.md
├── BUFFER_POLYFILL_FIX.md
├── BUFFER_POLYFILL_V2.md
├── CURRENT_STATUS.md
├── DEPLOY_TO_VERCEL.md
├── DEPLOYMENT_SUCCESS.md
├── HAUSKA_CONFIG_APPLIED.md
├── HAUSKA_WORKING_CONFIG_ANALYSIS.md
├── LOCALHOST_DEVELOPMENT_SETUP.md
├── LOCALHOST_TROUBLESHOOTING_FIX.md
├── LOCALHOST_DEPLOYMENT_FIXED.md
├── NEXT_STEPS_IMMEDIATE.md
├── PHASE1_IMPLEMENTATION_COMPLETE.md
├── PLANNING_DOC_QUICK_START.md
├── PRODUCTION_CHECKLIST.md
├── PRODUCTION_DEPLOYMENT.md
├── PRODUCTION_INTEGRATION_NEXT_STEPS.md
├── QUICK_DEPLOY.md
├── ROUTING_FIX.md
├── START_SERVER.md
├── VERCEL_BETA_DEPLOYMENT.md
├── VERCEL_BUILD_ERROR_FIX.md
├── VERCEL_BUILD_FIX.md
├── VERCEL_DEPLOYMENT.md
└── VERCEL_ENV_VARS_SETUP.md
```

### Authentication Migration Docs
**Reason:** Historical migration documentation

```
frontend/
├── AUTHENTICATION_MIGRATION_SUMMARY.md
└── AUTHENTICATION_README.md
```

**Note:** Keep authentication code, just remove migration docs

### Planning Documents
**Reason:** Historical planning docs

```
frontend/
└── MASTER_PLANNING_DOCUMENT_TEMPLATE.md
```

### Environment Config Docs
**Reason:** Should be in main docs, not frontend folder

```
frontend/
└── ENV_CONFIG.md
```

**Note:** Move essential env config to main `docs/ENVIRONMENT.md` if needed

---

## 📄 Backend Documentation Files to Remove

### Historical Status & Review Docs
**Reason:** Historical status documents

```
backend/
├── AGENT_HANDOFF_SUMMARY.md
├── BACKEND_ERRORS_SUMMARY.md
├── BACKEND_REBUILD_STATUS.md
├── BACKEND_REVIEW_AND_NEXT_STEPS.md
├── BACKEND_SETUP_STATUS.md
├── BACKEND_VOLUME_MOUNT_ISSUE.md
├── BUILD_ISSUE_DIAGNOSIS.md
├── DOCKER_START_INSTRUCTIONS.md
├── ERROR_SUMMARY.md
├── NEXT_AGENT_INSTRUCTIONS.md
├── NEXT_AGENT_NOTES.md
├── QUICK_START_FIXES.md
└── TYPESCRIPT_ERRORS_FIXED.md
```

### Integration Planning Docs (Keep Architecture, Remove Planning)
**Reason:** Keep architecture docs, remove detailed planning docs

```
backend/
├── AI_MODEL_INTEGRATION.md
├── ASSET_VALIDATION_INTEGRATION.md
├── ENVERUS_INTEGRATION.md
├── INTEGRATION_TESTS_EXPANSION.md
├── NOTIFICATION_SYSTEM.md
├── ORGANIZATION_CATEGORY_MANAGEMENT.md
├── PERFORMANCE_OPTIMIZATION.md
├── PHASE5_INTEGRATION_TESTING.md
├── REVENUE_DISTRIBUTION_SERVICE.md
└── TRANSACTION_SETTLEMENT_SERVICE.md
```

**Keep:**
- `backend/docs/` - Architecture and API documentation (keep)
- `backend/API_DOCUMENTATION_SETUP.md` - If still relevant

### Security & Analysis Docs
**Reason:** Historical analysis docs

```
backend/
├── DOCKER_SECURITY.md
├── HAUSKA_DOCS_ANALYSIS.md
├── SECRET_SCANNING.md
└── BACKEND_SMART_CONTRACT_INTEGRATION.md
```

**Note:** Keep security test files in `backend/tests/security/`, just remove analysis docs

---

## 🔍 Code References to Remove/Update

### 1. FuLa Provider (IPFS Service)
**Reason:** FuLa is being removed, Pinata only per discussion

**Location:** `backend/apps/ipfs-service/src/providers/fula.provider.ts`

**Action:** Delete this file and remove FuLa references from:
- IPFS service configuration
- Environment variable examples
- Documentation references

**Files to check:**
- `backend/apps/ipfs-service/src/` - Check for FuLa imports/config
- `.env.example` files - Remove `FULA_*` variables
- Any documentation mentioning FuLa

### 2. CLEAR Integration Code
**Reason:** CLEAR is being replaced with Persona

**Action:** Search codebase for CLEAR references and remove:
- CLEAR API integration code
- CLEAR verification models/schemas
- CLEAR-related environment variables
- Frontend CLEAR verification components (if any)

**Files to check:**
- `backend/apps/core-api/src/` - Search for "clear" or "CLEAR"
- `frontend/src/` - Search for CLEAR references
- Database schema - Remove CLEAR-related fields/models
- Environment files - Remove CLEAR API keys/config

**Note:** Replace with Persona integration structure (Zain will implement)

### 3. Lens-Platform P2P Real-Time Sync
**Reason:** Deferred until after MVP per discussion

**Action:** 
- **Keep the lens-platform code** (it exists in hauska repo)
- **Remove references** to using it in MVP
- **Document** that P2P sync is deferred
- **Keep IPFS** (Pinata) for CID-based smart contracts

**Files to check:**
- `backend/docs/3_REPOSITORY_BREAKDOWN/LENS_PLATFORM.md` - Update to note deferred
- Any MVP planning docs referencing lens-platform for MVP
- Frontend code expecting real-time P2P sync

**Note:** The architecture supports plugging in P2P later, so keep the structure but remove MVP expectations

---

## 📋 Summary Checklist

### Directories to Remove
- [ ] `Task System/` (entire directory)
- [ ] `admin_panel/` (entire directory)

### Root Documentation to Remove
- [ ] `AUDIT_OVERVIEW.md`
- [ ] `CLEANUP_COMPLETE.md`
- [ ] `CLEANUP_SCRIPT.ps1`
- [ ] `MIGRATION_NOTES.md`
- [ ] `MVP_IMPLEMENTATION_PLAN.md`
- [ ] `COMPREHENSIVE_APPLICATION_DOCUMENTATION.md`
- [ ] `PRE_GITHUB_CHECKLIST.md`
- [ ] `SETUP_COMPLETE.md`

### Frontend Documentation to Remove (~50+ files)
- [ ] All CLEAR integration docs
- [ ] All Beta/testing docs
- [ ] All Web3Auth status docs
- [ ] All deployment/troubleshooting docs
- [ ] All authentication migration docs
- [ ] Planning document templates

### Backend Documentation to Remove (~20+ files)
- [ ] All status/review docs
- [ ] Integration planning docs (keep architecture)
- [ ] Historical analysis docs

### Code to Remove/Update
- [ ] `backend/apps/ipfs-service/src/providers/fula.provider.ts` (delete)
- [ ] FuLa references in IPFS service config
- [ ] FuLa environment variables from `.env.example`
- [ ] CLEAR integration code (backend & frontend)
- [ ] CLEAR database schema fields/models
- [ ] CLEAR environment variables

### Code to Keep (But Document as Deferred)
- [ ] Lens-platform architecture docs (update to note deferred)
- [ ] IPFS service (Pinata provider only)
- [ ] Core API structure
- [ ] Frontend UI components
- [ ] Web3Auth implementation (code, not status docs)

---

## 🎯 What to Keep

### Essential for MVP
- ✅ `frontend/` - UI code (React components, pages, hooks)
- ✅ `backend/apps/core-api/` - Core API service
- ✅ `backend/apps/ipfs-service/` - IPFS service (Pinata only)
- ✅ `backend/apps/blockchain-service/` - Blockchain service
- ✅ `backend/apps/admin-service/` - Admin service
- ✅ `backend/apps/kms-service/` - KMS service
- ✅ `backend/libs/` - Shared libraries
- ✅ `backend/docs/` - Architecture documentation
- ✅ `docs/` - Main documentation
- ✅ `README.md` - Main readme
- ✅ `MVP_GUIDE.md` - MVP reference
- ✅ `PROJECT_DISCUSSION.md` - Zain's instructions

### Infrastructure
- ✅ `docker-compose.yml` files
- ✅ `.env.example` files (updated to remove FuLa/CLEAR)
- ✅ Package management files (`package.json`, `pnpm-lock.yaml`, etc.)
- ✅ Configuration files (TypeScript, ESLint, Prettier, etc.)

---

## 📝 Post-Cleanup Actions

After removal, update:

1. **README.md** - Remove references to removed features
2. **MVP_GUIDE.md** - Update to reflect Persona (not CLEAR), Pinata only (not FuLa)
3. **Environment Examples** - Remove FuLa and CLEAR variables, add Persona placeholders
4. **Architecture Docs** - Note that P2P/lens-platform is deferred
5. **Frontend API Client** - Remove CLEAR endpoints, prepare for Persona
6. **Database Schema** - Remove CLEAR fields, add Persona fields structure

---

## 🔗 Integration Points for Zain

After cleanup, Zain will need to:

1. **Persona Integration** - Replace CLEAR with Persona for identity verification
2. **Simplifile Integration** - Add e-recording and notary functionality
3. **API Wiring** - Connect frontend mock data to real backend APIs
4. **IPFS (Pinata)** - Ensure only Pinata provider is used
5. **RBAC** - Ensure tight role-based access control is in place
6. **JWT Auth** - Verify JWT-based authentication is working

---

**Last Updated:** Based on PROJECT_DISCUSSION.md decisions  
**Next Step:** Execute cleanup, then provide clean repo to Zain
