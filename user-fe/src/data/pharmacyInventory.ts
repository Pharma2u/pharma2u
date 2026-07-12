import type {
  PharmacyInventoryItem,
} from "@/src/lib/pharmacy";

export const pharmacyInventory: PharmacyInventoryItem[] = [
  /*
   * PHARMACY 1
   */

  {
    id: "inventory-1",
    pharmacyId: "pharmacy-1",
    productId: 1,
    stockQuantity: 50,
    sellingPrice: 28,
    mrp: 32,
    discount: 12,
    isAvailable: true,
    lastUpdated: new Date().toISOString(),
  },

  {
    id: "inventory-2",
    pharmacyId: "pharmacy-1",
    productId: 2,
    stockQuantity: 25,
    sellingPrice: 45,
    mrp: 52,
    discount: 13,
    isAvailable: true,
    lastUpdated: new Date().toISOString(),
  },

  /*
   * PHARMACY 2
   */

  {
    id: "inventory-3",
    pharmacyId: "pharmacy-2",
    productId: 1,
    stockQuantity: 30,
    sellingPrice: 30,
    mrp: 32,
    discount: 6,
    isAvailable: true,
    lastUpdated: new Date().toISOString(),
  },

  {
    id: "inventory-4",
    pharmacyId: "pharmacy-2",
    productId: 3,
    stockQuantity: 15,
    sellingPrice: 80,
    mrp: 95,
    discount: 15,
    isAvailable: true,
    lastUpdated: new Date().toISOString(),
  },

  /*
   * PHARMACY 3
   */

  {
    id: "inventory-5",
    pharmacyId: "pharmacy-3",
    productId: 1,
    stockQuantity: 10,
    sellingPrice: 27,
    mrp: 32,
    discount: 15,
    isAvailable: true,
    lastUpdated: new Date().toISOString(),
  },

  {
    id: "inventory-6",
    pharmacyId: "pharmacy-3",
    productId: 2,
    stockQuantity: 0,
    sellingPrice: 44,
    mrp: 52,
    discount: 15,
    isAvailable: false,
    lastUpdated: new Date().toISOString(),
  },
];