"use client";
import { useCallback, useEffect, useState } from "react";
import { adminOperations } from "@/lib/operationsApi";
type Rider = {
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
};
export function RiderApplicationsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Rider[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setError("");
      setItems((await adminOperations.pending(token)).items);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load rider applications.",
      );
    }
  }, [token]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function approve(id: string) {
    setBusy(id);
    try {
      const r = await adminOperations.approve(token, id);
      setNotice(
        `Approved. Rider phone: ${r.phone}. Temporary password: ${r.temporaryPassword}`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to approve.");
    } finally {
      setBusy(null);
    }
  }
  async function reject(id: string) {
    const reason = window.prompt("Rejection reason");
    if (!reason?.trim()) return;
    setBusy(id);
    try {
      await adminOperations.reject(token, id, reason.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to reject.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-wide text-emerald-600">
        COMPLIANCE
      </p>
      <h2 className="mt-2 text-2xl font-bold">Rider applications</h2>
      <p className="mt-2 text-sm text-slate-500">
        Review identity documents before enabling delivery access.
      </p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
      <div className="mt-5 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-500">
            No pending rider applications.
          </p>
        )}
        {items.map((i) => (
          <article
            key={i.id}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <h3 className="font-bold">{i.name}</h3>
            <p className="text-sm text-slate-600">
              {i.phone} · {i.kyc?.vehicleType ?? "Vehicle pending"}
            </p>
            {i.kyc && (
              <div className="mt-3 flex gap-4 text-sm text-emerald-700">
                <a target="_blank" rel="noreferrer" href={i.kyc.aadharImageUrl}>
                  Aadhaar
                </a>
                <a target="_blank" rel="noreferrer" href={i.kyc.panImageUrl}>
                  PAN
                </a>
                <a target="_blank" rel="noreferrer" href={i.kyc.dlImageUrl}>
                  Licence
                </a>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                disabled={busy === i.id}
                onClick={() => void approve(i.id)}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold"
              >
                Approve
              </button>
              <button
                disabled={busy === i.id}
                onClick={() => void reject(i.id)}
                className="rounded-xl border px-3 py-2 text-sm font-semibold text-red-700"
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
