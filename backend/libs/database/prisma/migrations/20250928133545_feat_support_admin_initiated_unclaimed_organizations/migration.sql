-- CreateEnum
CREATE TYPE "public"."OrganizationStatus" AS ENUM ('UNCLAIMED', 'ACTIVE');

-- DropForeignKey
ALTER TABLE "public"."organizations" DROP CONSTRAINT "organizations_principal_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."organizations" ADD COLUMN     "status" "public"."OrganizationStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "site_address" DROP NOT NULL,
ALTER COLUMN "principal_user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_principal_user_id_fkey" FOREIGN KEY ("principal_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
