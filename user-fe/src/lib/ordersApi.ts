export type CreateOrderInput = {
  items: { productId: string; qty: number }[];
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  paymentMethod: "upi" | "card" | "cod";
  deliveryInstructions?: string;
  deliveryFee?: number;
  estimatedMinutes?: number;
};

type ApiFailure = { error?: string; message?: string };

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok) throw new Error(data.error ?? data.message ?? "Request failed. Please try again.");
  return data;
}

export type CreatedOrder = { id: string; orderCode: string; status: string; estimatedDeliveryTime: string | null };

export function createOrder(token: string, input: CreateOrderInput) {
  return request<CreatedOrder>("/orders", token, { method: "POST", body: JSON.stringify(input) });
}

export function cancelOrder(token: string, orderId: string, reason?: string) {
  return request<{ id: string; status: string }>(`/orders/${orderId}/cancel`, token, { method: "POST", body: JSON.stringify({ reason }) });
}

export function uploadOrderPrescription(token: string, orderId: string, file: File) {
  const body = new FormData();
  body.append("prescription", file);
  return request<{ path: string }>(`/orders/${orderId}/prescription`, token, { method: "POST", body, headers: { Authorization: `Bearer ${token}` } });
}

export type CustomerOrder = { id: string; orderCode: string; status: string; total: number; createdAt: string; estimatedDeliveryTime: string | null; pharmacy: { name: string; address: string }; items: { id: string; name: string; qty: number; price: number }[] };
export function listMyOrders(token: string) { return request<{ items: CustomerOrder[] }>("/orders/customer/mine", token); }
export function getMyOrder(token: string, orderId: string) { return request<CustomerOrder>(`/orders/${orderId}`, token); }