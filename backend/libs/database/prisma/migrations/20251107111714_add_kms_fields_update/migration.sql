-- Remove KMS region column and index from wallets table

ALTER TABLE "public"."wallets" DROP COLUMN IF EXISTS "kms_region";
DROP INDEX IF EXISTS "wallets_kms_key_id_idx";
