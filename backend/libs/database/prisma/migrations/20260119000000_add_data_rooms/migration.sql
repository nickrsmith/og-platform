-- Add Data Room models for managing data room functionality
-- Data rooms are associated with users/organizations and can be linked to assets/releases

-- Create enums
CREATE TYPE "DataRoomStatus" AS ENUM ('INCOMPLETE', 'COMPLETE', 'PENDING_REVIEW');
CREATE TYPE "DataRoomAccess" AS ENUM ('PUBLIC', 'RESTRICTED');
CREATE TYPE "DataRoomTier" AS ENUM ('SIMPLE', 'STANDARD', 'PREMIUM');

-- Create data_rooms table
CREATE TABLE "data_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "organization_id" UUID,
    "asset_id" TEXT,
    "release_id" TEXT,
    "status" "DataRoomStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "access" "DataRoomAccess" NOT NULL DEFAULT 'RESTRICTED',
    "tier" "DataRoomTier" NOT NULL DEFAULT 'SIMPLE',
    "document_count" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_rooms_pkey" PRIMARY KEY ("id")
);

-- Create data_room_documents table
CREATE TABLE "data_room_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data_room_id" UUID NOT NULL,
    "folder_id" UUID,
    "name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size" BIGINT NOT NULL,
    "ipfs_cid" TEXT,
    "ipfs_url" TEXT,
    "storage_path" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_room_documents_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "data_rooms" ADD CONSTRAINT "data_rooms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_rooms" ADD CONSTRAINT "data_rooms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "data_room_documents" ADD CONSTRAINT "data_room_documents_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_room_documents" ADD CONSTRAINT "data_room_documents_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "data_room_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "data_rooms_user_id_idx" ON "data_rooms"("user_id");
CREATE INDEX "data_rooms_organization_id_idx" ON "data_rooms"("organization_id");
CREATE INDEX "data_rooms_asset_id_idx" ON "data_rooms"("asset_id");
CREATE INDEX "data_rooms_release_id_idx" ON "data_rooms"("release_id");
CREATE INDEX "data_rooms_status_idx" ON "data_rooms"("status");
CREATE INDEX "data_rooms_created_at_idx" ON "data_rooms"("created_at");
CREATE INDEX "data_room_documents_data_room_id_idx" ON "data_room_documents"("data_room_id");
CREATE INDEX "data_room_documents_folder_id_idx" ON "data_room_documents"("folder_id");
CREATE INDEX "data_room_documents_created_at_idx" ON "data_room_documents"("created_at");
