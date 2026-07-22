CREATE TABLE "homepage_banners" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "subtitle" TEXT, "imageUrl" TEXT, "linkUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "homepage_banners_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "homepage_banners_isActive_sortOrder_idx" ON "homepage_banners"("isActive", "sortOrder");
