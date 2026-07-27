"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, Printer, ShieldCheck } from "lucide-react";
import {
  getVendorSettings,
  updateVendorSettings,
  type VendorSettings,
} from "@/lib/authApi";

const defaults: VendorSettings = {
  pharmacyId: "",
  printerUrl: null,
  autoPrint: true,
};

export function VendorSettingsPanel({ token }: { token: string }) {
  const [settings, setSettings] = useState<VendorSettings>(defaults);
  const [printerUrl, setPrinterUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getVendorSettings(token)
      .then((next) => {
        if (!active) return;
        setSettings(next);
        setPrinterUrl(next.printerUrl ?? "");
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load settings.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const saved = await updateVendorSettings(token, {
        printerUrl: printerUrl.trim(),
        autoPrint: settings.autoPrint,
      });
      setSettings(saved);
      setPrinterUrl(saved.printerUrl ?? "");
      setMessage("Vendor settings saved.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-slate-200 bg-white">
        <LoaderCircle className="animate-spin text-teal-700" size={24} />
      </div>
    );

  return (
    <section className="mt-6 grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <Printer size={21} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">
              Order printing
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Printer preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Configure the local print service used for eligible paid and COD orders.
            </p>
          </div>
        </div>

        <label className="mt-7 block text-sm font-semibold text-slate-700">
          Printer service URL
          <input
            type="url"
            value={printerUrl}
            onChange={(event) => setPrinterUrl(event.target.value)}
            placeholder="http://localhost:9100/print"
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
            Leave blank to disable printing. Use only a printer service managed by your pharmacy.
          </span>
        </label>

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
          <span>
            <strong className="block text-sm text-slate-800">Automatically print new orders</strong>
            <span className="mt-1 block text-xs text-slate-500">
              Prints eligible orders once they appear in your order queue.
            </span>
          </span>
          <input
            type="checkbox"
            checked={settings.autoPrint}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                autoPrint: event.target.checked,
              }))
            }
            className="h-5 w-5 accent-teal-700"
          />
        </label>

        {(error || message) && (
          <p
            role={error ? "alert" : "status"}
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {error || message}
          </p>
        )}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      <aside className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
        <ShieldCheck className="text-emerald-700" size={22} />
        <h2 className="mt-4 font-bold text-slate-900">Vendor-only controls</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These settings apply only to this pharmacy. They cannot change the global company logo, customer experience, or another vendor’s workspace.
        </p>
        <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 size={15} /> Stored for your pharmacy account
        </p>
      </aside>
    </section>
  );
}
