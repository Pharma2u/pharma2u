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