type RazorpayOrder = {
  id: string;
  amount: number;
  amount_paid: number;
  currency: string;
  receipt: string;
  status: string;
};

export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  error_description?: string | null;
};

export type RazorpayRefund = {
  id: string;
  payment_id: string;
  amount: number;
  status: string;
};

function credentials() {
  const keyId = (
    process.env.RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY
  )?.trim();
  const keySecret = (
    process.env.RAZORPAY_KEY_SECRET ?? process.env.RAZORPAY_SECRET
  )?.trim();
  if (!keyId || !keySecret) {
    throw Object.assign(new Error("Razorpay is not configured."), {
      status: 503,
    });
  }
  return { keyId, keySecret };
}

async function razorpayRequest<T>(path: string, init: RequestInit = {}) {
  const { keyId, keySecret } = credentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { description?: string };
  } & T;
  if (!response.ok) {
    throw Object.assign(
      new Error(payload.error?.description ?? "Razorpay request failed."),
      { status: 502, providerPayload: payload },
    );
  }
  return payload;
}

export function razorpayKeyId() {
  return credentials().keyId;
}

export function createRazorpayOrder(input: {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  return razorpayRequest<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    }),
  });
}

export function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPayment>(
    `/payments/${encodeURIComponent(paymentId)}`,
  );
}

export function createRazorpayRefund(
  paymentId: string,
  input: { amount: number; orderId: string; reason: string },
) {
  return razorpayRequest<RazorpayRefund>(
    `/payments/${encodeURIComponent(paymentId)}/refund`,
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        speed: "optimum",
        notes: { orderId: input.orderId, reason: input.reason.slice(0, 250) },
      }),
    },
  );
}
