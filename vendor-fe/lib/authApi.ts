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
      ...(init.body ? { "Content-Type": "application/json" } : {}),
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


export function createProduct(
  token: string,
  data: Omit<Product, "id" | "isActive">,
) {
  return request<Product>("/vendor/products", token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}


export function updateProduct(
  token: string,
  id: string,
  data: Partial<Omit<Product, "id">>,
) {
  return request<Product>(`/vendor/products/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
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
