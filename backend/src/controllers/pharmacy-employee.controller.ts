import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

const employmentTypes = ["full_time", "part_time", "contract"] as const;
const employeeStatuses = ["active", "on_leave", "inactive"] as const;

function bad(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 400;
  throw error;
}

function body(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    bad("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(input: Record<string, unknown>, key: string, min = 1, max = 120) {
  const value = input[key];
  if (typeof value !== "string") bad(`${key} is invalid.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max)
    bad(`${key} is invalid.`);
  return normalized;
}

function optionalEmail(input: Record<string, unknown>) {
  const raw = input.email;
  if (raw === undefined || raw === null || raw === "") return null;
  if (
    typeof raw !== "string" ||
    raw.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())
  )
    bad("email is invalid.");
  return raw.trim().toLowerCase();
}

function phone(input: Record<string, unknown>) {
  const value = text(input, "phone", 10, 10);
  if (!/^[6-9]\d{9}$/.test(value))
    bad("phone must be a valid 10-digit Indian mobile number.");
  return value;
}

function salary(input: Record<string, unknown>) {
  const value = Number(input.monthlySalary);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000)
    bad("monthlySalary is invalid.");
  return value;
}

function joiningDate(input: Record<string, unknown>) {
  const raw = text(input, "joiningDate", 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) bad("joiningDate is invalid.");
  const value = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(value.getTime())) bad("joiningDate is invalid.");
  return value;
}

function choice<T extends string>(
  input: Record<string, unknown>,
  key: string,
  values: readonly T[],
) {
  const value = text(input, key);
  if (!values.includes(value as T)) bad(`${key} is invalid.`);
  return value as T;
}

async function pharmacyIdForVendor(vendorUserId: string) {
  const pharmacy = await prisma.pharmacy.findFirst({
    where: { vendorUserId },
    select: { id: true },
  });
  if (!pharmacy) {
    const error = new Error(
      "No pharmacy is linked to this vendor account.",
    ) as Error & { status: number };
    error.status = 404;
    throw error;
  }
  return pharmacy.id;
}

const payload = (employee: {
  id: string;
  employeeCode: string;
  name: string;
  phone: string;
  email: string | null;
  designation: string;
  employmentType: string;
  monthlySalary: number;
  joiningDate: Date;
  status: string;
  createdAt: Date;
}) => ({
  ...employee,
  joiningDate: employee.joiningDate.toISOString().slice(0, 10),
  createdAt: employee.createdAt.toISOString(),
});

export async function listPharmacyEmployees(req: Request, res: Response) {
  const pharmacyId = await pharmacyIdForVendor(req.user!.id);
  const items = await prisma.pharmacyEmployee.findMany({
    where: { pharmacyId },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  res.json({ items: items.map(payload) });
}

export async function createPharmacyEmployee(req: Request, res: Response) {
  const pharmacyId = await pharmacyIdForVendor(req.user!.id);
  const input = body(req.body);
  const item = await prisma.pharmacyEmployee.create({
    data: {
      pharmacyId,
      employeeCode: `PHE-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
      name: text(input, "name", 2, 100),
      phone: phone(input),
      email: optionalEmail(input),
      designation: text(input, "designation", 2, 100),
      employmentType: choice(input, "employmentType", employmentTypes),
      monthlySalary: salary(input),
      joiningDate: joiningDate(input),
    },
  });
  res.status(201).json(payload(item));
}

export async function updatePharmacyEmployee(req: Request, res: Response) {
  const pharmacyId = await pharmacyIdForVendor(req.user!.id);
  const id = String(req.params.id);
  const existing = await prisma.pharmacyEmployee.findFirst({
    where: { id, pharmacyId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Pharmacy employee not found." });
    return;
  }

  const input = body(req.body);
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = text(input, "name", 2, 100);
  if (input.phone !== undefined) data.phone = phone(input);
  if (input.email !== undefined) data.email = optionalEmail(input);
  if (input.designation !== undefined)
    data.designation = text(input, "designation", 2, 100);
  if (input.employmentType !== undefined)
    data.employmentType = choice(input, "employmentType", employmentTypes);
  if (input.monthlySalary !== undefined) data.monthlySalary = salary(input);
  if (input.joiningDate !== undefined) data.joiningDate = joiningDate(input);
  if (input.status !== undefined)
    data.status = choice(input, "status", employeeStatuses);
  if (!Object.keys(data).length) bad("No employee fields supplied.");

  const updated = await prisma.pharmacyEmployee.update({
    where: { id },
    data,
  });
  res.json(payload(updated));
}
