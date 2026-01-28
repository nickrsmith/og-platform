-- Add Persona identity verification fields to users table
-- These fields store Persona verification status and session information

ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "persona_verified" BOOLEAN DEFAULT false;
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "kyc_status" VARCHAR(20);
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "persona_session_id" VARCHAR(255);

-- Create index on persona_session_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_users_persona_session_id" ON "public"."users" ("persona_session_id");
