/*
  Warnings:

  - A unique constraint covering the columns `[peer_id]` on the table `p2p_identities` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `peer_id` to the `p2p_identities` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."p2p_identities" ADD COLUMN     "peer_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "p2p_identities_peer_id_key" ON "public"."p2p_identities"("peer_id");
