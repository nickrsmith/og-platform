-- Add KMS key reference fields to wallets table
-- These fields store which KMS key was used to encrypt the wallet's DEK
-- Using IF NOT EXISTS to handle cases where columns might already exist from previous migration attempts

ALTER TABLE "public"."wallets" ADD COLUMN IF NOT EXISTS "kms_key_id" TEXT;
ALTER TABLE "public"."wallets" ADD COLUMN IF NOT EXISTS "kms_region" TEXT;

-- Add index on kms_key_id for efficient key usage tracking
CREATE INDEX IF NOT EXISTS "wallets_kms_key_id_idx" ON "public"."wallets"("kms_key_id");
