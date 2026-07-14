// Validates vendor product create and update request bodies.
import type { ProductCategory } from "../generated/prisma/client";
export class ProductValidationError extends Error {}
const cats = ["otc", "prescription", "schedule_h"] as const;
const obj = (v: unknown) => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new ProductValidationError("Request body must be an object.");
  return v as Record<string, unknown>;
};
const str = (o: Record<string, unknown>, k: string) => {
  const v = o[k];
  if (typeof v !== "string" || !v.trim())
    throw new ProductValidationError(`${k} is required.`);
  return v.trim();
};
const optional = (o: Record<string, unknown>, k: string) =>
  o[k] === undefined ? undefined : str(o, k);
const finite = (o: Record<string, unknown>, k: string) => {
  const v = o[k],
    n =
      typeof v === "number"
        ? v
        : typeof v === "string" && v.trim()
          ? Number(v)
          : NaN;
  if (!Number.isFinite(n))
    throw new ProductValidationError(`${k} must be a finite number.`);
  return n;
};
const category = (o: Record<string, unknown>) => {
  if (!(cats as readonly unknown[]).includes(o.category))
    throw new ProductValidationError("Invalid category.");
  return o.category as ProductCategory;
};
function details(o: Record<string, unknown>, required: boolean) {
  const out: Record<string, unknown> = {};
  for (const k of [
    "description",
    "manufacturer",
    "packSize",
    "saltComposition",
    "storageInstructions",
    "batchNumber",
  ]) {
    const v = required ? str(o, k) : optional(o, k);
    if (v !== undefined) out[k] = v;
  }
  for (const k of ["mrp", "discount", "deliveryTime"])
    if (o[k] !== undefined || required) {
      const n = finite(o, k);
      if (n < 0 || (k === "deliveryTime" && !Number.isInteger(n)))
        throw new ProductValidationError(
          `${k} must be non-negative${k === "deliveryTime" ? " integer" : ""}.`,
        );
      out[k] = n;
    }
  if (o.expiryDate !== undefined) {
    const d = new Date(str(o, "expiryDate"));
    if (Number.isNaN(d.getTime()))
      throw new ProductValidationError("expiryDate must be a valid date.");
    out.expiryDate = d;
  }
  if (o.imageUrls !== undefined) {
    if (!Array.isArray(o.imageUrls) || !o.imageUrls.every((u) => typeof u === "string"))
      throw new ProductValidationError("imageUrls must be an array of strings.");
    out.imageUrls = o.imageUrls;
  }
  return out;
}
export function validateProductCreate(v: unknown) {
  const o = obj(v),
    price = finite(o, "price"),
    stock = finite(o, "stock");
  if (price <= 0)
    throw new ProductValidationError("price must be greater than zero.");
  if (stock < 0 || !Number.isInteger(stock))
    throw new ProductValidationError("stock must be a non-negative integer.");
  const d = details(o, false);
  if (d.mrp !== undefined && (d.mrp as number) < price)
    throw new ProductValidationError("mrp must be at least price.");
  return {
    name: str(o, "name"),
    genericName: str(o, "genericName"),
    category: category(o),
    price,
    stock,
    unit: str(o, "unit"),
    ...d,
  };
}
export function validateProductUpdate(v: unknown) {
  const o = obj(v),
    out: Record<string, unknown> = {};
  for (const k of ["name", "genericName", "unit"])
    if (o[k] !== undefined) out[k] = str(o, k);
  if (o.category !== undefined) out.category = category(o);
  for (const k of ["price", "stock"])
    if (o[k] !== undefined) {
      const n = finite(o, k);
      if (
        n < 0 ||
        (k === "price" && n === 0) ||
        (k === "stock" && !Number.isInteger(n))
      )
        throw new ProductValidationError(`Invalid ${k}.`);
      out[k] = n;
    }
  if (o.isActive !== undefined) {
    if (typeof o.isActive !== "boolean")
      throw new ProductValidationError("isActive must be boolean.");
    out.isActive = o.isActive;
  }
  return { ...out, ...details(o, false) };
}
export function validateStock(v: unknown) {
  const stock = finite(obj(v), "stock");
  if (stock < 0 || !Number.isInteger(stock))
    throw new ProductValidationError("stock must be a non-negative integer.");
  return stock;
}
