CREATE TABLE "company_profiles" (
  "id" TEXT NOT NULL DEFAULT 'default', "name" TEXT NOT NULL, "legalName" TEXT NOT NULL,
  "phone" TEXT NOT NULL, "email" TEXT NOT NULL, "address" TEXT NOT NULL,
  "city" TEXT NOT NULL, "state" TEXT NOT NULL, "pincode" TEXT NOT NULL,
  "gstin" TEXT NOT NULL, "registrationNumber" TEXT NOT NULL, "logoDataUrl" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ledger_entries" (
  "id" TEXT NOT NULL, "reference" TEXT NOT NULL, "description" TEXT NOT NULL,
  "division" TEXT NOT NULL, "type" TEXT NOT NULL, "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending', "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "admin_announcements" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
  "audience" TEXT NOT NULL, "publishedBy" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_announcements_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "employees" (
  "id" TEXT NOT NULL, "employeeCode" TEXT NOT NULL, "name" TEXT NOT NULL,
  "jobRole" TEXT NOT NULL, "department" TEXT NOT NULL, "monthlySalary" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "support_tickets" (
  "id" TEXT NOT NULL, "ticketCode" TEXT NOT NULL, "subject" TEXT NOT NULL,
  "requester" TEXT NOT NULL, "category" TEXT NOT NULL, "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'open', "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "pharmacy_subscriptions" (
  "id" TEXT NOT NULL, "pharmacyId" TEXT NOT NULL, "plan" TEXT NOT NULL DEFAULT 'Unconfigured',
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0, "nextBilling" TIMESTAMP(3),
  "autopay" BOOLEAN NOT NULL DEFAULT false, "status" TEXT NOT NULL DEFAULT 'attention',
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "pharmacy_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ledger_entries_reference_key" ON "ledger_entries"("reference");
CREATE INDEX "ledger_entries_division_entryDate_idx" ON "ledger_entries"("division", "entryDate");
CREATE INDEX "admin_announcements_publishedAt_idx" ON "admin_announcements"("publishedAt");
CREATE UNIQUE INDEX "employees_employeeCode_key" ON "employees"("employeeCode");
CREATE INDEX "employees_department_status_idx" ON "employees"("department", "status");
CREATE UNIQUE INDEX "support_tickets_ticketCode_key" ON "support_tickets"("ticketCode");
CREATE INDEX "support_tickets_status_priority_idx" ON "support_tickets"("status", "priority");
CREATE UNIQUE INDEX "pharmacy_subscriptions_pharmacyId_key" ON "pharmacy_subscriptions"("pharmacyId");
