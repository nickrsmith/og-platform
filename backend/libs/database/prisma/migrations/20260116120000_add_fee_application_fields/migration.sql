-- Add fee application mode fields to transactions table
-- These fields allow platform fees to be paid by buyer, seller, or split between both

ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "fee_application_mode" VARCHAR(50);
ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "buy_side_percentage" DECIMAL(7,2);
