// Handles rider application submission and protected admin review actions.
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { generateTempPassword } from "../utils/generateTempPassword";
import { signedDocumentUrl, uploadPrivateDocument } from "../utils/uploadthing";
import {
  validateRejection,
  validateRiderApplication,
} from "../validators/rider.validator";
type Uploaded = Express.Multer.File;

function files(req: Request) {
  const f = req.files as Record<string, Uploaded[]> | undefined;
  const required = ["aadharImage", "panImage", "dlImage"] as const;
  if (!f || required.some((k) => !f[k]?.[0]))
    throw Object.assign(new Error("All KYC images are required."), {
      status: 400,
    });
  return {
    aadhar: f.aadharImage![0]!,
    pan: f.panImage![0]!,
    dl: f.dlImage![0]!,
  };
}

export async function apply(req: Request, res: Response) {
  const input = validateRiderApplication(req.body);
  const docs = files(req);
  if (
    await prisma.user.findUnique({
      where: { phone: input.phone },
      select: { id: true },
    })
  ) {
    res.status(409).json({ error: "A user with this phone already exists." });
    return;
  }
  const user = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Placeholder satisfies the non-null schema; explicit login status checks are the access control.
      const passwordHash = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        12,
      );
      const rider = await tx.user.create({
        data: {
          name: input.name,
          phone: input.phone,
          role: "rider",
          passwordHash,
          applicationStatus: "pending",
        },
      });
      const [aadharKey, panKey, dlKey] = await Promise.all([
        uploadPrivateDocument(docs.aadhar, "aadhar"),
        uploadPrivateDocument(docs.pan, "pan"),
        uploadPrivateDocument(docs.dl, "driving-license"),
      ]);
      await tx.riderKyc.create({
        data: {
          userId: rider.id,
          aadharNumber: input.aadharNumber,
          aadharImagePath: aadharKey,
          panNumber: input.panNumber,
          panImagePath: panKey,
          drivingLicenseNumber: input.drivingLicenseNumber,
          dlImagePath: dlKey,
          vehicleType: input.vehicleType,
          vehicleNumber: input.vehicleNumber,
        },
      });
      return rider;
    },
  );
  res.status(201).json({
    applicationId: user.id,
    status: "pending",
    message: "Application submitted, awaiting review",
  });
}

export async function pending(req: Request, res: Response) {
  const riders = await prisma.user.findMany({
    where: { role: "rider", applicationStatus: "pending" },
    include: { riderKyc: true },
    orderBy: { createdAt: "asc" },
  });
  const items = await Promise.all(
    riders.map(
      async (rider: {
        id: string;
        name: string;
        phone: string;
        applicationStatus: string | null;
        riderKyc: {
          aadharNumber: string;
          aadharImagePath: string;
          panNumber: string;
          panImagePath: string;
          drivingLicenseNumber: string;
          dlImagePath: string;
          vehicleType: string;
          vehicleNumber: string;
          submittedAt: Date;
        } | null;
      }) => {
        const kyc = rider.riderKyc;
        if (!kyc)
          return {
            id: rider.id,
            name: rider.name,
            phone: rider.phone,
            kyc: null,
          };
        const [aadharImageUrl, panImageUrl, dlImageUrl] = await Promise.all([
          signedDocumentUrl(kyc.aadharImagePath),
          signedDocumentUrl(kyc.panImagePath),
          signedDocumentUrl(kyc.dlImagePath),
        ]);
        return {
          id: rider.id,
          name: rider.name,
          phone: rider.phone,
          applicationStatus: rider.applicationStatus,
          kyc: {
            aadharNumber: kyc.aadharNumber,
            panNumber: kyc.panNumber,
            drivingLicenseNumber: kyc.drivingLicenseNumber,
            vehicleType: kyc.vehicleType,
            vehicleNumber: kyc.vehicleNumber,
            submittedAt: kyc.submittedAt,
            aadharImageUrl,
            panImageUrl,
            dlImageUrl,
          },
        };
      },
    ),
  );
  res.json({ items });
}

export async function approve(req: Request, res: Response) {
  const target = await prisma.user.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, phone: true, role: true, applicationStatus: true },
  });
  if (
    !target ||
    target.role !== "rider" ||
    target.applicationStatus !== "pending"
  ) {
    res.status(400).json({ error: "Rider application is not pending." });
    return;
  }
  const temporaryPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: target.id },
    data: {
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      mustChangePassword: true,
      applicationStatus: "approved",
      rejectionReason: null,
    },
  });
  res.json({ id: target.id, phone: target.phone, temporaryPassword });
}

export async function reject(req: Request, res: Response) {
  const reason = validateRejection(req.body),
    target = await prisma.user.findUnique({
      where: { id: String(req.params.id) },
      select: { role: true, applicationStatus: true },
    });
  if (
    !target ||
    target.role !== "rider" ||
    target.applicationStatus !== "pending"
  ) {
    res.status(400).json({ error: "Rider application is not pending." });
    return;
  }
  await prisma.user.update({
    where: { id: String(req.params.id) },
    data: { applicationStatus: "rejected", rejectionReason: reason },
  });
  res.json({ id: req.params.id, status: "rejected" });
}

export async function updateMyLocation(req: Request, res: Response) {
  const input = req.body as { lat?: unknown; lng?: unknown; isOnline?: unknown };
  const lat = Number(input?.lat);
  const lng = Number(input?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    res.status(400).json({ error: "Valid lat and lng coordinates are required." });
    return;
  }
  const location = await prisma.riderLocation.upsert({
    where: { riderId: req.user!.id },
    create: { riderId: req.user!.id, lat, lng, isOnline: input.isOnline !== false },
    update: { lat, lng, isOnline: input.isOnline !== false },
  });
  res.json(location);
}