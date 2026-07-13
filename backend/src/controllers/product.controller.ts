// Implements vendor-scoped inventory operations with server-derived pharmacy ownership.
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  validateProductCreate,
  validateProductUpdate,
  validateStock,
} from "../validators/product.validator";

async function pharmacyId(req: Request, res: Response) {
  const p = await prisma.pharmacy.findUnique({
    where: { vendorUserId: req.user!.id },
    select: { id: true },
  });
  if (!p) {
    res.status(404).json({ error: "Pharmacy not found." });
    return null;
  }
  return p.id;
}

async function owned(req: Request, res: Response) {
  const pid = await pharmacyId(req, res);
  if (!pid) return null;
  const product = await prisma.product.findFirst({
    where: { id: String(req.params.id), pharmacyId: pid },
  });
  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return null;
  }
  return { pid, product };
}

const pg = (q: unknown) => Math.max(1, Number(q) || 1),
  lim = (q: unknown) => Math.min(100, Math.max(1, Number(q) || 20));
export async function createProduct(req: Request, res: Response) {
  const pid = await pharmacyId(req, res);
  if (!pid) return;
  const input = validateProductCreate(req.body);
  res
    .status(201)
    .json(await prisma.product.create({ data: { ...input, pharmacyId: pid } }));
}

export async function listProducts(req: Request, res: Response) {
  const pid = await pharmacyId(req, res);
  if (!pid) return;
  const take = lim(req.query.limit),
    search =
      typeof req.query.search === "string" ? req.query.search.trim() : "",
    category =
      typeof req.query.category === "string" ? req.query.category : undefined;
  if (category && !["otc", "prescription", "schedule_h"].includes(category)) {
    res.status(400).json({ error: "Invalid category." });
    return;
  }
  const where = {
    pharmacyId: pid,
    ...(category ? { category: category as "otc" } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { genericName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      skip: (pg(req.query.page) - 1) * take,
      take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ items, total, page: pg(req.query.page), limit: take });
}

export async function updateProduct(req: Request, res: Response) {
  const hit = await owned(req, res);
  if (!hit) return;
  res.json(
    await prisma.product.update({
      where: { id: hit.product.id },
      data: validateProductUpdate(req.body),
    }),
  );
}

export async function updateStock(req: Request, res: Response) {
  const hit = await owned(req, res);
  if (!hit) return;
  res.json(
    await prisma.product.update({
      where: { id: hit.product.id },
      data: { stock: validateStock(req.body) },
    }),
  );
}

export async function deleteProduct(req: Request, res: Response) {
  const hit = await owned(req, res);
  if (!hit) return;
  await prisma.product.update({
    where: { id: hit.product.id },
    data: { isActive: false },
  });
  res.status(204).send();
}
