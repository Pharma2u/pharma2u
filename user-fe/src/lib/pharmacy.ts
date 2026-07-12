import { pharmacies } from "@/src/data/pharmacies";
import { pharmacyInventory } from "@/src/data/pharmacyInventory";

import type { PharmacyWithInventory } from "@/src/lib/pharmacy";

export function getPharmaciesForProduct(
  productId: number
): PharmacyWithInventory[] {
  const availableInventory = pharmacyInventory.filter(
    (inventoryItem) =>
      inventoryItem.productId === productId &&
      inventoryItem.isAvailable &&
      inventoryItem.stockQuantity > 0
  );

  const availablePharmacies = availableInventory
    .map((inventoryItem) => {
      const pharmacy = pharmacies.find(
        (item) => item.id === inventoryItem.pharmacyId
      );

      if (!pharmacy) {
        return null;
      }

      return {
        ...pharmacy,
        inventory: inventoryItem,
      };
    })
    .filter(
      (
        pharmacy
      ): pharmacy is PharmacyWithInventory =>
        pharmacy !== null
    );

  return availablePharmacies.sort(
    (firstPharmacy, secondPharmacy) =>
      firstPharmacy.deliveryTime -
      secondPharmacy.deliveryTime
  );
}