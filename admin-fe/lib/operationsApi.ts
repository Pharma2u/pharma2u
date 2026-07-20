export type PharmacyApplication = {
  id: string;
  ownerName: string;
  ownerPhone: string;
  pharmacyName: string;
  address: string;
  drugLicenseNumber: string;
  pharmacistName: string;
  pharmacistLicenseNumber: string;
  drugLicenseUrl: string;
  pharmacistLicenseUrl: string;
};
const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Failure = { error?: string; message?: string };
export type PharmacyOnboardingInput = {
  pharmacyName: string;
  address: string;
  lat: number;
  lng: number;
  drugLicenseNumber: string;
  pharmacistName: string;
  pharmacistLicenseNumber: string;
  vendorName: string;
  vendorPhone: string;
};
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
  createPharmacy: (t: string, input: PharmacyOnboardingInput) =>
    api<{ pharmacyId: string; vendorPhone: string; temporaryPassword: string }>(
      "/admin/pharmacies",
      t,
      { method: "POST", body: JSON.stringify(input) },
    ),
  pharmacies: (t: string) =>
    api<{
      items: {
        id: string;
        name: string;
        vendor: { name: string; phone: string };
      }[];
    }>("/admin/pharmacies", t),
  pharmacyApplications: (t: string) =>
    api<{ items: PharmacyApplication[] }>(
      "/admin/pharmacy-applications/pending",
      t,
    ),
  approvePharmacyApplication: (t: string, id: string) =>
    api<{ ownerPhone: string; temporaryPassword: string }>(
      `/admin/pharmacy-applications/${id}/approve`,
      t,
      { method: "POST" },
    ),
  rejectPharmacyApplication: (t: string, id: string, reason: string) =>
    api(`/admin/pharmacy-applications/${id}/reject`, t, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  fleet: (t: string) =>
    api<{
      items: {
        id: string;
        name: string;
        phone: string;
        availability: "online" | "offline";
        riderKyc: { vehicleType: string; vehicleNumber: string } | null;
        riderLocation: {
          lat: number;
          lng: number;
          isOnline: boolean;
          updatedAt: string;
        } | null;
        ordersAsRider: {
          id: string;
          orderCode: string;
          status: string;
          pharmacy: { name: string };
        }[];
      }[];
    }>("/admin/riders/fleet", t),
  pending: (t: string) =>
    api<{
      items: {
        id: string;
        name: string;
        phone: string;
        kyc?: {
          aadharNumber: string;
          panNumber: string;
          drivingLicenseNumber: string;
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
