export type CreateOrderInput = {
  items: { productId: string; qty: number }[];
  dropAddress: string;
  dropLat?: number;
  dropLng?: number;
  paymentMethod: "upi" | "card" | "cod";
  deliveryInstructions?: string;
  deliveryFee?: number;
  estimatedMinutes?: number;
};

type ApiFailure = { error?: string; message?: string };

const apiBase = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

async function request<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pharma2u_auth");
      window.setTimeout(() => window.location.assign("/login"), 0);
    }
    throw new Error("Your session has expired. Please sign in again.");
  }
  if (!response.ok)
    throw new Error(
      data.error ?? data.message ?? "Request failed. Please try again.",
    );
  return data;
}

export type RazorpayCheckoutOrder = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
};

export type CreatedOrder = {
  id: string;
  orderCode: string;
  status: string;
  estimatedDeliveryTime: string | null;
  razorpay?: RazorpayCheckoutOrder;
};

export function createOrder(token: string, input: CreateOrderInput) {
  return request<CreatedOrder>("/orders", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cancelOrder(token: string, orderId: string, reason?: string) {
  return request<{ id: string; status: string; refundStatus: string | null }>(
    `/orders/${orderId}/cancel`,
    token,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export function verifyRazorpayPayment(
  token: string,
  orderId: string,
  payment: RazorpayPaymentResponse,
) {
  return request<{ id: string; paymentStatus: "paid"; status: string }>(
    `/orders/${orderId}/payments/razorpay/verify`,
    token,
    { method: "POST", body: JSON.stringify(payment) },
  );
}

export function reportRazorpayPaymentFailed(
  token: string,
  orderId: string,
  reason: string,
) {
  return request<{ id: string; status: "cancelled"; paymentStatus: "failed" }>(
    `/orders/${orderId}/payments/razorpay/failed`,
    token,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export function uploadOrderPrescription(
  token: string,
  orderId: string,
  file: File,
) {
  const body = new FormData();
  body.append("prescription", file);
  return request<{ path: string }>(`/orders/${orderId}/prescription`, token, {
    method: "POST",
    body,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type CustomerOrder = {
  id: string;
  orderCode: string;
  status: string;
  total: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "upi" | "card" | "cod";
  createdAt: string;
  estimatedDeliveryTime: string | null;
  pharmacy: {
    name: string;
    address: string;
    location?: { lat: number; lng: number } | null;
  };
  deliveryOtp?: string | null;
  dropLat?: number | null;
  dropLng?: number | null;
  items: { id: string; name: string; qty: number; price: number }[];
};
export function listMyOrders(token: string) {
  return request<{ items: CustomerOrder[] }>("/orders/customer/mine", token);
}
export function getMyOrder(token: string, orderId: string) {
  return request<CustomerOrder>(`/orders/${orderId}`, token);
}
