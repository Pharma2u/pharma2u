ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actingAdminId" TEXT NOT NULL,
    "createdUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_actingAdminId_idx" ON "admin_audit_logs"("actingAdminId");
CREATE INDEX "admin_audit_logs_createdUserId_idx" ON "admin_audit_logs"("createdUserId");