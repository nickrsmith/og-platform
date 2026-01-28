/*
  Warnings:

  - You are about to drop the column `kms_key_ciphertext` on the `wallets` table. All the data in the column will be lost.
  - Added the required column `encrypted_dek` to the `wallets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."wallets" DROP COLUMN "kms_key_ciphertext",
ADD COLUMN     "encrypted_dek" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."p2p_identities" (
    "user_id" UUID NOT NULL,
    "public_key" TEXT NOT NULL,
    "encrypted_private_key" TEXT NOT NULL,
    "encrypted_dek" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "p2p_identities_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "p2p_identities_public_key_key" ON "public"."p2p_identities"("public_key");

-- AddForeignKey
ALTER TABLE "public"."p2p_identities" ADD CONSTRAINT "p2p_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
