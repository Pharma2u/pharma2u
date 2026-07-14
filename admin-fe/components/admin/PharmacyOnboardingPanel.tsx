"use client";

import { type ChangeEvent, type FormEvent, useState } from "react";
import { z } from "zod";
import { adminOperations, type PharmacyOnboardingInput } from "@/lib/operationsApi";
import { OnboardingField } from "./pharmacy-onboarding/OnboardingField";

const onboardingSchema = z.object({
  pharmacyName: z.string().trim().min(2, "Enter the pharmacy name.").max(80),
  address: z.string().trim().min(10, "Enter a complete address (at least 10 characters).").max(200),
  drugLicenseNumber: z.string().trim().regex(/^[A-Za-z0-9/-]{5,40}$/, "Use 5–40 letters, numbers, / or -."),
  pharmacistName: z.string().trim().min(2, "Enter the pharmacist name.").max(80),
  pharmacistLicenseNumber: z.string().trim().regex(/^[A-Za-z0-9/-]{5,40}$/, "Use 5–40 letters, numbers, / or -."),
  vendorName: z.string().trim().min(2, "Enter the vendor name.").max(80),
  vendorPhone: z.string().trim().regex(/^[6-9]\d{9}$/, "Use a 10-digit Indian mobile number, e.g. 9876543210."),
  lat: z.coerce.number().finite().min(-90).max(90),
  lng: z.coerce.number().finite().min(-180).max(180),
});

type FieldName = keyof PharmacyOnboardingInput;
type FieldConfig = { key: FieldName; label: string; placeholder: string; hint: string; type?: string };

const fields: FieldConfig[] = [
  { key: "pharmacyName", label: "Pharmacy name", placeholder: "e.g. Pradeep Medicals", hint: "2–80 characters" },
  { key: "address", label: "Full address", placeholder: "House no., street, area, city", hint: "Include locality and city" },
  { key: "drugLicenseNumber", label: "Drug licence number", placeholder: "e.g. AP/12345/2026", hint: "Letters, numbers, / and - only" },
  { key: "pharmacistName", label: "Pharmacist name", placeholder: "e.g. Dr. R. Kumar", hint: "Registered pharmacist" },
  { key: "pharmacistLicenseNumber", label: "Pharmacist licence number", placeholder: "e.g. A-12345", hint: "Letters, numbers, / and - only" },
  { key: "vendorName", label: "Vendor name", placeholder: "e.g. Pradeep Kumar", hint: "Vendor who will manage stock" },
  { key: "vendorPhone", label: "Vendor mobile number", type: "tel", placeholder: "9876543210", hint: "10-digit Indian mobile number" },
  { key: "lat", label: "Latitude", type: "number", placeholder: "17.3850", hint: "Between -90 and 90" },
  { key: "lng", label: "Longitude", type: "number", placeholder: "78.4867", hint: "Between -180 and 180" },
];

const emptyValues = (): Record<FieldName, string> => ({} as Record<FieldName, string>);

export function PharmacyOnboardingPanel({ token }: { token: string }) {
  const [values, setValues] = useState<Record<FieldName, string>>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeField(event: ChangeEvent<HTMLInputElement>) {
    const key = event.target.name as FieldName;
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setSubmitError("");
    const result = onboardingSchema.safeParse(values);

    if (!result.success) {
      setErrors(Object.fromEntries(Object.entries(result.error.flatten().fieldErrors).map(([key, messages]) => [key, messages?.[0]])));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const created = await adminOperations.createPharmacy(token, result.data);
      setNotice(`Pharmacy created. Vendor phone: ${created.vendorPhone}. Temporary password: ${created.temporaryPassword}`);
      setValues(emptyValues());
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create pharmacy.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-7">
      <p className="text-sm font-bold tracking-wide text-emerald-600">PHARMACY ONBOARDING</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-950">Create pharmacy and vendor</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Enter the pharmacy licence details, its location, and the vendor account that will manage stock.</p>

      <form noValidate onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <section className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-bold text-slate-900">Pharmacy details</h3>
          {fields.slice(0, 5).map((field) => <OnboardingField key={field.key} label={field.label} name={field.key} placeholder={field.placeholder} hint={field.hint} type={field.type} value={values[field.key] ?? ""} error={errors[field.key]} onChange={changeField} />)}
        </section>
        <section className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <h3 className="sm:col-span-2 text-sm font-bold text-slate-900">Vendor account and location</h3>
          {fields.slice(5).map((field) => <OnboardingField key={field.key} label={field.label} name={field.key} placeholder={field.placeholder} hint={field.hint} type={field.type} value={values[field.key] ?? ""} error={errors[field.key]} onChange={changeField} />)}
        </section>
        {submitError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">{notice}</p>}
        <button disabled={isSubmitting} className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
          {isSubmitting ? "Creating pharmacy…" : "Create pharmacy"}
        </button>
      </form>
    </section>
  );
}