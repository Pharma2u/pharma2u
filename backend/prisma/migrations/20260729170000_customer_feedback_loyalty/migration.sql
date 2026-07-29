ALTER TABLE "notification_logs" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "loyaltyPointsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "loyaltyDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "customer_feedback" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "pageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeUsed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "feedbackId" TEXT,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "rupeesPerPoint" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "minimumRedeemPoints" INTEGER NOT NULL DEFAULT 1,
    "defaultFeedbackReward" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loyalty_accounts_customerId_key" ON "loyalty_accounts"("customerId");
CREATE UNIQUE INDEX "loyalty_transactions_feedbackId_key" ON "loyalty_transactions"("feedbackId");
CREATE UNIQUE INDEX "loyalty_transactions_orderId_type_key" ON "loyalty_transactions"("orderId", "type");
CREATE INDEX "customer_feedback_status_createdAt_idx" ON "customer_feedback"("status", "createdAt");
CREATE INDEX "customer_feedback_customerId_createdAt_idx" ON "customer_feedback"("customerId", "createdAt");
CREATE INDEX "loyalty_transactions_customerId_createdAt_idx" ON "loyalty_transactions"("customerId", "createdAt");

ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "customer_feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
