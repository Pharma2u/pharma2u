CREATE TABLE "pharmacy_employees" (
  "id" TEXT NOT NULL,
  "pharmacyId" TEXT NOT NULL,
  "employeeCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "designation" TEXT NOT NULL,
  "employmentType" TEXT NOT NULL DEFAULT 'full_time',
  "monthlySalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "joiningDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pharmacy_employees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pharmacy_employees_employeeCode_key"
  ON "pharmacy_employees"("employeeCode");
CREATE INDEX "pharmacy_employees_pharmacyId_status_idx"
  ON "pharmacy_employees"("pharmacyId", "status");
CREATE INDEX "pharmacy_employees_pharmacyId_name_idx"
  ON "pharmacy_employees"("pharmacyId", "name");

ALTER TABLE "pharmacy_employees"
  ADD CONSTRAINT "pharmacy_employees_pharmacyId_fkey"
  FOREIGN KEY ("pharmacyId") REFERENCES "pharmacies"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
