"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { getMyPharmacy, updateMyPharmacyProfile, type Pharmacy } from "@/lib/authApi";

export function VendorSettingsPanel({ token }: { token: string }) {
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getMyPharmacy(token)
      .then((profile) => active && setPharmacy(profile))
      .catch((cause) => active && setError(cause instanceof Error ? cause.message : "Unable to load pharmacy settings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setMessage(""); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await updateMyPharmacyProfile(token, {
        name: String(form.get("name")).trim(),
        address: String(form.get("address")).trim(),
        openingTime: String(form.get("openingTime")),
        closingTime: String(form.get("closingTime")),
        drugLicenseNumber: String(form.get("drugLicenseNumber")).trim(),
        pharmacistName: String(form.get("pharmacistName")).trim(),
        pharmacistLicenseNumber: String(form.get("pharmacistLicenseNumber")).trim(),
        lat: Number(form.get("lat")), lng: Number(form.get("lng")),
        operatingDays: form.getAll("operatingDays").map(String),
      });
      setPharmacy(updated); setMessage("Pharmacy profile saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save pharmacy profile.");
    } finally { setSaving(false); }
  }

  function useCurrentLocation(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!("geolocation" in navigator)) { setError("Location is not supported by this device."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const form = document.querySelector<HTMLFormElement>("#pharmacy-profile-form");
        if (form) {
          (form.elements.namedItem("lat") as HTMLInputElement).value = String(position.coords.latitude);
          (form.elements.namedItem("lng") as HTMLInputElement).value = String(position.coords.longitude);
        }
        setLocating(false); setMessage("Current location captured. Save the profile to apply it.");
      },
      () => { setLocating(false); setError("Unable to access your location. Check browser permissions."); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  if (loading) return <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white"><LoaderCircle className="animate-spin text-teal-700" size={24} /></div>;
  if (!pharmacy) return <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error || "Pharmacy not found."}</p>;

  const fields = [
    ["name", "Pharmacy name", pharmacy.name], ["address", "Full address", pharmacy.address],
    ["drugLicenseNumber", "Drug licence number", pharmacy.drugLicenseNumber], ["pharmacistName", "Pharmacist name", pharmacy.pharmacistName],
    ["pharmacistLicenseNumber", "Pharmacist licence number", pharmacy.pharmacistLicenseNumber],
    ["openingTime", "Opening time", pharmacy.openingTime ?? "09:00"], ["closingTime", "Closing time", pharmacy.closingTime ?? "21:00"],
  ];

  return (
    <section className="mt-6 max-w-4xl">
      <form id="pharmacy-profile-form" onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><MapPin size={21} /></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">Pharmacy profile</p><h2 className="mt-1 text-xl font-bold text-slate-950">Business details and location</h2><p className="mt-1 text-sm leading-6 text-slate-500">Update the information customers and delivery riders use for this pharmacy.</p></div></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, value]) => <label key={name} className="grid gap-1 text-sm font-semibold text-slate-700">{label}<input name={name} required type={name.includes("Time") ? "time" : "text"} defaultValue={value} className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /></label>)}
          <div className="sm:col-span-2"><p className="text-sm font-semibold text-slate-700">Map coordinates</p><div className="mt-1 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><input name="lat" required type="number" step="any" min="-90" max="90" defaultValue={pharmacy.lat ?? ""} placeholder="Latitude" className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /><input name="lng" required type="number" step="any" min="-180" max="180" defaultValue={pharmacy.lng ?? ""} placeholder="Longitude" className="rounded-xl border border-slate-200 px-3 py-2.5 font-normal" /><button type="button" onClick={useCurrentLocation} className="rounded-xl border border-teal-200 px-3 py-2.5 text-sm font-bold text-teal-700">{locating ? "Locating..." : "Use my location"}</button></div><p className="mt-1 text-xs text-slate-500">Used for nearby searches and delivery routing.</p></div>
          <fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-slate-700">Operating days</legend><div className="mt-2 flex flex-wrap gap-3">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <label key={day} className="flex items-center gap-1.5 text-sm text-slate-600"><input name="operatingDays" type="checkbox" value={day} defaultChecked={pharmacy.operatingDays.includes(day)} />{day}</label>)}</div></fieldset>
        </div>
        {(error || message) && <p role={error ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}
        <div className="mt-6 flex justify-end"><button disabled={saving} className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? "Saving..." : "Save pharmacy profile"}</button></div>
      </form>
    </section>
  );
}
