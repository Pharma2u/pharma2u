// Handles rider application submission and protected admin review actions.
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { saveLiveRiderLocation } from "../services/rider-location.service";
import { publishRiderLocation } from "../realtime";
import { generateTempPassword } from "../utils/generateTempPassword";
import {
  deleteUploadedFiles,
  signedDocumentUrl,
  uploadPrivateDocument,
} from "../utils/uploadthing";
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

  // Do not keep a database transaction open during three network uploads. If one
  // upload fails, remove any documents that had already reached UploadThing.
  const uploadResults = await Promise.allSettled([
    uploadPrivateDocument(docs.aadhar, "aadhar"),
    uploadPrivateDocument(docs.pan, "pan"),
    uploadPrivateDocument(docs.dl, "driving-license"),
  ]);
  const uploadedKeys = uploadResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const failedUpload = uploadResults.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failedUpload) {
    await deleteUploadedFiles(uploadedKeys, "rider KYC documents");
    throw failedUpload.reason;
  }
  const [aadharKey, panKey, dlKey] = uploadedKeys as [string, string, string];

  try {
    const user = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
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
  } catch (error) {
    // The user and riderKyc records are transactional; UploadThing is not.
    await deleteUploadedFiles(uploadedKeys, "rider KYC documents");
    if ((error as { code?: string }).code === "P2002") {
      res.status(409).json({ error: "A user with this phone already exists." });
      return;
    }
    throw error;
  }
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

export async function fleet(req: Request, res: Response) {
  const riders = await prisma.user.findMany({
    where: { role: "rider", applicationStatus: "approved" },
    select: {
      id: true,
      name: true,
      phone: true,
      riderKyc: { select: { vehicleType: true, vehicleNumber: true } },
      riderLocation: {
        select: { lat: true, lng: true, isOnline: true, updatedAt: true },
      },
      ordersAsRider: {
        where: {
          status: {
            in: ["rider_assigned", "picked_up", "relay_pending", "on_the_way"],
          },
        },
        select: {
          id: true,
          orderCode: true,
          status: true,
          pharmacy: { select: { name: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const locationFreshAfter = Date.now() - 90_000;
  res.json({
    items: riders.map((rider) => ({
      ...rider,
      availability:
        rider.riderLocation?.isOnline &&
        rider.riderLocation.updatedAt.getTime() >= locationFreshAfter
          ? "online"
          : "offline",
    })),
  });
}

export async function updateMyLocation(req: Request, res: Response) {
  const input = req.body as {
    lat?: unknown;
    lng?: unknown;
    isOnline?: unknown;
    recordedAt?: unknown;
  };
  const lat = Number(input?.lat);
  const lng = Number(input?.lng);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    res
      .status(400)
      .json({ error: "Valid lat and lng coordinates are required." });
    return;
  }
  if (input.isOnline !== undefined && typeof input.isOnline !== "boolean") {
    res.status(400).json({ error: "isOnline must be a boolean." });
    return;
  }
  const recordedAt =
    input.recordedAt === undefined ? Date.now() : Number(input.recordedAt);
  if (
    !Number.isSafeInteger(recordedAt) ||
    recordedAt > Date.now() + 60_000 ||
    recordedAt < Date.now() - 5 * 60_000
  ) {
    res.status(400).json({
      error: "recordedAt must be a recent Unix timestamp in milliseconds.",
    });
    return;
  }
  try {
    const result = await saveLiveRiderLocation({
      riderId: req.user!.id,
      lat,
      lng,
      isOnline: input.isOnline !== false,
      recordedAt,
    });
    if (!result.accepted && result.reason === "rate_limited") {
      res.status(429).json(result);
      return;
    }
    if (result.accepted) publishRiderLocation(result.location);
    res.json(result);
  } catch (error) {
    console.error("Unable to save live rider location:", error);
    res
      .status(503)
      .json({ error: "Live location service is temporarily unavailable." });
  }
}
