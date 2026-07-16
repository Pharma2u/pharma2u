import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { generateTempPassword } from "../utils/generateTempPassword";
import { signedDocumentUrl, uploadPrivateDocument } from "../utils/uploadthing";

const text = (body: Record<string, unknown>, key: string) => {
  const value = typeof body[key] === "string" ? body[key].trim() : "";
  if (!value)
    throw Object.assign(new Error(`${key} is required.`), { status: 400 });
  return value;
};


const body = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Object.assign(new Error("Invalid application."), { status: 400 });
  return value as Record<string, unknown>;
};

export async function applyForPharmacy(req: Request, res: Response) {
  const input = body(req.body);

  const phone = text(input, "ownerPhone");

  const lat = Number(input.lat),
    lng = Number(input.lng);

  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  
  if (
    !/^[6-9]\d{9}$/.test(phone) ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  )
    throw Object.assign(new Error("Invalid phone number or coordinates."), {
      status: 400,
    });

  const drug = files?.drugLicense?.[0],
    pharmacist = files?.pharmacistLicense?.[0];
  if (!drug || !pharmacist)
    throw Object.assign(
      new Error("Drug and pharmacist licence documents are required."),
      { status: 400 },
    );

  const drugLicenseNumber = text(input, "drugLicenseNumber");
  if (await prisma.user.findUnique({ where: { phone }, select: { id: true } }))
    return void res
      .status(409)
      .json({ error: "An account already uses this phone number." });

  const [drugLicensePath, pharmacistLicensePath] = await Promise.all([
    uploadPrivateDocument(drug, "drug-license"),
    uploadPrivateDocument(pharmacist, "pharmacist-license"),
  ]);

  const application = await prisma.pharmacyApplication.create({
    data: {
      ownerName: text(input, "ownerName"),
      ownerPhone: phone,
      pharmacyName: text(input, "pharmacyName"),
      address: text(input, "address"),
      lat,
      lng,
      drugLicenseNumber,
      drugLicensePath,
      pharmacistName: text(input, "pharmacistName"),
      pharmacistLicenseNumber: text(input, "pharmacistLicenseNumber"),
      pharmacistLicensePath,
    },
  });


  res.status(201).json({ id: application.id, status: application.status });
}

export async function pendingPharmacyApplications(
  _req: Request,
  res: Response,
) {
  const items = await prisma.pharmacyApplication.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });


  res.json({
    items: await Promise.all(
      items.map(
        async ({ drugLicensePath, pharmacistLicensePath, ...item }) => ({
          ...item,
          drugLicenseUrl: await signedDocumentUrl(drugLicensePath),
          pharmacistLicenseUrl: await signedDocumentUrl(pharmacistLicensePath),
        }),
      ),
    ),
  });

}

export async function approvePharmacyApplication(req: Request, res: Response) {
  const id = String(req.params.id);

  const application = await prisma.pharmacyApplication.findFirst({
    where: { id, status: "pending" },
  });

  if (!application)
    return void res
      .status(404)
      .json({ error: "Pending pharmacy application not found." });

  const temporaryPassword = generateTempPassword();

  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const pharmacy = await prisma.$transaction(async (tx) => {
    const vendor = await tx.user.create({
      data: {
        name: application.ownerName,
        phone: application.ownerPhone,
        role: "vendor",
        passwordHash,
        mustChangePassword: true,
        applicationStatus: "approved",
      },
    });

    const created = await tx.pharmacy.create({
      data: {
        vendorUserId: vendor.id,
        name: application.pharmacyName,
        address: application.address,
        drugLicenseNumber: application.drugLicenseNumber,
        pharmacistName: application.pharmacistName,
        pharmacistLicenseNumber: application.pharmacistLicenseNumber,
      },
    });

    await tx.$executeRaw(
      Prisma.sql`UPDATE pharmacies SET location = ST_SetSRID(ST_MakePoint(${application.lng}, ${application.lat}),4326) WHERE id = ${created.id}`,
    );

    await tx.pharmacyApplication.update({
      where: { id },
      data: {
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: req.user!.id,
      },
    });
    return created;
  });

  res.json({
    pharmacyId: pharmacy.id,
    ownerPhone: application.ownerPhone,
    temporaryPassword,
  });

}

export async function rejectPharmacyApplication(req: Request, res: Response) {
  const reason = text(body(req.body), "reason");

  const result = await prisma.pharmacyApplication.updateMany({
    where: { id: String(req.params.id), status: "pending" },
    data: {
      status: "rejected",
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: req.user!.id,
    },
  });

  if (!result.count)
    return void res
      .status(404)
      .json({ error: "Pending pharmacy application not found." });

  res.json({ status: "rejected" });
}
