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
    body: JSON.stringify({
      identifier: phone,
      password,
      expectedRole: "rider",
    }),
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

export type RiderTask = {
  id: string;
  orderCode: string;
  status: string;
  total: number;
  dropAddress?: string;
  isRelay: boolean;
  leg?: "primary" | "relay";
  pharmacy: { name: string; address: string };
  relayPharmacy?: { name: string; address: string } | null;
  items: { id: string; name: string; qty: number }[];
};


export function listRiderTasks(token: string) {
  return request<{ items: RiderTask[] }>("/orders/rider/available", {
    headers: { Authorization: `Bearer ${token}` },
  });
}


export function acceptRiderTask(
  token: string,
  id: string,
  leg: "primary" | "relay",
) {
  return request<{ id: string; status: string }>(`/orders/${id}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ leg }),
  });
}


export function listMyRiderTasks(token: string) {
  return request<{ items: RiderTask[] }>("/orders/rider/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
}


export function completeRelayHandoff(token: string, id: string) {
  return request<{ id: string; relayStatus: string }>(
    `/orders/${id}/relay-handoff`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
}


export function updateDeliveryStatus(
  token: string,
  id: string,
  status: "picked_up" | "on_the_way" | "delivered",
) {
  return request<{ id: string; status: string }>(`/orders/${id}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

export function updateMyLocation(token: string, lat: number, lng: number) {
  return request<{ lat: number; lng: number; updatedAt: string }>("/riders/location", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ lat, lng, isOnline: true }),
  });
}