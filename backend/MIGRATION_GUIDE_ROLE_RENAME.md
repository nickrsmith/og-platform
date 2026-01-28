# Migration Guide: Organization Roles Rename

## Prerequisites
- Database backup (recommended)
- Development database available for testing

## Steps to Create Migration

### Step 1: Generate Migration
```bash
cd backend
npx prisma migrate dev --name rename_organization_roles --create-only
```

This creates the migration file but doesn't apply it yet.

### Step 2: Edit Migration File
Edit the generated migration file at:
`backend/libs/database/prisma/migrations/YYYYMMDDHHMMSS_rename_organization_roles/migration.sql`

**Add UPDATE statements BEFORE the ALTER TYPE statements:**

```sql
-- Start transaction
BEGIN;

-- Update existing records BEFORE changing enum type
UPDATE "organization_members" 
SET "role" = 'Manager' 
WHERE "role" = 'Admin';

UPDATE "organization_members" 
SET "role" = 'AssetManager' 
WHERE "role" = 'Creator';

UPDATE "organization_members" 
SET "role" = 'Compliance' 
WHERE "role" = 'Verifier';

-- Update invitations table
UPDATE "organization_invitations" 
SET "role" = 'Manager' 
WHERE "role" = 'Admin';

UPDATE "organization_invitations" 
SET "role" = 'AssetManager' 
WHERE "role" = 'Creator';

UPDATE "organization_invitations" 
SET "role" = 'Compliance' 
WHERE "role" = 'Verifier';

-- Now update the enum type (Prisma will generate this)
-- ALTER TYPE "public"."OrganizationRole" RENAME VALUE 'Admin' TO 'Manager';
-- ALTER TYPE "public"."OrganizationRole" RENAME VALUE 'Creator' TO 'AssetManager';
-- ALTER TYPE "public"."OrganizationRole" RENAME VALUE 'Verifier' TO 'Compliance';

-- Actually, PostgreSQL requires dropping and recreating enum, or:
-- We need to handle this differently. Let me check Prisma's generated migration.

-- End transaction
COMMIT;
```

**Note:** Prisma may generate a different approach. Check the generated migration and adjust accordingly.

### Step 3: Apply Migration
```bash
npx prisma migrate dev
```

### Step 4: Verify Migration
```sql
-- Check enum values
SELECT unnest(enum_range(NULL::"OrganizationRole"));

-- Check updated records
SELECT role, COUNT(*) 
FROM "organization_members" 
GROUP BY role;

SELECT role, COUNT(*) 
FROM "organization_invitations" 
GROUP BY role;
```

---

## Alternative: Manual Migration (if Prisma migration fails)

If Prisma has issues with enum updates, you can manually create the migration:

```sql
BEGIN;

-- Step 1: Update existing records (convert to new values)
UPDATE "organization_members" 
SET "role" = 'Manager'::text 
WHERE "role"::text = 'Admin';

UPDATE "organization_members" 
SET "role" = 'AssetManager'::text 
WHERE "role"::text = 'Creator';

UPDATE "organization_members" 
SET "role" = 'Compliance'::text 
WHERE "role"::text = 'Verifier';

UPDATE "organization_invitations" 
SET "role" = 'Manager'::text 
WHERE "role"::text = 'Admin';

UPDATE "organization_invitations" 
SET "role" = 'AssetManager'::text 
WHERE "role"::text = 'Creator';

UPDATE "organization_invitations" 
SET "role" = 'Compliance'::text 
WHERE "role"::text = 'Verifier';

-- Step 2: Drop and recreate enum type
ALTER TABLE "organization_members" ALTER COLUMN "role" TYPE text;
ALTER TABLE "organization_invitations" ALTER COLUMN "role" TYPE text;

DROP TYPE "OrganizationRole";

CREATE TYPE "OrganizationRole" AS ENUM ('Principal', 'Manager', 'AssetManager', 'Compliance');

ALTER TABLE "organization_members" ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";
ALTER TABLE "organization_invitations" ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";

COMMIT;
```

---

## Testing After Migration

1. **Verify enum values:**
   ```sql
   SELECT unnest(enum_range(NULL::"OrganizationRole"));
   ```

2. **Check data integrity:**
   ```sql
   SELECT DISTINCT role FROM "organization_members";
   SELECT DISTINCT role FROM "organization_invitations";
   ```

3. **Run backend tests:**
   ```bash
   cd backend
   npm test
   ```

---

## Rollback Plan

If migration fails:

```sql
BEGIN;

-- Revert records (if needed)
UPDATE "organization_members" 
SET "role" = 'Admin'::text 
WHERE "role"::text = 'Manager';

UPDATE "organization_members" 
SET "role" = 'Creator'::text 
WHERE "role"::text = 'AssetManager';

UPDATE "organization_members" 
SET "role" = 'Verifier'::text 
WHERE "role"::text = 'Compliance';

-- Restore enum type
-- ... (reverse the enum changes)

COMMIT;
```

---

## Notes

- **Test on development database first**
- **Backup production database before migration**
- **Prisma migration should handle enum changes automatically, but may need manual UPDATE statements for existing records**
