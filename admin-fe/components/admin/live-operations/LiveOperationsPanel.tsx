"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  Activity,
  AlertTriangle,
  Bike,
  Clock3,
  MapPin,
  PackageCheck,
  Store,
  UsersRound,
} from "lucide-react";
import { LiveOperationsMap } from "./LiveOperationsMap";
import type { LiveOperationsData } from "./types";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
const socketUrl = apiBase.replace(/\/api\/?$/, "");
const blank: LiveOperationsData = {
  generatedAt: new Date().toISOString(),
  metrics: {
    ordersLive: 0,
    ordersWaiting: 0,
    ridersOnline: 0,
    ridersBusy: 0,
    ridersAvailable: 0,
    vendorsOpen: 0,
    delayedOrders: 0,
    criticalAlerts: 0,
  },
  riders: [],
  pharmacies: [],
  orders: [],
  delayedOrders: [],
  activities: [],
  criticalAlerts: [],
};
const statusLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const time = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export function LiveOperationsPanel({ token }: { token: string }) {
  const [data, setData] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const response = await fetch(`${apiBase}/admin/live-operations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Unable to load live operations.");
        setData((await response.json()) as LiveOperationsData);
        setError("");
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load live operations.",
        );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [token],
  );
  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const socket: Socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    const refresh = () => void load(true);
    socket.on("operations:rider-location", refresh);
    socket.on("operations:order-updated", refresh);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 30_000);
    return () => {
      window.clearTimeout(initial);
      socket.disconnect();
      window.clearInterval(interval);
    };
  }, [load, token]);
  const selectedRider =
    data.riders.find((item) => item.id === selectedRiderId) ?? null;
  const shownOrders = useMemo(
    () =>
      filter === "all"
        ? data.orders
        : data.orders.filter((order) => order.status === filter),
    [data.orders, filter],
  );
  const cards = [
    ["Orders live", data.metrics.ordersLive, PackageCheck, "emerald"],
    ["Orders waiting", data.metrics.ordersWaiting, Clock3, "amber"],
    ["Riders online", data.metrics.ridersOnline, Bike, "emerald"],
    ["Riders busy", data.metrics.ridersBusy, Bike, "violet"],
    ["Available riders", data.metrics.ridersAvailable, UsersRound, "blue"],
    ["Vendors open", data.metrics.vendorsOpen, Store, "emerald"],
    ["Delayed orders", data.metrics.delayedOrders, Clock3, "orange"],
    ["Critical alerts", data.metrics.criticalAlerts, AlertTriangle, "red"],
  ] as const;
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-950">
              Live Operations
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
              <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Realtime overview of orders, riders and pharmacy network.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Updated {time(data.generatedAt)}{" "}
          <button
            onClick={() => void load()}
            className="ml-2 font-semibold text-emerald-700"
          >
            Refresh
          </button>
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className={`rounded-xl p-2 live-icon-${tone}`}>
                <Icon size={18} />
              </span>
              <span className="text-xs text-slate-400">Live</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {loading ? "—" : value}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-bold text-slate-900">Live Map</h2>
              <p className="text-xs text-slate-500">
                Riders update automatically as locations arrive.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {data.metrics.ridersOnline} online
            </span>
          </div>
          <div className="relative h-[430px]">
            <LiveOperationsMap
              data={data}
              selectedRiderId={selectedRiderId}
              onSelectRider={setSelectedRiderId}
            />
            {selectedRider && (
              <aside className="absolute bottom-4 left-4 w-64 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
                <button
                  className="float-right text-slate-400"
                  onClick={() => setSelectedRiderId(null)}
                >
                  ×
                </button>
                <p className="font-bold text-slate-900">{selectedRider.name}</p>
                <p className="mt-1 text-xs capitalize text-emerald-700">
                  {selectedRider.status}
                </p>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <p>
                    Last position:{" "}
                    {selectedRider.location
                      ? time(selectedRider.location.updatedAt)
                      : "Unavailable"}
                  </p>
                  <p>
                    Current order:{" "}
                    {selectedRider.currentOrder?.orderCode ?? "No active order"}
                  </p>
                </div>
              </aside>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-slate-900">Live Activity Feed</h2>
            <Activity size={17} className="text-emerald-600" />
          </div>
          <div className="max-h-[430px] overflow-auto p-4">
            {data.activities.length ? (
              data.activities.map((item) => (
                <article
                  className="relative border-l border-emerald-200 pb-5 pl-4 last:pb-0"
                  key={item.id}
                >
                  <i className="absolute -left-1.5 top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-xs text-slate-400">{time(item.at)}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-700">
                    {item.message}
                  </p>
                </article>
              ))
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">
                No recent events.
              </p>
            )}
          </div>
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-900">Active Orders</h2>
            <select
              aria-label="Filter orders"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600"
            >
              <option value="all">All orders</option>
              <option value="awaiting_rider">Waiting</option>
              <option value="rider_assigned">Assigned</option>
              <option value="on_the_way">On delivery</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {[
                    "Order",
                    "Customer",
                    "Vendor",
                    "Rider",
                    "Status",
                    "ETA",
                  ].map((label) => (
                    <th className="px-4 py-3 font-semibold" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownOrders.slice(0, 8).map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 text-slate-700"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {order.orderCode}
                    </td>
                    <td className="px-4 py-3">{order.customer}</td>
                    <td className="px-4 py-3">{order.vendor}</td>
                    <td className="px-4 py-3">{order.rider ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.eta ? time(order.eta) : "—"}
                    </td>
                  </tr>
                ))}
                {!shownOrders.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No orders match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="font-bold text-slate-900">Emergency Alerts</h2>
            <span className="text-xs font-bold text-red-600">
              {data.metrics.criticalAlerts} critical
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.criticalAlerts.length ? (
              data.criticalAlerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 p-4">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {alert.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {alert.count} item{alert.count === 1 ? "" : "s"} needs
                      attention
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">
                No critical alerts.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
