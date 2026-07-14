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

type AvailabilityResponse = {
  items: Array<{
    id: string;
    name: string;
    address: string;
    isOpen: boolean;
    deliveryTime: number;
    distance: number | null;
    rating: number | null;
    reviewCount: number;
    inventory: {
      id: string;
      productId: string;
      stockQuantity: number;
      sellingPrice: number;
      mrp: number;
      discount: number;
    };
  }>;
};

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

/** Returns live, in-stock pharmacies for the selected product. */
export async function getPharmaciesForProduct(productId: string | number): Promise<PharmacyWithInventory[]> {
  const response = await fetch(`${apiBase}/products/${productId}/availability`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to load pharmacy availability.");
  }

  const data = (await response.json()) as AvailabilityResponse;
  return data.items.map((item) => ({
    id: item.id,
    name: item.name,
    address: item.address,
    city: "",
    state: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    rating: item.rating ?? 0,
    reviewCount: item.reviewCount,
    isVerified: true,
    isOpen: item.isOpen,
    deliveryTime: item.deliveryTime,
    distance: item.distance ?? 0,
    inventory: {
      id: item.inventory.id,
      pharmacyId: item.id,
      productId: item.inventory.productId,
      stockQuantity: item.inventory.stockQuantity,
      sellingPrice: item.inventory.sellingPrice,
      mrp: item.inventory.mrp,
      discount: item.inventory.discount,
      isAvailable: item.isOpen && item.inventory.stockQuantity > 0,
      lastUpdated: new Date().toISOString(),
    },
  }));
}