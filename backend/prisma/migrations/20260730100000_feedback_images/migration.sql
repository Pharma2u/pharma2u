CREATE TABLE "feedback_images" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_images_feedbackId_sortOrder_idx" ON "feedback_images"("feedbackId", "sortOrder");

ALTER TABLE "feedback_images" ADD CONSTRAINT "feedback_images_feedbackId_fkey"
FOREIGN KEY ("feedbackId") REFERENCES "customer_feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
