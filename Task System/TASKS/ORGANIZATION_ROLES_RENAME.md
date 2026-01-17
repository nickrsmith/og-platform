# Organization Roles Rename - Implementation Task

**Created:** January 16, 2026  
**Status:** In Progress  
**Goal:** Rename organization roles to better reflect O&G platform use cases  
**Estimated Time:** 2-3 days (12-19 hours)  
**Priority:** MEDIUM-HIGH

---

## 🎯 Overview

Rename organization roles from generic terms to O&G-specific terminology:

**Changes:**
- `Admin` → `Manager`
- `Creator` → `AssetManager`
- `Verifier` → `Compliance`
- `Principal` → **Keep** (no change)

**Impact:**
- Database enum values must be updated
- All backend code using roles must be updated
- Frontend UI displaying roles must be updated
- Database migration required for existing records

---

## ✅ Task 1: Database Schema & Migration (HIGH PRIORITY)

**Status:** In Progress  
**Estimated Time:** 1-2 hours  
**Blocking:** All other tasks (backend/frontend depend on schema)

### What Needs to Be Done:
- [x] Update Prisma schema enum `OrganizationRole` ✅
- [x] Update default role value from `Creator` to `AssetManager` ✅
- [ ] Create database migration to update enum type (use Prisma CLI: `npx prisma migrate dev`)
- [ ] Update existing records in `organization_members` table (migration will handle this)

### Files to Modify:
- `backend/libs/database/prisma/schema.prisma` - Update enum definition
- Create migration: `backend/libs/database/prisma/migrations/YYYYMMDDHHMMSS_rename_organization_roles/migration.sql`

### Implementation Notes:
- Prisma migration will handle enum type update
- Need to update existing records: `'Admin'→'Manager'`, `'Creator'→'AssetManager'`, `'Verifier'→'Compliance'`
- Test migration on development database first
- Verify existing data migrates correctly

---

## ✅ Task 2: Backend Core Enum Updates

**Status:** Pending  
**Estimated Time:** 30 minutes  
**Blocking:** Task 1 (needs schema updated first)

### What Needs to Be Done:
- [x] Update `Role` enum in `libs/common/src/enums/roles.enum.ts` ✅
- [x] Ensure enum values match Prisma schema exactly ✅

### Files to Modify:
- `backend/libs/common/src/enums/roles.enum.ts`

### Implementation Notes:
- Enum values must match Prisma schema exactly (case-sensitive)
- Update: `Admin→Manager`, `Creator→AssetManager`, `Verifier→Compliance`, `Principal→Principal` (keep)

---

## ✅ Task 3: Backend Services & Controllers

**Status:** Pending  
**Estimated Time:** 4-6 hours  
**Blocking:** Tasks 1 & 2

### What Needs to Be Done:
- [x] Update authorization service role checks ✅
- [x] Update organization controllers role guards ✅
- [x] Update releases controller role guards ✅
- [x] Update auth service role checks ✅
- [x] Update blockchain job processor role references ✅
- [ ] Update admin service role checks (check if needed)

### Files to Modify:
- `backend/libs/common/src/auth/authorization.service.ts`
- `backend/apps/core-api/src/organizations/organizations.controller.ts`
- `backend/apps/core-api/src/organizations/organizations.service.ts`
- `backend/apps/core-api/src/auth/auth.service.ts`
- `backend/apps/admin-service/src/organizations/organizations.service.ts`
- `backend/apps/blockchain-service/src/processing/blockchain-job.processor.ts`

### Implementation Notes:
- Search/replace `Role.Admin` → `Role.Manager`
- Search/replace `Role.Creator` → `Role.AssetManager`
- Search/replace `Role.Verifier` → `Role.Compliance`
- Keep `Role.Principal` as-is
- Same for `OrganizationRole` enum references

---

## ✅ Task 4: Backend Interfaces & DTOs

**Status:** Pending  
**Estimated Time:** 1-2 hours  
**Blocking:** Tasks 1 & 2

### What Needs to Be Done:
- [x] Update `GrantCreatorRolePayload` → `GrantAssetManagerRolePayload` ✅
- [x] Update `RevokeCreatorRolePayload` → `RevokeAssetManagerRolePayload` ✅
- [x] Update all references to these interfaces ✅

### Files to Modify:
- `backend/libs/common/src/interfaces/tx-finalized-event.interface.ts`
- Files importing/using these interfaces

### Implementation Notes:
- Rename interface names
- Update all imports
- Update blockchain job processor payload types

---

## ✅ Task 5: Backend Tests

**Status:** Pending  
**Estimated Time:** 1-2 hours  
**Blocking:** Tasks 1-4

### What Needs to Be Done:
- [x] Update security test role references ✅
- [x] Update input validation test role references ✅
- [ ] Run all tests to verify changes (pending migration)

### Files to Modify:
- `backend/tests/security/authorization-bypass.spec.ts`
- `backend/tests/security/input-validation.spec.ts`
- Any other test files referencing roles

### Implementation Notes:
- Update test role assignments
- Update test assertions checking role names
- Ensure all tests pass after changes

---

## ✅ Task 6: Frontend Role Displays

**Status:** Pending  
**Estimated Time:** 2-3 hours  
**Blocking:** Tasks 1-3 (backend must be updated first)

### What Needs to Be Done:
- [x] Update roles page mock data ✅
- [x] Update team page role displays ✅
- [x] Update organization page role displays ✅
- [x] Update onboarding flow role dropdown ✅
- [x] Update role dropdowns/selects ✅

### Files to Modify:
- `frontend/src/pages/roles.tsx`
- `frontend/src/pages/team.tsx`
- `frontend/src/pages/organization.tsx`
- `frontend/src/pages/register-category-a.tsx` (if applicable)

### Implementation Notes:
- Update mock data to match new role names
- Ensure UI displays: Principal, Manager, AssetManager, Compliance
- Update any hardcoded role strings in components

---

## ✅ Task 7: Documentation Updates

**Status:** Pending  
**Estimated Time:** 1-2 hours  
**Blocking:** None (can be done in parallel)

### What Needs to Be Done:
- [ ] Update workflow documentation
- [ ] Update API documentation
- [ ] Update README files
- [ ] Update inline comments

### Files to Modify:
- `backend/docs/2_CORE_WORKFLOWS/INVITE_MEMBER.md`
- `backend/docs/API_DOCUMENTATION.md`
- `BACKEND_FRONTEND_MAPPING.md` (already updated ✅)
- `backend/libs/common/src/auth/README.md`

### Implementation Notes:
- Update role mentions in documentation
- Update API examples with new role names
- Ensure all documentation is consistent

---

## ✅ Task 8: Verification & Testing

**Status:** Pending  
**Estimated Time:** 3-4 hours  
**Blocking:** All previous tasks

### What Needs to Be Done:
- [ ] Test role-based access control
- [ ] Test invitation flow with new roles
- [ ] Test member management with new roles
- [ ] Verify UI displays new role names correctly
- [ ] Test authorization guards
- [ ] Verify database migration worked correctly

### Test Checklist:
- [ ] Principal can invite members with Manager/AssetManager/Compliance roles
- [ ] Manager can invite members (Principal-only?)
- [ ] AssetManager can create assets
- [ ] Authorization guards work correctly
- [ ] UI shows correct role names
- [ ] Existing data migrated correctly

---

## Files Created:
- `Task System/TASKS/ORGANIZATION_ROLES_RENAME.md` (this file)

## Files Modified:
- Will be tracked as tasks are completed

---

## Implementation Strategy

1. **Start with Database** (Task 1) - Most critical, everything else depends on it
2. **Update Backend Enums** (Task 2) - Quick win, enables backend updates
3. **Update Backend Services** (Tasks 3-4) - Core functionality
4. **Update Tests** (Task 5) - Ensure nothing breaks
5. **Update Frontend** (Task 6) - User-facing changes
6. **Update Documentation** (Task 7) - Can be done in parallel
7. **Final Testing** (Task 8) - Verify everything works

---

## Risk Mitigation

1. **Database Migration:**
   - Test on development database first
   - Backup production before migration
   - Have rollback plan ready

2. **Breaking Changes:**
   - Frontend and backend must be updated together
   - Consider API versioning if needed

3. **Existing Data:**
   - Verify all existing records migrate correctly
   - Check for orphaned data

---

## Notes

- Role names are case-sensitive in TypeScript/Prisma
- Ensure consistency between Prisma schema and TypeScript enum
- Test thoroughly after each phase
- Update this document as tasks are completed
