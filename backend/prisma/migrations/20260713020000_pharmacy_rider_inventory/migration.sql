CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "users" ADD COLUMN "applicationStatus" TEXT;
ALTER TABLE "users" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE pharmacies DROP COLUMN IF EXISTS latitude;
ALTER TABLE pharmacies DROP COLUMN IF EXISTS longitude;
ALTER TABLE pharmacies ADD COLUMN location geography(Point,4326);
CREATE INDEX pharmacies_location_idx ON pharmacies USING GIST (location);
ALTER TABLE products ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE rider_kyc (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "aadharNumber" TEXT NOT NULL,
  "aadharImagePath" TEXT NOT NULL,
  "panNumber" TEXT NOT NULL,
  "panImagePath" TEXT NOT NULL,
  "drivingLicenseNumber" TEXT NOT NULL,
  "dlImagePath" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL,
  "vehicleNumber" TEXT NOT NULL,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
