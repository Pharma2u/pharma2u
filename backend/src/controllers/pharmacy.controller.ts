// Implements admin pharmacy onboarding and vendor pharmacy retrieval.
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { generateTempPassword } from "../utils/generateTempPassword";
import {
  validatePharmacyCreate,
  validatePharmacyUpdate,
  validateVendorPharmacyProfile,
} from "../validators/pharmacy.validator";
import {
  deleteUploadedFiles,
  pharmacyImageUrl,
  uploadPharmacyImage,
} from "../utils/uploadthing";

const publicImagePaths = <
  T extends { logoPath: string | null; bannerPath: string | null },
>(
  pharmacy: T,
) => ({
  ...pharmacy,
  logoPath: pharmacy.logoPath ? pharmacyImageUrl(pharmacy.logoPath) : null,
  bannerPath: pharmacy.bannerPath
    ? pharmacyImageUrl(pharmacy.bannerPath)
    : null,
});

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

export async function listPublicPharmacies(_req: Request, res: Response) {
  const items = await prisma.pharmacy.findMany({
    where: { isOpen: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      address: true,
      isOpen: true,
      logoPath: true,
      bannerPath: true,
      openingTime: true,
      closingTime: true,
      operatingDays: true,
      products: {
        where: {
          isActive: true,
          stock: { gt: 0 },
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
        select: { deliveryTime: true },
      },
    },
  });

  res.json({
    items: items.map(({ products, ...pharmacy }) => ({
      ...publicImagePaths(pharmacy),
      availableProducts: products.length,
      deliveryTime: products.reduce<number | null>(
        (minimum, product) =>
          product.deliveryTime === null
            ? minimum
            : minimum === null
              ? product.deliveryTime
              : Math.min(minimum, product.deliveryTime),
        null,
      ),
      distance: null,
    })),
  });
}

export async function listNearbyPharmacies(req: Request, res: Response) {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusKm = Math.min(50, Math.max(1, Number(req.query.radiusKm) || 10));

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    res.status(400).json({ error: "A valid latitude is required." });
    return;
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    res.status(400).json({ error: "A valid longitude is required." });
    return;
  }

  const items = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      address: string;
      isOpen: boolean;
      logoPath: string | null;
      bannerPath: string | null;
      openingTime: string | null;
      closingTime: string | null;
      operatingDays: string[];
      availableProducts: number;
      deliveryTime: number | null;
      distance: number;
    }>
  >(Prisma.sql`
    SELECT
      p.id,
      p.name,
      p.address,
      p."isOpen",
      p."logoPath",
      p."bannerPath",
      p."openingTime",
      p."closingTime",
      p."operatingDays",
      COUNT(pr.id)::int AS "availableProducts",
      MIN(pr."deliveryTime")::int AS "deliveryTime",
      ROUND((
        ST_Distance(
          p.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) / 1000
      )::numeric, 2)::float AS distance
    FROM pharmacies p
    LEFT JOIN products pr
      ON pr."pharmacyId" = p.id
      AND pr."isActive" = true
      AND pr.stock > 0
      AND (pr."expiryDate" IS NULL OR pr."expiryDate" > NOW())
    WHERE p."isOpen" = true
      AND p.location IS NOT NULL
      AND ST_DWithin(
        p.location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusKm * 1000}
      )
    GROUP BY p.id
    ORDER BY distance ASC, "deliveryTime" ASC NULLS LAST
  `);

  res.json({ items: items.map(publicImagePaths), radiusKm });
}

export async function getPublicPharmacy(req: Request, res: Response) {
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id: String(req.params.id) },
    select: {
      id: true,
      name: true,
      address: true,
      isOpen: true,
      logoPath: true,
      bannerPath: true,
      openingTime: true,
      closingTime: true,
      operatingDays: true,
      products: {
        where: {
          isActive: true,
          stock: { gt: 0 },
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
        select: { deliveryTime: true },
      },
    },
  });

  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }

  const { products, ...details } = pharmacy;
  res.json({
    ...publicImagePaths(details),
    availableProducts: products.length,
    deliveryTime: products.reduce<number | null>(
      (minimum, product) =>
        product.deliveryTime === null
          ? minimum
          : minimum === null
            ? product.deliveryTime
            : Math.min(minimum, product.deliveryTime),
      null,
    ),
    distance: null,
  });
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
  const pharmacy = await prisma.pharmacy.findFirst({
    where: { vendorUserId: req.user!.id },
  });
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }
  res.json({
    ...pharmacy,
    logoPath: pharmacy.logoPath ? pharmacyImageUrl(pharmacy.logoPath) : null,
    bannerPath: pharmacy.bannerPath
      ? pharmacyImageUrl(pharmacy.bannerPath)
      : null,
  });
}

export async function updateMyPharmacyProfile(req: Request, res: Response) {
  const pharmacy = await prisma.pharmacy.findFirst({
    where: { vendorUserId: req.user!.id },
  });
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }
  const input = validateVendorPharmacyProfile(req.body);
  const files = req.files as
    { [fieldname: string]: Express.Multer.File[] } | undefined;
  const logo = files?.logo?.[0],
    banner = files?.banner?.[0],
    uploaded: string[] = [];
  try {
    const logoPath = logo ? await uploadPharmacyImage(logo, "logo") : undefined;
    if (logoPath) uploaded.push(logoPath);
    const bannerPath = banner
      ? await uploadPharmacyImage(banner, "banner")
      : undefined;
    if (bannerPath) uploaded.push(bannerPath);
    const updated = await prisma.pharmacy.update({
      where: { id: pharmacy.id },
      data: {
        ...input,
        ...(logoPath ? { logoPath } : {}),
        ...(bannerPath ? { bannerPath } : {}),
      },
    });
    void deleteUploadedFiles(
      [
        logoPath ? pharmacy.logoPath : null,
        bannerPath ? pharmacy.bannerPath : null,
      ].filter((path): path is string => Boolean(path)),
      "replaced pharmacy images",
    );
    res.json({
      ...updated,
      logoPath: updated.logoPath ? pharmacyImageUrl(updated.logoPath) : null,
      bannerPath: updated.bannerPath
        ? pharmacyImageUrl(updated.bannerPath)
        : null,
    });
  } catch (error) {
    await deleteUploadedFiles(uploaded, "unsaved pharmacy images");
    throw error;
  }
}

export async function setMyPharmacyOpenStatus(req: Request, res: Response) {
  if (typeof req.body?.isOpen !== "boolean") {
    res.status(400).json({ error: "isOpen must be boolean." });
    return;
  }

  const pharmacy = await prisma.pharmacy.findFirst({
    where: { vendorUserId: req.user!.id },
    select: { id: true },
  });
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }

  res.json(
    await prisma.pharmacy.update({
      where: { id: pharmacy.id },
      data: { isOpen: req.body.isOpen },
    }),
  );
}
