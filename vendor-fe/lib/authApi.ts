import type { Session } from "@/store/authSlice";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type ApiFailure = { error?: string; message?: string };

async function request<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Request failed.");
  return data;
}

async function authPost<T>(
  path: string,
  body: Record<string, string>,
  token?: string,
) {
  const response = await fetch(`${baseUrl}/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Request failed.");
  return data;
}

export type ProductCategory = "otc" | "prescription" | "schedule_h";
export type Product = {
  id: string;
  name: string;
  genericName: string;
  category: ProductCategory;
  price: number;
  stock: number;
  unit: string;
  isActive: boolean;
  description?: string | null;
  manufacturer?: string | null;
  packSize?: string | null;
  mrp?: number | null;
  discount?: number;
  saltComposition?: string | null;
  storageInstructions?: string | null;
  deliveryTime?: number | null;
  expiryDate?: string | null;
  batchNumber?: string | null;
  imageUrls?: { id: string; url: string; sortOrder: number }[];
  imageUrl?: string | null;
};
export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  drugLicenseNumber: string;
  pharmacistName: string;
  pharmacistLicenseNumber: string;
};

export async function loginVendor(
  phone: string,
  password: string,
): Promise<Session> {
  const session = await authPost<Session>("/login", {
    identifier: phone,
    password,
  });
  if (session.role !== "vendor")
    throw new Error("This account is not a vendor account.");
  return session;
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  return authPost("/change-password", { currentPassword, newPassword }, token);
}

export function getMyPharmacy(token: string) {
  return request<Pharmacy>("/vendor/pharmacy/me", token);
}
export function listProducts(token: string, search = "", category = "") {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  return request<{ items: Product[] }>(
    `/vendor/products?${query.toString()}`,
    token,
  );
}

export type ProductInput = Omit<Product, "id" | "isActive" | "imageUrls"> & {
  images?: File[];
};

function productFormData(data: Partial<ProductInput>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (
      key === "images" ||
      value === undefined ||
      value === null ||
      value === ""
    )
      continue;
    form.set(key, String(value));
  }
  for (const image of data.images ?? []) form.append("images", image);
  return form;
}

export function createProduct(token: string, data: ProductInput) {
  return request<Product>("/vendor/products", token, {
    method: "POST",
    body: productFormData(data),
  });
}

export function updateProduct(
  token: string,
  id: string,
  data: Partial<ProductInput>,
) {
  const hasImages = Boolean(data.images?.length);
  return request<Product>(`/vendor/products/${id}`, token, {
    method: "PATCH",
    body: hasImages ? productFormData(data) : JSON.stringify(data),
  });
}
export function updateStock(token: string, id: string, stock: number) {
  return request<Product>(`/vendor/products/${id}/stock`, token, {
    method: "PATCH",
    body: JSON.stringify({ stock }),
  });
}

export function deactivateProduct(token: string, id: string) {
  return request<void>(`/vendor/products/${id}`, token, { method: "DELETE" });
}
