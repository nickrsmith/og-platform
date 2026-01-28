-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "public"."OrganizationRole" AS ENUM ('Admin', 'Principal', 'Creator', 'Verifier');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_authentications" (
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_authentications_pkey" PRIMARY KEY ("provider","provider_user_id")
);

-- CreateTable
CREATE TABLE "public"."session_refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "site_address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principal_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_members" (
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "public"."OrganizationRole" NOT NULL DEFAULT 'Creator',
    "is_active_member" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("organization_id","user_id")
);

-- CreateTable
CREATE TABLE "public"."wallets" (
    "user_id" UUID NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "compressed_public_key" TEXT NOT NULL,
    "encrypted_seed" TEXT NOT NULL,
    "kms_key_ciphertext" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."blockchain_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "idempotency_key" TEXT,
    "job_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload_json" JSONB NOT NULL,
    "tx_hash" TEXT,
    "block_number" BIGINT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "blockchain_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_refresh_tokens_token_hash_key" ON "public"."session_refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_site_address_key" ON "public"."organizations"("site_address");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_wallet_address_key" ON "public"."wallets"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_compressed_public_key_key" ON "public"."wallets"("compressed_public_key");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_jobs_idempotency_key_key" ON "public"."blockchain_jobs"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_jobs_tx_hash_key" ON "public"."blockchain_jobs"("tx_hash");

-- CreateIndex
CREATE INDEX "blockchain_jobs_job_type_idx" ON "public"."blockchain_jobs"("job_type");

-- CreateIndex
CREATE INDEX "blockchain_jobs_status_idx" ON "public"."blockchain_jobs"("status");

-- AddForeignKey
ALTER TABLE "public"."user_authentications" ADD CONSTRAINT "user_authentications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_refresh_tokens" ADD CONSTRAINT "session_refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_principal_user_id_fkey" FOREIGN KEY ("principal_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
