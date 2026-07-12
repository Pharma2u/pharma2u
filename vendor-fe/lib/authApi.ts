import type { Session } from "@/store/authSlice";
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
async function post<T>(
  path: string,
  body: Record<string, string>,
  token?: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
  };
  if (!response.ok) throw new Error(data.message ?? "Request failed.");
  return data;
}
export async function loginVendor(
  phone: string,
  password: string,
): Promise<Session> {
  const session = await post<Session>("/login", {
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
  return post("/change-password", { currentPassword, newPassword }, token);
}
