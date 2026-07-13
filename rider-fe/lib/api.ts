import type { RiderSession } from "@/store/authSlice";
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type ApiError = { error?: string; message?: string };
async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBase}${path}`, init);
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Request failed.");
  return data;
}
export async function loginRider(
  phone: string,
  password: string,
): Promise<RiderSession> {
  const data = await request<RiderSession>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: phone, password }),
  });
  if (data.role !== "rider")
    throw new Error("This account is not a rider account.");
  return data;
}
export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  return request("/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
export function applyForRider(form: FormData) {
  return request<{ applicationId: string; status: "pending"; message: string }>(
    "/riders/apply",
    { method: "POST", body: form },
  );
}
