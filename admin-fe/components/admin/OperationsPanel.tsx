"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperations } from "@/lib/operationsApi";

type Pharmacy = {
  id: string;
  name: string;
  vendor: { name: string; phone: string };
};

type PendingRider = {
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

export function OperationsPanel({ token }: { token: string }) {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [riders, setRiders] = useState<PendingRider[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [pharmacyResult, riderResult] = await Promise.all([
        adminOperations.pharmacies(token),
        adminOperations.pending(token),
      ]);
      setPharmacies(pharmacyResult.items);
      setRiders(riderResult.items);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadDashboard]);

  async function approve(id: string) {
    try {
      const rider = await adminOperations.approve(token, id);
      setNotice(
        `Rider ${rider.phone} approved. Temporary password: ${rider.temporaryPassword}`, 
      );
      await loadDashboard();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to approve rider.",
      );
    }
  }


  
  async function reject(id: string) {
    const reason = window.prompt("Enter the reason for rejection");
    if (!reason?.trim()) return;

    try {
      await adminOperations.reject(token, id, reason.trim());
      setNotice("Rider application rejected.");
      await loadDashboard();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to reject rider.",
      );
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Registered pharmacies"
          value={pharmacies.length}
          detail="Active vendor locations"
        />
        <Metric
          label="Pending rider reviews"
          value={riders.length}
          detail="Applications needing action"
          accent="amber"
        />
        <Metric
          label="Review status"
          value={riders.length ? "Action needed" : "Up to date"}
          detail={
            riders.length
              ? "Open rider applications"
              : "No pending applications"
          }
          accent={riders.length ? "amber" : "green"}
        />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">
                NETWORK
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Pharmacy partners
              </h2>
            </div>
            <button
              onClick={() => void loadDashboard()}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {loading && (
              <p className="py-6 text-sm text-slate-500">
                Loading pharmacy network...
              </p>
            )}
            {!loading && pharmacies.length === 0 && (
              <p className="py-6 text-sm text-slate-500">
                No pharmacies have been onboarded yet.
              </p>
            )}
            {pharmacies.map((pharmacy) => (
              <article
                key={pharmacy.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {pharmacy.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                     {pharmacy.vendor.name} - {pharmacy.vendor.phone}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  Vendor linked
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">
              COMPLIANCE QUEUE
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Rider applications
            </h2>
          </div>
          <div className="mt-5 space-y-4">
            {loading && (
              <p className="py-6 text-sm text-slate-500">
                Loading applications...
              </p>
            )}
            {!loading && riders.length === 0 && (
              <p className="py-6 text-sm text-slate-500">
                All rider applications are reviewed.
              </p>
            )}
            {riders.map((rider) => (
              <article
                key={rider.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {rider.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                       {rider.phone} -{" "}
                      {rider.kyc?.vehicleType ?? "Vehicle pending"}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    Pending
                  </span>
                </div>
                {rider.kyc && (
                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-emerald-700">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={rider.kyc.aadharImageUrl}
                    >
                      Aadhaar
                    </a>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={rider.kyc.panImageUrl}
                    >
                      PAN
                    </a>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={rider.kyc.dlImageUrl}
                    >
                      Licence
                    </a>
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => void approve(rider.id)}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => void reject(rider.id)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = "green",
}: {
  label: string;
  value: string | number;
  detail: string;
  accent?: "green" | "amber";
}) {
  const colors =
    accent === "amber"
      ? "border-amber-100 bg-amber-50 text-amber-700"
      : "border-emerald-100 bg-emerald-50 text-emerald-700";
  return (
    <article className={`rounded-3xl border p-5 ${colors}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-sm opacity-80">{detail}</p>
    </article>
  );
}
