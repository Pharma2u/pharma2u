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

export type PublicPharmacy = {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  logoPath: string | null;
  bannerPath: string | null;
  openingTime: string | null;
  closingTime: string | null;
  operatingDays: string[];
  availableProducts: number;
  deliveryTime: number | null;
  distance: number | null;
};

type AvailabilityResponse = {
  items: Array<{
    id: string;
    name: string;
    address: string;
    isOpen: boolean;
    logoPath: string | null;
    bannerPath: string | null;
    openingTime: string | null;
    closingTime: string | null;
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

const apiBase = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

export async function getPublicPharmacies(): Promise<PublicPharmacy[]> {
  try {
    const response = await fetch(`${apiBase}/pharmacies`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Unable to load pharmacies: ${response.status}`);
    }
    const data = (await response.json()) as { items: PublicPharmacy[] };
    return data.items;
  } catch (error) {
    console.error("Unable to load public pharmacies", error);
    return [];
  }
}

export async function getNearbyPharmacies(
  latitude: number,
  longitude: number,
  radiusKm = 10,
): Promise<PublicPharmacy[]> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    radiusKm: String(radiusKm),
  });
  const response = await fetch(`${apiBase}/pharmacies/nearby?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "Unable to find nearby pharmacies.");
  }
  return ((await response.json()) as { items: PublicPharmacy[] }).items;
}

export async function getPublicPharmacy(
  id: string,
): Promise<PublicPharmacy | null> {
  try {
    const response = await fetch(
      `${apiBase}/pharmacies/${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Unable to load pharmacy: ${response.status}`);
    }
    return (await response.json()) as PublicPharmacy;
  } catch (error) {
    console.error("Unable to load pharmacy", error);
    return null;
  }
}

/** Returns live, in-stock pharmacies for the selected product. */
export async function getPharmaciesForProduct(
  productId: string | number,
): Promise<PharmacyWithInventory[]> {
  const response = await fetch(
    `${apiBase}/products/${productId}/availability`,
    { cache: "no-store" },
  );
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
    logoPath: item.logoPath,
    bannerPath: item.bannerPath,
    openingTime: item.openingTime,
    closingTime: item.closingTime,
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

