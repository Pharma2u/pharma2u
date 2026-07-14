import type { AuthSession } from "@/store/authSlice";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type ApiError = { error?: string; message?: string };
export type ProvisionedAccount = {
  id: string;
  phone: string;
  role: string;
  temporaryPassword: string;
};

async function post<T>(
  path: string,
  body: Record<string, string>,
  token?: string,
): Promise<T> {
  const response = await fetch(`${apiBase}/auth${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Request failed.");
  }
  return data;
}

export async function loginAdmin(
  phone: string,
  password: string,
): Promise<AuthSession> {
  const session = await post<AuthSession>("/login", {
    identifier: phone,
    password,
  });
  if (session.role !== "admin")
    throw new Error("This account is not an administrator.");
  return session;
}

export function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
) {
  return post("/change-password", { currentPassword, newPassword }, token);
}

export function provisionStaff(
  token: string,
  name: string,
  phone: string,
  email: string,
  role: "rider",
) {
  return post<ProvisionedAccount>(
    "/admin/provision-staff",
    { name, phone, email, role },
    token,
  );
}

export function provisionAdmin(
  token: string,
  name: string,
  phone: string,
  currentPassword: string,
) {
  return post<ProvisionedAccount>(
    "/admin/provision-admin",
    { name, phone, currentPassword },
    token,
  );
}
