CREATE TABLE "vendor_profile_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_profile_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vendor_profile_types_name_key" ON "vendor_profile_types"("name");
CREATE UNIQUE INDEX "vendor_profile_types_code_key" ON "vendor_profile_types"("code");