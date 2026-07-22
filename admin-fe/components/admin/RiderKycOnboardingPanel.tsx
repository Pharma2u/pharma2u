"use client";

import { FormEvent, useState } from "react";
import { createAdminRider, type AdminRiderInput } from "@/lib/adminRiderApi";

const fields: {
  key: keyof Pick<
    AdminRiderInput,
    | "name"
    | "phone"
    | "aadharNumber"
    | "panNumber"
    | "drivingLicenseNumber"
    | "vehicleNumber"
  >;
  label: string;
  hint?: string;
}[] = [
  { key: "name", label: "Rider name" },
  {
    key: "phone",
    label: "Mobile number",
    hint: "10-digit Indian mobile number",
  },
  { key: "aadharNumber", label: "Aadhaar number", hint: "12 digits" },
  { key: "panNumber", label: "PAN number", hint: "ABCDE1234F" },
  { key: "drivingLicenseNumber", label: "Driving licence number" },
  { key: "vehicleNumber", label: "Vehicle registration number" },
];

export function RiderKycOnboardingPanel({ token }: { token: string }) {
  const [values, setValues] = useState<Record<string, string>>({
    vehicleType: "bike",
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    aadharImage: null,
    panImage: null,
    dlImage: null,
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.aadharImage || !files.panImage || !files.dlImage)
      return setError("Upload all three KYC documents.");
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const rider = await createAdminRider(token, {
        name: values.name ?? "",
        phone: values.phone ?? "",
        aadharNumber: values.aadharNumber ?? "",
        panNumber: values.panNumber ?? "",
        drivingLicenseNumber: values.drivingLicenseNumber ?? "",
        vehicleType: values.vehicleType as AdminRiderInput["vehicleType"],
        vehicleNumber: values.vehicleNumber ?? "",
        aadharImage: files.aadharImage,
        panImage: files.panImage,
        dlImage: files.dlImage,
      });
      setNotice(
        `Rider created and approved. Phone: ${rider.phone}. Temporary password: ${rider.temporaryPassword}`,
      );
      setValues({ vehicleType: "bike" });
      setFiles({ aadharImage: null, panImage: null, dlImage: null });
      event.currentTarget.reset();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create rider.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-3xl rounded-3xl bg-white p-7 shadow-sm">
      <p className="text-sm font-bold text-emerald-600">RIDER ONBOARDING</p>
      <h2 className="mt-2 text-2xl font-bold">Create rider with KYC</h2>
      <p className="mt-2 text-sm text-slate-500">
        All identity, vehicle, and document fields are required. The new rider
        is approved immediately.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm font-medium">
            {field.label}{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
            <input
              required
              value={values[field.key] ?? ""}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border p-3"
            />
            {field.hint && (
              <span className="mt-1 block text-xs text-slate-500">
                {field.hint}
              </span>
            )}
          </label>
        ))}
        <label className="block text-sm font-medium">
          Vehicle type{" "}
          <span className="text-red-600" aria-hidden="true">
            *
          </span>
          <select
            required
            value={values.vehicleType}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                vehicleType: event.target.value,
              }))
            }
            className="mt-2 w-full rounded-xl border p-3"
          >
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
            <option value="motorcycle">Motorcycle</option>
            <option value="bicycle">Bicycle</option>
            <option value="car">Car</option>
          </select>
        </label>
        {(
          [
            ["aadharImage", "Aadhaar image"],
            ["panImage", "PAN image"],
            ["dlImage", "Driving licence image"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm font-medium">
            {label}{" "}
            <span className="text-red-600" aria-hidden="true">
              *
            </span>
            <input
              required
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) =>
                setFiles((current) => ({
                  ...current,
                  [key]: event.target.files?.[0] ?? null,
                }))
              }
              className="mt-2 block w-full text-sm"
            />
            <span className="mt-1 block text-xs text-slate-500">
              JPEG or PNG, up to 5 MB
            </span>
          </label>
        ))}
        {(error || notice) && (
          <p
            className={`sm:col-span-2 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}
          >
            {error || notice}
          </p>
        )}
        <button
          disabled={saving}
          className="w-fit rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60"
        >
          {saving ? "Creating rider..." : "Create and approve rider"}
        </button>
      </form>
    </section>
  );
}
