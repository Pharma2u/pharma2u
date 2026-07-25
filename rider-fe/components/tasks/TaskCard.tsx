"use client";

import { useState } from "react";
import {
  Banknote,
  Bike,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { RiderTask } from "@/lib/api";
import {
  formatMoney,
  getPickup,
  googleMapsDirections,
  nextTaskAction,
  taskStatusLabel,
} from "./taskHelpers";
import { MapboxNavigationPanel } from "./MapboxNavigationPanel";

type Props = {
  task: RiderTask;
  isActive?: boolean;
  isBusy: boolean;
  onAccept: (task: RiderTask) => void;
  onAdvance: (
    task: RiderTask,
    deliveryOtp?: string,
    pickupOtp?: string,
  ) => void;
};

export function TaskCard({
  task,
  isActive = false,
  isBusy,
  onAccept,
  onAdvance,
}: Props) {
  const [pickupOtp, setPickupOtp] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const pickup = getPickup(task);
  const relay = task.leg === "relay";
  const nextAction = nextTaskAction(task);
  const needsPickupOtp = isActive && !relay && task.status === "rider_assigned";
  const needsDeliveryOtp = isActive && !relay && task.status === "on_the_way";
  const otpReady =
    (!needsPickupOtp && !needsDeliveryOtp) ||
    pickupOtp.length === 6 ||
    deliveryOtp.length === 6;
  const destination =
    relay || task.status === "rider_assigned"
      ? pickup?.address
      : task.dropLat != null && task.dropLng != null
        ? `${task.dropLat},${task.dropLng}`
        : task.dropAddress;
  const mapsUrl = googleMapsDirections(destination ?? undefined);

  if (!isActive) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.04)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
              {relay ? "Relay job" : "New delivery"}
            </span>
            <h3 className="mt-1 truncate text-base font-extrabold text-slate-950">
              {pickup?.name ?? "Pickup pharmacy"}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {pickup?.address}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <small className="text-[9px] font-bold text-slate-400">EARN</small>
            <strong className="block text-lg text-emerald-700">
              {formatMoney(task.riderEarning)}
            </strong>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
            <Package className="mr-1 inline" size={13} />
            {task.items.reduce((sum, item) => sum + item.qty, 0)} items
          </span>
          <span
            className={`rounded-lg px-2.5 py-1.5 ${task.paymentMethod === "cod" ? "bg-amber-50 text-amber-800" : "bg-blue-50 text-blue-700"}`}
          >
            {task.paymentMethod === "cod"
              ? `${formatMoney(task.collectionAmount)} COD`
              : "Prepaid"}
          </span>
          {relay && (
            <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">
              Relay handoff
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onAccept(task)}
          className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {isBusy ? "Accepting job..." : "Accept delivery"}
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          Customer details unlock only after acceptance
        </p>
      </article>
    );
  }

  const stage = relay
    ? task.status === "relay_pending"
      ? 1
      : 0
    : task.status === "rider_assigned"
      ? 0
      : task.status === "on_the_way"
        ? 2
        : 1;
  const stages = relay
    ? ["Reach relay point", "Confirm handoff"]
    : ["Pick up", "Start trip", "Deliver"];

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,.07)]">
      <header className="bg-slate-950 p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-300">
              {taskStatusLabel(task)}
            </span>
            <h3 className="mt-1 text-xl font-extrabold">{task.orderCode}</h3>
          </div>
          <div className="text-right">
            <small className="text-[9px] font-bold text-slate-400">
              YOUR EARNING
            </small>
            <strong className="block text-lg text-emerald-300">
              {formatMoney(task.riderEarning)}
            </strong>
          </div>
        </div>
        <ol className="mt-5 flex" aria-label="Delivery progress">
          {stages.map((label, index) => (
            <li
              key={label}
              className="relative flex flex-1 flex-col gap-1.5 text-[9px] font-semibold text-slate-400 last:flex-none"
            >
              <span
                className={`z-10 grid h-6 w-6 place-items-center rounded-full border ${index < stage ? "border-emerald-400 bg-emerald-400 text-slate-950" : index === stage ? "border-white bg-white text-slate-950" : "border-slate-600 bg-slate-900"}`}
              >
                {index < stage ? <Check size={13} /> : index + 1}
              </span>
              <span className={index === stage ? "text-white" : ""}>
                {label}
              </span>
              {index < stages.length - 1 && (
                <i
                  className={`absolute left-6 right-0 top-3 h-px ${index < stage ? "bg-emerald-400" : "bg-slate-700"}`}
                />
              )}
            </li>
          ))}
        </ol>
      </header>
      <div className="p-4 sm:p-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
            {relay
              ? "Relay point"
              : task.status === "rider_assigned"
                ? "Go to pickup"
                : "Deliver to"}
          </p>
          <div className="mt-2 flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
              {relay || task.status === "rider_assigned" ? (
                <Bike size={18} />
              ) : (
                <MapPin size={18} />
              )}
            </span>
            <div className="min-w-0">
              <strong className="block text-sm text-slate-900">
                {relay || task.status === "rider_assigned"
                  ? pickup?.name
                  : task.dropAddress}
              </strong>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {relay || task.status === "rider_assigned"
                  ? pickup?.address
                  : task.deliveryInstructions ||
                    "Hand the sealed package to the customer."}
              </p>
            </div>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200"
            >
              <Navigation size={17} className="text-emerald-600" />
              Open in Maps
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        {task.paymentMethod === "cod" && !relay && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <span className="flex items-center gap-2 font-semibold">
              <Banknote size={17} />
              Collect cash
            </span>
            <strong>{formatMoney(task.collectionAmount)}</strong>
          </div>
        )}
        {relay && task.status === "rider_assigned" && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-xs leading-5 text-violet-700">
            <Route size={17} className="shrink-0" />
            Wait here. The handoff button will unlock when the primary rider
            arrives.
          </p>
        )}
        {(needsPickupOtp || needsDeliveryOtp) && (
          <OtpField
            id={`${needsPickupOtp ? "pickup" : "delivery"}-${task.id}`}
            label={
              needsPickupOtp
                ? "Pickup verification code"
                : "Customer delivery OTP"
            }
            value={needsPickupOtp ? pickupOtp : deliveryOtp}
            onChange={needsPickupOtp ? setPickupOtp : setDeliveryOtp}
            hint={
              needsPickupOtp
                ? "Ask pharmacy staff for the 6-digit code."
                : "Verify the code before handing over the medicine."
            }
          />
        )}
        {!relay &&
          task.status !== "rider_assigned" &&
          task.dropLat != null &&
          task.dropLng != null && (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setMapOpen((value) => !value)}
                className="flex w-full items-center justify-between p-3 text-left text-xs font-bold text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Navigation size={16} className="text-emerald-600" />
                  Live route preview
                </span>
                {mapOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {mapOpen && (
                <MapboxNavigationPanel
                  destination={{ lat: task.dropLat, lng: task.dropLng }}
                />
              )}
            </div>
          )}
        <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
          <ShieldCheck size={14} />
          Only share customer details for this delivery.
        </div>
        {nextAction && (
          <button
            type="button"
            disabled={isBusy || !otpReady}
            onClick={() => onAdvance(task, deliveryOtp, pickupOtp)}
            className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isBusy ? "Updating delivery..." : nextAction}
          </button>
        )}
      </div>
    </article>
  );
}

function OtpField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
}) {
  return (
    <label
      htmlFor={id}
      className="mt-3 block rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs font-bold text-slate-800"
    >
      {label}
      <input
        id={id}
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ""))}
        className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-xl tracking-[.4em] outline-none focus:border-emerald-500"
        placeholder="000000"
      />
      <small className="mt-2 block font-normal text-slate-500">{hint}</small>
    </label>
  );
}
