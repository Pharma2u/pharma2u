import type { ProductCategory } from "@/lib/authApi";

export const productCategories: ProductCategory[] = [
  "otc",
  "prescription",
  "schedule_h",
];

export const productCategoryLabels: Record<ProductCategory, string> = {
  otc: "OTC",
  prescription: "Prescription",
  schedule_h: "Schedule H",
};

export const productTypes = [
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "BOTTLE",
  "TUBE",
  "JAR",
  "TIN",
  "INJECTION",
  "DROPS",
  "VIAL",
  "AMPOULE",
  "SACHET",
  "RESP",
  "POUCH",
  "PACKET",
  "POWDER",
  "OINTMENT",
  "CREAM",
  "CONSUMABLE",
  "PIECE",
  "PAIR",
  "ROLL",
  "SET",
  "PACK",
  "UNIT",
  "OTHER",
] as const;

export type ProductType = (typeof productTypes)[number];

export const purchaseUnits = [
  "BOX",
  "STRIP",
  "TABLET",
  "CAPSULE",
  "BLISTER",
  "BOTTLE",
  "VIAL",
  "AMPOULE",
  "DROPS",
  "TUBE",
  "JAR",
  "TIN",
  "SACHET",
  "RESP",
  "POUCH",
  "PACKET",
  "PIECE",
  "PAIR",
  "ROLL",
  "SET",
  "PACK",
  "UNIT",
] as const;
