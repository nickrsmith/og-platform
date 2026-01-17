# Backend/Frontend Mapping - Changelog

## Version 1.1 - January 16, 2026

### Organization Roles Rename

**Migration Applied:** `20260116200000_rename_organization_roles`

**Changes:**
- `Admin` → `Manager` - Organization administrator role
- `Creator` → `AssetManager` - Asset creation and management role
- `Verifier` → `Compliance` - Asset verification/compliance role (future use)
- `Principal` - Unchanged (organization owner)

**Files Updated:**
- Database schema and migration
- Backend enums and services (12 files)
- Frontend role displays (4 files)
- Documentation (BACKEND_FRONTEND_MAPPING.md, DEV_HANDOFF.md)

**Note:** On-chain role names remain `CREATOR_ROLE` for smart contract compatibility.

---

## Version 1.0 - Initial Documentation

Complete mapping of all backend API endpoints to frontend components and user flows.
