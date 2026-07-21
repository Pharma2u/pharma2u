import type { Product } from "@/src/data/products";

type PublicProduct = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyIsOpen: boolean;
  name: string;
  genericName: string;
  category: "otc" | "prescription" | "schedule_h";
  price: number;
  stock: number;
  unit: string;
  prescriptionRequired: boolean;
  imageUrl: string | null;
  imageUrls: { id: string; url: string; sortOrder: number }[];
  description: string | null;
  manufacturer: string | null;
  packSize: string | null;
  mrp: number | null;
  discount: number;
  saltComposition: string | null;
  storageInstructions: string | null;
  deliveryTime: number | null;
};

type PublicProductsResponse = { items: PublicProduct[] };

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

function toProduct(product: PublicProduct): Product {
  return {
    id: product.id,
    pharmacyId: product.pharmacyId,
    pharmacyName: product.pharmacyName,
    pharmacyAddress: product.pharmacyAddress,
    stock: product.stock,
    name: product.name,
    manufacturer: product.manufacturer ?? product.pharmacyName,
    packSize: product.packSize ?? product.unit,
    mrp: product.mrp ?? product.price,
    price: product.price,
    discount: product.discount,
    prescriptionRequired: product.prescriptionRequired,
    deliveryTime: product.deliveryTime
      ? `${product.deliveryTime} mins`
      : "Delivery estimate unavailable",
    category: product.category.replaceAll("_", " "),
    inStock: product.stock > 0 && product.pharmacyIsOpen,
    image: product.imageUrls[0]?.url ?? product.imageUrl ?? "",
    description:
      product.description ??
      (product.genericName
        ? `${product.name} (${product.genericName}) is available from ${product.pharmacyName}.`
        : `${product.name} is available from ${product.pharmacyName}.`),
    saltComposition:
      (product.saltComposition ?? product.genericName) || undefined,
    storageInstructions:
      product.storageInstructions ??
      "Store according to the product packaging instructions.",
  };
}

export async function getPublicProducts(
  pharmacyId?: string,
): Promise<Product[]> {
  try {
    const query = pharmacyId
      ? `?pharmacyId=${encodeURIComponent(pharmacyId)}`
      : "";
    const response = await fetch(`${API_URL}/products${query}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Unable to load products: ${response.status}`);
    }
    return ((await response.json()) as PublicProductsResponse).items.map(
      toProduct,
    );
  } catch (error) {
    console.error("Unable to load pharmacy products", error);
    return [];
  }
}

