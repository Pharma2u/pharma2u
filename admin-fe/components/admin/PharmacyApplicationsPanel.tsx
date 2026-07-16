"use client";
import { useCallback, useEffect, useState } from "react";
import { adminOperations, type PharmacyApplication } from "@/lib/operationsApi";
export function PharmacyApplicationsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<PharmacyApplication[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setError("");
      setItems((await adminOperations.pharmacyApplications(token)).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load applications.");
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);
  async function approve(id: string) {
    setBusy(id);
    try {
      const result = await adminOperations.approvePharmacyApplication(
        token,
        id,
      );
      setNotice(
        `Approved. Owner phone: ${result.ownerPhone}. Temporary password: ${result.temporaryPassword}`,
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
      await adminOperations.rejectPharmacyApplication(token, id, reason.trim());
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
      <h2 className="mt-2 text-2xl font-bold">Pharmacy owner applications</h2>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
      <div className="mt-5 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-500">
            No pending pharmacy applications.
          </p>
        )}
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-slate-200 p-4"
          >
            <h3 className="font-bold">{item.pharmacyName}</h3>
            <p className="text-sm text-slate-600">
              Owner: {item.ownerName} · {item.ownerPhone}
            </p>
            <p className="text-sm text-slate-600">{item.address}</p>
            <div className="mt-3 flex gap-4 text-sm text-emerald-700">
              <a href={item.drugLicenseUrl} target="_blank" rel="noreferrer">
                Drug licence
              </a>
              <a
                href={item.pharmacistLicenseUrl}
                target="_blank"
                rel="noreferrer"
              >
                Pharmacist licence
              </a>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                disabled={busy === item.id}
                onClick={() => void approve(item.id)}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold"
              >
                Approve
              </button>
              <button
                disabled={busy === item.id}
                onClick={() => void reject(item.id)}
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
