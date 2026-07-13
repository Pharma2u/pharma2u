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


const finite = (o: Record<string, unknown>, k: string) => {
  const v = o[k];
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new ProductValidationError(`${k} must be a finite number.`);
  return v;
};


const cat = (o: Record<string, unknown>) => {
  const v = o.category;
  if (!(cats as readonly unknown[]).includes(v))
    throw new ProductValidationError("Invalid category.");
  return v as ProductCategory;
};


export function validateProductCreate(v: unknown) {
  const o = obj(v),
    price = finite(o, "price"),
    stock = finite(o, "stock");
  if (price <= 0)
    throw new ProductValidationError("price must be greater than zero.");
  if (stock < 0 || !Number.isInteger(stock))
    throw new ProductValidationError("stock must be a non-negative integer.");
  return {
    name: str(o, "name"),
    genericName: str(o, "genericName"),
    category: cat(o),
    price,
    stock,
    unit: str(o, "unit"),
  };
}


export function validateProductUpdate(v: unknown) {
  const o = obj(v),
    out: Record<string, unknown> = {};
  for (const k of ["name", "genericName", "unit"])
    if (o[k] !== undefined) out[k] = str(o, k);
  if (o.category !== undefined) out.category = cat(o);
  if (o.price !== undefined) {
    const n = finite(o, "price");
    if (n <= 0)
      throw new ProductValidationError("price must be greater than zero.");
    out.price = n;
  }
  if (o.stock !== undefined) {
    const n = finite(o, "stock");
    if (n < 0 || !Number.isInteger(n))
      throw new ProductValidationError("stock must be a non-negative integer.");
    out.stock = n;
  }
  if (o.isActive !== undefined) {
    if (typeof o.isActive !== "boolean")
      throw new ProductValidationError("isActive must be boolean.");
    out.isActive = o.isActive;
  }
  if (!Object.keys(out).length)
    throw new ProductValidationError("No update fields supplied.");
  return out;
}


export function validateStock(v: unknown) {
  const o = obj(v),
    stock = finite(o, "stock");
  if (stock < 0 || !Number.isInteger(stock))
    throw new ProductValidationError("stock must be a non-negative integer.");
  return stock;
}
