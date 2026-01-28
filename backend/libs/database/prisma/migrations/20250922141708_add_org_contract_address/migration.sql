/*
  Warnings:

  - A unique constraint covering the columns `[contract_address]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."organizations" ADD COLUMN     "contract_address" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_contract_address_key" ON "public"."organizations"("contract_address");
