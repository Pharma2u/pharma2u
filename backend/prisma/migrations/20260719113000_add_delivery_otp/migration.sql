ALTER TABLE "orders"
ADD COLUMN "deliveryOtp" TEXT,
ADD COLUMN "deliveryOtpIssuedAt" TIMESTAMP(3),
ADD COLUMN "deliveryOtpVerifiedAt" TIMESTAMP(3);
