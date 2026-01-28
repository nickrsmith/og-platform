/*
  Warnings:

  - You are about to drop the column `block_number` on the `blockchain_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `job_type` on the `blockchain_jobs` table. All the data in the column will be lost.
  - You are about to drop the column `tx_hash` on the `blockchain_jobs` table. All the data in the column will be lost.
  - The `status` column on the `blockchain_jobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `event_type` to the `blockchain_jobs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ChainEventType" AS ENUM ('DEPOSIT_FUNDS', 'WITHDRAW_FUNDS', 'TRANSFER_ASSET', 'VERIFY_ASSET', 'LICENSE_ASSET');

-- CreateEnum
CREATE TYPE "public"."BlockchainJobStatus" AS ENUM ('QUEQUED', 'SUBMITTED', 'SUCCESS', 'ERROR');

-- DropIndex
DROP INDEX "public"."blockchain_jobs_job_type_idx";

-- DropIndex
DROP INDEX "public"."blockchain_jobs_tx_hash_key";

-- AlterTable
ALTER TABLE "public"."blockchain_jobs" DROP COLUMN "block_number",
DROP COLUMN "job_type",
DROP COLUMN "tx_hash",
ADD COLUMN     "event_type" "public"."ChainEventType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."BlockchainJobStatus" NOT NULL DEFAULT 'QUEQUED';

-- CreateIndex
CREATE INDEX "blockchain_jobs_event_type_idx" ON "public"."blockchain_jobs"("event_type");

-- CreateIndex
CREATE INDEX "blockchain_jobs_status_idx" ON "public"."blockchain_jobs"("status");
