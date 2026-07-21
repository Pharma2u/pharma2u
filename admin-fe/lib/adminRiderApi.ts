import { notifyAdminSessionExpired } from "./sessionEvents";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export type AdminRiderInput = {
  name: string;
  phone: string;
  aadharNumber: string;
  panNumber: string;
  drivingLicenseNumber: string;
  vehicleType: "bike" | "scooter" | "motorcycle" | "bicycle" | "car";
  vehicleNumber: string;
  aadharImage: File;
  panImage: File;
  dlImage: File;
};

export async function createAdminRider(token: string, input: AdminRiderInput) {
  const form = new FormData();
  form.set("name", input.name);
  form.set("phone", input.phone);
  form.set("aadharNumber", input.aadharNumber);
  form.set("panNumber", input.panNumber);
  form.set("drivingLicenseNumber", input.drivingLicenseNumber);
  form.set("vehicleType", input.vehicleType);
  form.set("vehicleNumber", input.vehicleNumber);
  form.set("aadharImage", input.aadharImage);
  form.set("panImage", input.panImage);
  form.set("dlImage", input.dlImage);
  const response = await fetch(`${base}/admin/riders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) notifyAdminSessionExpired();
  if (!response.ok) throw new Error(data.error ?? data.message ?? "Unable to create rider.");
  return data as { id: string; phone: string; temporaryPassword: string };
}
