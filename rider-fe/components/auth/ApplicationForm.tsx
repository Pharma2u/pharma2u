"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Bike, Check, FileCheck2, IdCard, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { applyForRider } from "@/lib/api";

type Values = {
  name: string; phone: string; aadharNumber: string; panNumber: string;
  drivingLicenseNumber: string; vehicleType: string; vehicleNumber: string;
};
const initialValues: Values = { name: "", phone: "", aadharNumber: "", panNumber: "", drivingLicenseNumber: "", vehicleType: "bike", vehicleNumber: "" };
const steps = [
  { label: "Personal", icon: UserRound },
  { label: "Identity", icon: IdCard },
  { label: "Vehicle", icon: Bike },
  { label: "Review", icon: FileCheck2 },
];

export function ApplicationForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [files, setFiles] = useState<Record<string, File | null>>({ aadharImage: null, panImage: null, dlImage: null });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key: keyof Values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  function validateCurrent() {
    if (step === 0 && (!values.name.trim() || !/^[6-9]\d{9}$/.test(values.phone))) return "Enter your full name and a valid mobile number.";
    if (step === 1 && (!/^\d{12}$/.test(values.aadharNumber) || !/^[A-Z]{5}\d{4}[A-Z]$/.test(values.panNumber) || !files.aadharImage || !files.panImage)) return "Complete Aadhaar and PAN details and upload both documents.";
    if (step === 2 && (!values.drivingLicenseNumber.trim() || !values.vehicleNumber.trim() || !files.dlImage)) return "Complete vehicle details and upload your driving licence.";
    return "";
  }
  function next() {
    const issue = validateCurrent();
    if (issue) return setError(issue);
    setError("");
    setStep((current) => Math.min(3, current + 1));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData();
    Object.entries(values).forEach(([key, value]) => form.set(key, value));
    Object.entries(files).forEach(([key, value]) => { if (value) form.set(key, value); });
    try {
      await applyForRider(form);
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit application.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-950/5 sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={30} /></span>
      <h2 className="mt-5 text-2xl font-bold text-slate-950">Application submitted</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Your documents are now passing through the identity, licence, and logistics verification channels.</p>
      <div className="mt-7 grid gap-3 text-left sm:grid-cols-3">
        {["Identity review", "Licence review", "Logistics approval"].map((label, index) => <div key={label} className="rounded-2xl bg-slate-50 p-4"><span className="text-xs font-bold text-amber-600">STEP {index + 1}</span><p className="mt-1 text-sm font-semibold text-slate-800">{label}</p><small className="text-slate-500">Pending</small></div>)}
      </div>
    </section>
  );

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 sm:p-8">
      <div className="flex items-start gap-3"><span className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><ShieldCheck size={22} /></span><div><h2 className="text-xl font-bold text-slate-950">Become a delivery partner</h2><p className="mt-1 text-sm text-slate-500">Secure, guided onboarding in four short steps.</p></div></div>
      <ol className="mt-7 grid grid-cols-4 gap-2" aria-label="Application progress">
        {steps.map((item, index) => { const Icon = item.icon; return <li key={item.label} className={`${index <= step ? "text-emerald-700" : "text-slate-400"}`}><div className={`flex h-9 items-center justify-center rounded-xl ${index <= step ? "bg-emerald-100" : "bg-slate-100"}`}>{index < step ? <Check size={17} /> : <Icon size={17} />}</div><span className="mt-1.5 block truncate text-center text-[10px] font-bold sm:text-xs">{item.label}</span></li>; })}
      </ol>
      <form onSubmit={submit} className="mt-7">
        {step === 0 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" value={values.name} onChange={(v) => update("name", v)} /><Field label="Mobile number" value={values.phone} onChange={(v) => update("phone", v.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" /></div>}
        {step === 1 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Aadhaar number" value={values.aadharNumber} onChange={(v) => update("aadharNumber", v.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" /><Upload label="Aadhaar image" onChange={(file) => setFiles((c) => ({ ...c, aadharImage: file }))} /><Field label="PAN number" value={values.panNumber} onChange={(v) => update("panNumber", v.toUpperCase().slice(0, 10))} /><Upload label="PAN image" onChange={(file) => setFiles((c) => ({ ...c, panImage: file }))} /></div>}
        {step === 2 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Driving licence number" value={values.drivingLicenseNumber} onChange={(v) => update("drivingLicenseNumber", v.toUpperCase())} /><Upload label="Driving licence image" onChange={(file) => setFiles((c) => ({ ...c, dlImage: file }))} /><label className="text-sm font-semibold text-slate-700">Vehicle type<select value={values.vehicleType} onChange={(e) => update("vehicleType", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"><option value="bike">Bike</option><option value="scooter">Scooter</option><option value="motorcycle">Motorcycle</option><option value="bicycle">Bicycle</option><option value="car">Car</option></select></label><Field label="Vehicle registration" value={values.vehicleNumber} onChange={(v) => update("vehicleNumber", v.toUpperCase())} /></div>}
        {step === 3 && <div className="space-y-3 rounded-2xl bg-slate-50 p-5 text-sm"><Review label="Applicant" value={values.name} /><Review label="Mobile" value={values.phone} /><Review label="Identity documents" value="Aadhaar and PAN attached" /><Review label="Vehicle" value={`${values.vehicleType} · ${values.vehicleNumber}`} /><Review label="Driving licence" value={values.drivingLicenseNumber} /><p className="border-t border-slate-200 pt-3 text-xs leading-5 text-slate-500">By submitting, you confirm these details are accurate and consent to administrative and logistics verification.</p></div>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => { setError(""); setStep((c) => Math.max(0, c - 1)); }} disabled={step === 0} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 disabled:invisible"><ArrowLeft size={17} />Back</button>
          {step < 3 ? <button type="button" onClick={next} className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Continue<ArrowRight size={17} /></button> : <button disabled={busy} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy && <LoaderCircle className="animate-spin" size={17} />}{busy ? "Submitting..." : "Submit for verification"}</button>}
        </div>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "numeric" }) { return <label className="text-sm font-semibold text-slate-700">{label}<input required value={value} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label>; }
function Upload({ label, onChange }: { label: string; onChange: (file: File | null) => void }) { return <label className="text-sm font-semibold text-slate-700">{label}<input required type="file" accept="image/jpeg,image/png" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-xl border border-dashed border-slate-300 p-3 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700" /><small className="mt-1 block text-slate-400">JPEG or PNG, maximum 5 MB</small></label>; }
function Review({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><span className="text-slate-500">{label}</span><strong className="text-right text-slate-800">{value}</strong></div>; }
