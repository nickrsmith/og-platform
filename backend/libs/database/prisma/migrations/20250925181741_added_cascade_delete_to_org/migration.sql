-- DropForeignKey
ALTER TABLE "public"."organizations" DROP CONSTRAINT "organizations_principal_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."organizations" ADD CONSTRAINT "organizations_principal_user_id_fkey" FOREIGN KEY ("principal_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
