"use client";

import { useCallback, useEffect, useState } from "react";
import { adminOperations } from "@/lib/operationsApi";
import { FleetMap } from "@/components/admin/FleetMap";

type FleetRider = Awaited<
  ReturnType<typeof adminOperations.fleet>
>["items"][number];

export function FleetPanel({ token }: { token: string }) {
  const [riders, setRiders] = useState<FleetRider[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "online"
  >("all");
  const [activeOnly, setActiveOnly] = useState(false);

  const loadFleet = useCallback(async () => {
    setError("");
    try {
      setRiders((await adminOperations.fleet(token)).items);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to load fleet.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadFleet, 0);
    const intervalId = window.setInterval(loadFleet, 15_000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadFleet]);

  const online = riders.filter(
    (rider) => rider.availability === "online",
  ).length;
  const active = riders.filter(
    (rider) => rider.ordersAsRider.length > 0,
  ).length;
  const visibleRiders = riders.filter(
    (rider) =>
      (availabilityFilter === "all" || rider.availability === "online") &&
      (!activeOnly || rider.ordersAsRider.length > 0),
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Approved riders" value={riders.length} />
        <Metric label="Online now" value={online} accent="green" />
        <Metric label="Active deliveries" value={active} accent="amber" />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-emerald-600">
              LIVE FLEET
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Rider availability and active orders
            </h2>
          </div>
          <button
            onClick={() => void loadFleet()}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => setAvailabilityFilter("all")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${availabilityFilter === "all" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700"}`}
          >
            All riders
          </button>
          <button
            onClick={() => setAvailabilityFilter("online")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${availabilityFilter === "online" ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-700"}`}
          >
            Online only
          </button>
          <button
            onClick={() => setActiveOnly((value) => !value)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${activeOnly ? "bg-amber-500 text-slate-950" : "border border-slate-200 text-slate-700"}`}
          >
            Active deliveries only
          </button>
        </div>

        <div className="mt-5">
          <FleetMap riders={visibleRiders} />
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading rider fleet...
          </p>
        ) : visibleRiders.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No approved riders yet.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {visibleRiders.map((rider) => (
              <article
                key={rider.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {rider.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {rider.phone} ·{" "}
                      {rider.riderKyc?.vehicleType ?? "Vehicle pending"}
                      {rider.riderKyc?.vehicleNumber
                        ? ` · ${rider.riderKyc.vehicleNumber}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${rider.availability === "online" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {rider.availability}
                  </span>
                </div>
                {rider.ordersAsRider.length > 0 ? (
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    {rider.ordersAsRider.map((order) => (
                      <p key={order.id}>
                        {order.orderCode} · {order.status.replaceAll("_", " ")}{" "}
                        · {order.pharmacy.name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No active delivery.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "green" | "amber";
}) {
  const colors =
    accent === "green"
      ? "border-emerald-100 bg-emerald-50"
      : accent === "amber"
        ? "border-amber-100 bg-amber-50"
        : "border-slate-200 bg-white";
  return (
    <article className={`rounded-3xl border p-5 ${colors}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </article>
  );
}
