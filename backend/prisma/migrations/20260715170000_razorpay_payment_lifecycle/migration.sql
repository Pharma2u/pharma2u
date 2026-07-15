ALTER TABLE "payments"
ADD COLUMN "failureReason" TEXT;

ALTER TABLE "orders"
ALTER COLUMN "dropLat" DROP NOT NULL,
ALTER COLUMN "dropLng" DROP NOT NULL;

ALTER TABLE "refunds"
ADD COLUMN "errorReason" TEXT,
ADD COLUMN "rawPayload" JSONB,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_webhook_events_eventId_key"
ON "payment_webhook_events"("eventId");

CREATE INDEX "payment_webhook_events_provider_createdAt_idx"
ON "payment_webhook_events"("provider", "createdAt");
