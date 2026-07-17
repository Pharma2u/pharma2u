// Implements vendor-scoped inventory operations with multi-image support.
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  validateProductCreate,
  validateProductUpdate,
  validateStock,
} from "../validators/product.validator";
import {
  deleteProductImages,
  productImageUrl,
  uploadProductImage,
} from "../utils/uploadthing";

type UploadedImage = Express.Multer.File;

const files = (req: Request) =>
  (Array.isArray(req.files) ? req.files : []) as UploadedImage[];

async function uploadImages(req: Request) {
  const results = await Promise.allSettled(files(req).map(uploadProductImage));
  const uploadedPaths = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const failedUpload = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failedUpload) {
    await deleteProductImages(uploadedPaths);
    throw failedUpload.reason;
  }
  return uploadedPaths;
}

async function pharmacyId(req: Request, res: Response) {
  const p = await prisma.pharmacy.findFirst({
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

async function serialize(product: any) {
  const images =
    product.images ??
    (await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: "asc" },
    }));
  const imageUrls = images.map((image: any) => ({
    id: image.id,
    url: productImageUrl(image.path),
    sortOrder: image.sortOrder,
  }));
  return {
    ...product,
    imageUrls,
    imageUrl:
      imageUrls[0]?.url ??
      (product.imagePath ? productImageUrl(product.imagePath) : null),
  };
}

const pg = (q: unknown) => Math.max(1, Number(q) || 1),
  lim = (q: unknown) => Math.min(100, Math.max(1, Number(q) || 20));

export async function createProduct(req: Request, res: Response) {
  const pid = await pharmacyId(req, res);

  if (!pid) return;

  const { imageUrls, ...input } = validateProductCreate(req.body) as any;

  const uploadedPaths = await uploadImages(req);

  const paths = [...(imageUrls || []), ...uploadedPaths];

  let product;
  try {
    product = await prisma.product.create({
      data: {
        ...input,
        pharmacyId: pid,
        imagePath: paths[0] || null,
        images: {
          create: paths.map((path, sortOrder) => ({ path, sortOrder })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    // UploadThing cannot participate in Prisma's transaction. Remove only files
    // uploaded for this request; externally supplied imageUrls must be preserved.
    await deleteProductImages(uploadedPaths);
    throw error;
  }

  res.status(201).json(await serialize(product));
}

export async function listPublicProducts(_req: Request, res: Response) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      pharmacy: { select: { name: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  res.json({
    items: await Promise.all(
      products.map(async (p) => ({
        ...(await serialize(p)),
        prescriptionRequired: p.category !== "otc",
        pharmacyName: p.pharmacy.name,
      })),
    ),
  });
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
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    items: await Promise.all(items.map(serialize)),
    total,
    page: pg(req.query.page),
    limit: take,
  });
}

export async function updateProduct(req: Request, res: Response) {
  const hit = await owned(req, res);
  if (!hit) return;
  const { imageUrls, ...input } = validateProductUpdate(req.body) as any;
  const uploadedPaths = await uploadImages(req);
  const paths = [...(imageUrls || []), ...uploadedPaths];

  let product;
  try {
    product = await prisma.product.update({
      where: { id: hit.product.id },
      data: {
        ...input,
        ...(paths.length
          ? {
              imagePath: paths[0],
              images: {
                deleteMany: {},
                create: paths.map((path, sortOrder) => ({ path, sortOrder })),
              },
            }
          : {}),
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
  } catch (error) {
    await deleteProductImages(uploadedPaths);
    throw error;
  }

  res.json(await serialize(product));
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

export async function listProductAvailability(req: Request, res: Response) {
  const selectedProduct = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    select: { id: true, name: true, genericName: true },
  });
  if (!selectedProduct) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stock: { gt: 0 },
      pharmacy: { isOpen: true },
      OR: [
        { genericName: selectedProduct.genericName },
        { name: selectedProduct.name },
      ],
    },
    include: {
      pharmacy: {
        select: { id: true, name: true, address: true, isOpen: true },
      },
    },
    orderBy: [{ deliveryTime: "asc" }, { price: "asc" }],
  });

  res.json({
    items: products.map((product) => ({
      id: product.pharmacy.id,
      name: product.pharmacy.name,
      address: product.pharmacy.address,
      isOpen: product.pharmacy.isOpen,
      deliveryTime: product.deliveryTime ?? 30,
      distance: null,
      rating: null,
      reviewCount: 0,
      inventory: {
        id: product.id,
        productId: product.id,
        stockQuantity: product.stock,
        sellingPrice: product.price,
        mrp: product.mrp ?? product.price,
        discount: product.discount,
      },
    })),
  });
}
