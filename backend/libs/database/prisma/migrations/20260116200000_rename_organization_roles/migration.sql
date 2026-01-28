-- Rename OrganizationRole enum values
-- PostgreSQL doesn't support direct enum value renaming, so we need to:
-- 1. Update existing records first
-- 2. Convert enum columns to text temporarily
-- 3. Drop and recreate the enum type
-- 4. Convert columns back to enum type

-- Step 1: Drop default values before converting columns
ALTER TABLE "organization_members" 
ALTER COLUMN "role" DROP DEFAULT;

-- Step 2: Convert enum columns to text temporarily (need to do this first)
ALTER TABLE "organization_members" 
ALTER COLUMN "role" TYPE text USING "role"::text;

ALTER TABLE "organization_invitations" 
ALTER COLUMN "role" TYPE text USING "role"::text;

-- Step 3: Update existing records (now columns are text)
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

-- Step 4: Drop the old enum type
DROP TYPE "OrganizationRole";

-- Step 5: Create new enum type with updated values
CREATE TYPE "OrganizationRole" AS ENUM ('Principal', 'Manager', 'AssetManager', 'Compliance');

-- Step 6: Convert columns back to enum type (columns are already text, so we can cast directly)
ALTER TABLE "organization_members" 
ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";

ALTER TABLE "organization_invitations" 
ALTER COLUMN "role" TYPE "OrganizationRole" USING "role"::"OrganizationRole";

-- Step 7: Set default value (updated from Creator to AssetManager)
ALTER TABLE "organization_members" 
ALTER COLUMN "role" SET DEFAULT 'AssetManager';
