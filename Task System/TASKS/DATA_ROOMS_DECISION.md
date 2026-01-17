# Data Rooms Backend Location - Decision Document

**Date:** January 16, 2026  
**Task:** Task 1.2 - Determine Data Rooms Location  
**Status:** ✅ DECISION MADE  

---

## Investigation Results

### ❌ Separate Service Check
- **No separate `og-data-room-backend` service found**
- Backend directory contains:
  - `core-api` ✅
  - `admin-service` ✅
  - `blockchain-service` ✅
  - `kms-service` ✅
  - `ipfs-service` ✅
  - **NO `og-data-room-backend` or `data-room-backend`**

### ❌ Database Model Check
- **No `DataRoom` model in Prisma schema**
- Checked `backend/libs/database/prisma/schema.prisma`
- No references to data rooms, data_rooms, or dataRooms in schema
- Frontend `shared/schema.ts` has `dataRooms` table definition, but this is **frontend-only type**, not actual backend model

### ✅ Frontend Expectations
- **Frontend service expects endpoints in core-api:**
  - `GET /data-rooms` - List data rooms
  - `POST /data-rooms` - Create data room
  - `GET /data-rooms/:id` - Get data room
  - `GET /data-rooms/listing/:listingId` - Get by listing ID
  - `GET /data-rooms/asset/:assetId` - Get by asset ID
  - `PATCH /data-rooms/:id` - Update data room
  - `DELETE /data-rooms/:id` - Delete data room
  - `POST /data-rooms/:id/documents` - Upload document
  - `DELETE /data-rooms/:id/documents/:docId` - Delete document
- Frontend uses base API URL: `process.env.VITE_API_URL || 'http://localhost:3000/api/v1'`
- All endpoints expected at `/api/v1/data-rooms/*`

### ✅ Current Backend Structure
- **Releases module** handles asset/release creation
- **File uploads** handled via IPFS service integration
- **No data room functionality** exists in backend

---

## Decision: **IMPLEMENT DATA ROOMS IN CORE-API**

### Rationale:
1. ✅ **Frontend expects core-api endpoints** - All frontend code references `/api/v1/data-rooms`
2. ✅ **No separate service exists** - Would require new service creation (overkill)
3. ✅ **Fits core-api scope** - Data rooms are related to releases/assets
4. ✅ **Consistent with existing patterns** - Similar to how releases handle file uploads
5. ✅ **Faster to implement** - Can leverage existing file upload patterns from releases

### Implementation Approach:
1. **Add DataRoom model to Prisma schema** - Need to create migration
2. **Create DataRoomsController** - REST endpoints in `core-api`
3. **Create DataRoomsService** - Business logic layer
4. **Integrate with IPFS service** - For document storage (similar to releases)
5. **Link to Releases/Assets** - Data rooms can be linked to releases/assets

---

## Next Steps:

**Task 1.3:** Create DataRoomsController and supporting infrastructure in core-api

**Estimated Time:** 1-2 days
- Prisma schema + migration: 2-3 hours
- Service layer: 4-6 hours
- Controller + DTOs: 3-4 hours
- File upload integration: 2-3 hours
- Testing/refinement: 2-3 hours

---

## Notes:
- Data rooms appear to be a **frontend-only feature** currently (mock data only)
- No backend implementation exists yet
- Frontend is ready and waiting for backend endpoints
- Can follow `ReleasesController` patterns for file uploads and structure

---

**Decision Made By:** Task 1.2 Investigation  
**Approved For:** Task 1.3 Implementation
