import { pharmacies } from "@/src/data/pharmacies";
import { pharmacyInventory } from "@/src/data/pharmacyInventory";

export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  reviews?: number;
  availableMedicines?: number;
  isVerified: boolean;
  isOpen: boolean;
  deliveryTime: number;
  distance: number;
};
export type PharmacyInventoryItem = {
  id: string;
  pharmacyId: string;
  productId: string | number;
  stockQuantity: number;
  sellingPrice: number;
  mrp: number;
  discount: number;
  isAvailable: boolean;
  lastUpdated: string;
};
export type PharmacyWithInventory = Pharmacy & {
  inventory: PharmacyInventoryItem;
};

export function getPharmaciesForProduct(
  productId: string | number,
): PharmacyWithInventory[] {
  const availableInventory = pharmacyInventory.filter(
    (inventoryItem) =>
      inventoryItem.productId === productId &&
      inventoryItem.isAvailable &&
      inventoryItem.stockQuantity > 0,
  );

  const availablePharmacies = availableInventory
    .map((inventoryItem) => {
      const pharmacy = pharmacies.find(
        (item) => item.id === inventoryItem.pharmacyId,
      );

      if (!pharmacy) {
        return null;
      }

      return {
        ...pharmacy,
        inventory: inventoryItem,
      };
    })
    .filter((pharmacy): pharmacy is PharmacyWithInventory => pharmacy !== null);

  return availablePharmacies.sort(
    (firstPharmacy, secondPharmacy) =>
      firstPharmacy.deliveryTime - secondPharmacy.deliveryTime,
  );
}
