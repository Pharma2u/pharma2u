ALTER TABLE "orders" ADD COLUMN "riderEarning" DOUBLE PRECISION NOT NULL DEFAULT 0;
UPDATE "orders" SET "riderEarning" = GREATEST(35, "deliveryFee") WHERE "status" = 'delivered';

ALTER TABLE "rider_kyc"
  ADD COLUMN "identityStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "licenceStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "logisticsStatus" TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN "identityReviewedAt" TIMESTAMP(3),
  ADD COLUMN "licenceReviewedAt" TIMESTAMP(3),
  ADD COLUMN "logisticsReviewedAt" TIMESTAMP(3);

CREATE TABLE "rider_ledger_entries" (
  "id" TEXT NOT NULL,
  "riderId" TEXT NOT NULL,
  "orderId" TEXT,
  "type" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "paymentMethod" "PaymentMethod",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rider_ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rider_ledger_entries_riderId_orderId_type_key" ON "rider_ledger_entries"("riderId", "orderId", "type");
CREATE INDEX "rider_ledger_entries_riderId_createdAt_idx" ON "rider_ledger_entries"("riderId", "createdAt");
ALTER TABLE "rider_ledger_entries" ADD CONSTRAINT "rider_ledger_entries_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rider_ledger_entries" ADD CONSTRAINT "rider_ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "rider_login_otps" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rider_login_otps_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "rider_login_otps_phone_createdAt_idx" ON "rider_login_otps"("phone", "createdAt");
