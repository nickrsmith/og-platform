-- Add Simplify E-Notary/E-Recording fields to transactions table
-- These fields store Simplify notary session and recording status information

ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "simplify_notary_session_id" VARCHAR(255);
ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "recording_status" VARCHAR(50);
ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "recording_file_number" VARCHAR(255);
ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "recording_book_page" VARCHAR(255);

-- Create index on simplify_notary_session_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_transactions_simplify_notary_session_id" ON "public"."transactions" ("simplify_notary_session_id");

-- Create index on recording_status for filtering
CREATE INDEX IF NOT EXISTS "idx_transactions_recording_status" ON "public"."transactions" ("recording_status");
