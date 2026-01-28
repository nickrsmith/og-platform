-- Rename OrganizationRole enum values
-- PostgreSQL doesn't support direct enum value renaming, so we need to:
-- 1. Update existing records first
-- 2. Convert enum columns to text temporarily
-- 3. Drop and recreate the enum type
-- 4. Convert columns back to enum type

-- Step 1: Update existing records BEFORE changing enum type
UPDATE "organization_members" 
SET "role" = 'Manager'::text 
WHERE "role"::text = 'Admin';

UPDATE "organization_members" 
SET "role" = 'AssetManager'::text 
WHERE "role"::text = 'Creator';

UPDATE "organization_members" 
SET "role" = 'Compliance'::text 
WHERE "role"::text = 'Verifier';

-- Update invitations table
UPDATE "organization_invitations" 
SET "role" = 'Manager'::text 
WHERE "role"::text = 'Admin';

UPDATE "organization_invitations" 
SET "role" = 'AssetManager'::text 
WHERE "role"::text = 'Creator';

UPDATE "organization_invitations" 
SET "role" = 'Compliance'::text 
WHERE "role"::text = 'Verifier';

-- Step 2: Convert enum columns to text temporarily
ALTER TABLE "organization_members" 
ALTER COLUMN "role" TYPE text USING "role"::text;

ALTER TABLE "organization_invitations" 
ALTER COLUMN "role" TYPE text USING "role"::text;

-- Step 3: Drop the old enum type
DROP TYPE "OrganizationRole";

-- Step 4: Create new enum type with updated values
CREATE TYPE "OrganizationRole" AS ENUM ('Principal', 'Manager', 'AssetManager', 'Compliance');

-- Step 5: Convert columns back to enum type
ALTER TABLE "organization_members" 
ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";

ALTER TABLE "organization_invitations" 
ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";

-- Step 6: Set default value (updated from Creator to AssetManager)
ALTER TABLE "organization_members" 
ALTER COLUMN "role" SET DEFAULT 'AssetManager';
