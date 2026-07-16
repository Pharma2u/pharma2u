CREATE TABLE "pharmacy_applications" (
  "id" TEXT NOT NULL,
  "ownerName" TEXT NOT NULL,
  "ownerPhone" TEXT NOT NULL,
  "pharmacyName" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "drugLicenseNumber" TEXT NOT NULL,
  "drugLicensePath" TEXT NOT NULL,
  "pharmacistName" TEXT NOT NULL,
  "pharmacistLicenseNumber" TEXT NOT NULL,
  "pharmacistLicensePath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "rejectionReason" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pharmacy_applications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pharmacy_applications_ownerPhone_key" ON "pharmacy_applications"("ownerPhone");
CREATE UNIQUE INDEX "pharmacy_applications_drugLicenseNumber_key" ON "pharmacy_applications"("drugLicenseNumber");
CREATE INDEX "pharmacy_applications_status_createdAt_idx" ON "pharmacy_applications"("status", "createdAt");