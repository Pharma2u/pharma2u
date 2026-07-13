const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Failure = { error?: string; message?: string };
async function api<T>(path: string, token: string, init: RequestInit = {}) {
  const r = await fetch(base + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const d = (await r.json().catch(() => ({}))) as T & Failure;
  if (!r.ok) throw new Error(d.error ?? d.message ?? "Request failed.");
  return d;
}
export const adminOperations = {
  pharmacies: (t: string) =>
    api<{
      items: {
        id: string;
        name: string;
        vendor: { name: string; phone: string };
      }[];
    }>("/admin/pharmacies", t),
  pending: (t: string) =>
    api<{
      items: {
        id: string;
        name: string;
        phone: string;
        kyc?: {
          vehicleType: string;
          vehicleNumber: string;
          aadharImageUrl: string;
          panImageUrl: string;
          dlImageUrl: string;
        };
      }[];
    }>("/admin/riders/pending", t),
  approve: (t: string, id: string) =>
    api<{ phone: string; temporaryPassword: string }>(
      `/admin/riders/${id}/approve`,
      t,
      { method: "POST" },
    ),
  reject: (t: string, id: string, reason: string) =>
    api(`/admin/riders/${id}/reject`, t, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};
