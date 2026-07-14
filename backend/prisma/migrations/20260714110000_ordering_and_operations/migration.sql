-- CreateEnum
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('upi', 'card', 'cod'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "RelayStatus" AS ENUM ('pending', 'handoff_done', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "RefundStatus" AS ENUM ('pending', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DropIndex
DROP INDEX IF EXISTS "pharmacies_vendorUserId_key";

-- AlterTable
ALTER TABLE "pharmacies" ADD COLUMN IF NOT EXISTS     "bannerPath" TEXT,
ADD COLUMN IF NOT EXISTS     "closingTime" TEXT,
ADD COLUMN IF NOT EXISTS     "logoPath" TEXT,
ADD COLUMN IF NOT EXISTS     "openingTime" TEXT,
ADD COLUMN IF NOT EXISTS     "operatingDays" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS     "batchNumber" TEXT,
ADD COLUMN IF NOT EXISTS     "deliveryTime" INTEGER,
ADD COLUMN IF NOT EXISTS     "description" TEXT,
ADD COLUMN IF NOT EXISTS     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS     "expiryDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "manufacturer" TEXT,
ADD COLUMN IF NOT EXISTS     "mrp" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS     "packSize" TEXT,
ADD COLUMN IF NOT EXISTS     "saltComposition" TEXT,
ADD COLUMN IF NOT EXISTS     "storageInstructions" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS     "cancelledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "deliveredAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "deliveryInstructions" TEXT,
ADD COLUMN IF NOT EXISTS     "estimatedDeliveryTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cod';
ALTER TABLE "orders" ALTER COLUMN "relayStatus" TYPE "RelayStatus" USING CASE
  WHEN "relayStatus" IS NULL THEN NULL
  WHEN "relayStatus"::text IN ('pending', 'handoff_done', 'failed') THEN "relayStatus"::text::"RelayStatus"
  ELSE NULL
END;

-- AlterTable
ALTER TABLE "rider_locations" ADD COLUMN IF NOT EXISTS     "isOnline" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "rider_kyc" ADD COLUMN IF NOT EXISTS     "reviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "reviewedBy" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customer_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "flatOrHouse" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "percentOff" DOUBLE PRECISION,
    "amountOff" DOUBLE PRECISION,
    "minimumOrder" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'pending',
    "providerRef" TEXT,
    "reason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "rawPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prescriptions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_images_productId_sortOrder_idx" ON "product_images"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_images_productId_path_key" ON "product_images"("productId", "path");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_addresses_customerId_idx" ON "customer_addresses"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_reviews_productId_idx" ON "product_reviews"("productId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_productId_customerId_key" ON "product_reviews"("productId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notification_logs_userId_createdAt_idx" ON "notification_logs"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refunds_orderId_key" ON "refunds"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_providerOrderId_key" ON "payments"("providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_providerPaymentId_key" ON "payments"("providerPaymentId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prescriptions_customerId_createdAt_idx" ON "prescriptions"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pharmacies_vendorUserId_idx" ON "pharmacies"("vendorUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_riderId_idx" ON "orders"("riderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_pharmacyId_status_idx" ON "orders"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "stock_reservations_productId_status_expiresAt_idx" ON "stock_reservations"("productId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

