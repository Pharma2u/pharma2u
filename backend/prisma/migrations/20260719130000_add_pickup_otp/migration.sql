ALTER TABLE "orders"
ADD COLUMN "pickupOtp" TEXT,
ADD COLUMN "pickupOtpIssuedAt" TIMESTAMP(3),
ADD COLUMN "pickupOtpVerifiedAt" TIMESTAMP(3);
