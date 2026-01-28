-- CreateTable
CREATE TABLE "public"."organization_follows" (
    "follower_org_id" UUID NOT NULL,
    "following_org_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_follows_pkey" PRIMARY KEY ("follower_org_id","following_org_id")
);

-- AddForeignKey
ALTER TABLE "public"."organization_follows" ADD CONSTRAINT "organization_follows_follower_org_id_fkey" FOREIGN KEY ("follower_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_follows" ADD CONSTRAINT "organization_follows_following_org_id_fkey" FOREIGN KEY ("following_org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
