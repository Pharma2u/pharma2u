// Implements admin pharmacy onboarding and vendor pharmacy retrieval.
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { generateTempPassword } from "../utils/generateTempPassword";
import {
  validatePharmacyCreate,
  validatePharmacyUpdate,
} from "../validators/pharmacy.validator";

const page = (q: unknown) => Math.max(1, Number(q) || 1),
  limit = (q: unknown) => Math.min(100, Math.max(1, Number(q) || 20));

export async function createPharmacy(req: Request, res: Response) {
  const input = validatePharmacyCreate(req.body);

  if (
    await prisma.user.findUnique({
      where: { phone: input.vendorPhone },
      select: { id: true },
    })
  ) {
    res.status(409).json({ error: "A user with this phone already exists." });
    return;
  }

  const temporaryPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const pharmacy = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const vendor = await tx.user.create({
        data: {
          name: input.vendorName,
          phone: input.vendorPhone,
          role: "vendor",
          passwordHash,
          mustChangePassword: true,
        },
      });
      const created = await tx.pharmacy.create({
        data: {
          vendorUserId: vendor.id,
          name: input.name,
          address: input.address,
          drugLicenseNumber: input.drugLicenseNumber,
          pharmacistName: input.pharmacistName,
          pharmacistLicenseNumber: input.pharmacistLicenseNumber,
        },
      });
      await tx.$executeRaw(
        Prisma.sql`UPDATE pharmacies SET location = ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}),4326) WHERE id = ${created.id}`,
      );
      return created;
    },
  );
  res.status(201).json({
    pharmacyId: pharmacy.id,
    vendorPhone: input.vendorPhone,
    temporaryPassword,
  });
}

export async function listPharmacies(req: Request, res: Response) {
  const take = limit(req.query.limit),
    skip = (page(req.query.page) - 1) * take;
  const [items, total] = await prisma.$transaction([
    prisma.pharmacy.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { vendor: { select: { name: true, phone: true } } },
    }),
    prisma.pharmacy.count(),
  ]);
  res.json({ items, total, page: page(req.query.page), limit: take });
}

export async function updatePharmacy(req: Request, res: Response) {
  const input = validatePharmacyUpdate(req.body),
    id = String(req.params.id);
  const { lat, lng, ...data } = input as Record<string, unknown>;
  const found = await prisma.pharmacy.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!found) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (Object.keys(data).length)
      await tx.pharmacy.update({ where: { id }, data });
    if (lat !== undefined)
      await tx.$executeRaw(
        Prisma.sql`UPDATE pharmacies SET location = ST_SetSRID(ST_MakePoint(${lng as number}, ${lat as number}),4326) WHERE id = ${id}`,
      );
  });
  res.json(
    await prisma.pharmacy.findUnique({
      where: { id },
      include: { vendor: { select: { name: true, phone: true } } },
    }),
  );
}

export async function myPharmacy(req: Request, res: Response) {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { vendorUserId: req.user!.id },
  });
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }
  res.json(pharmacy);
}
