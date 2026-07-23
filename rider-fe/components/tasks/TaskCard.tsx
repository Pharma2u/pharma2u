"use client";
import { useState } from "react";
import {
  Banknote,
  Bike,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  MapPin,
  Navigation,
  Package,
  Route,
  ShieldCheck,
} from "lucide-react";
import type { RiderTask } from "@/lib/api";
import {
  formatMoney,
  getDestination,
  getPickup,
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
  const destination = getDestination(task);
  const nextAction = nextTaskAction(task);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            {taskStatusLabel(task)}
          </span>
          <h3 className="mt-2 font-bold text-slate-950">{task.orderCode}</h3>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400">YOU EARN</span>
          <strong className="block text-lg text-emerald-700">
            {formatMoney(task.riderEarning)}
          </strong>
        </div>
      </div>
      {task.paymentMethod === "cod" ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 p-3">
          <span className="flex items-center gap-2 text-xs font-semibold text-amber-800">
            <Banknote size={17} />
            Cash to collect
          </span>
          <strong className="text-sm text-amber-900">
            {formatMoney(task.collectionAmount)}
          </strong>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-800">
          <CircleDollarSign size={17} />
          Prepaid · collect no cash
        </div>
      )}
      <div className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:border-l before:border-dashed before:border-slate-300">
        <Stop
          icon={<Bike size={14} />}
          label="PICKUP"
          title={pickup?.name ?? "Pickup pharmacy"}
          detail={pickup?.address}
          tone="bg-emerald-600"
        />
        <Stop
          icon={<MapPin size={14} />}
          label="DELIVER"
          title={
            isActive
              ? (task.dropAddress ?? "Delivery location")
              : "Address protected until acceptance"
          }
          detail={
            isActive
              ? task.deliveryInstructions
              : "Customer identity and contact details are hidden"
          }
          tone="bg-slate-950"
        />
      </div>
      <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Package size={16} />
          Sealed order · {task.items.reduce(
            (sum, item) => sum + item.qty,
            0,
          )}{" "}
          unit(s)
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-slate-400">
          {task.items.map((item) => `${item.name} × ${item.qty}`).join(", ")}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
          <ShieldCheck size={13} />
          Medicine prices and customer personal details are redacted
        </p>
      </div>
      {task.isRelay && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-xs font-semibold text-violet-700">
          <Route size={16} />
          Multi-pharmacy relay delivery
        </p>
      )}
      {isActive && destination && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            className="flex w-full items-center justify-between bg-white p-3 text-left"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Navigation size={17} className="text-emerald-600" />
              Live route & navigation
            </span>
            {mapOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {mapOpen && task.dropLat != null && task.dropLng != null && (
            <MapboxNavigationPanel
              destination={{ lat: task.dropLat, lng: task.dropLng }}
            />
          )}
        </div>
      )}
      {isActive && task.leg !== "relay" && task.status === "rider_assigned" && (
        <OtpField
          id={`pickup-${task.id}`}
          label="Pharmacy pickup code"
          value={pickupOtp}
          onChange={setPickupOtp}
          hint="Get the 6-digit code from pharmacy staff."
        />
      )}
      {isActive && task.leg !== "relay" && task.status === "on_the_way" && (
        <OtpField
          id={`delivery-${task.id}`}
          label="Customer delivery OTP"
          value={deliveryOtp}
          onChange={setDeliveryOtp}
          hint="Ask for the OTP before handing over the sealed package."
        />
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {isActive ? (
          nextAction && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onAdvance(task, deliveryOtp, pickupOtp)}
              className="min-w-36 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isBusy ? "Updating..." : nextAction}
            </button>
          )
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => onAccept(task)}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isBusy
              ? "Accepting..."
              : `Accept · earn ${formatMoney(task.riderEarning)}`}
          </button>
        )}
      </div>
    </article>
  );
}

function Stop({
  icon,
  label,
  title,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  detail?: string | null;
  tone: string;
}) {
  return (
    <div className="relative flex gap-3">
      <span
        className={`z-10 grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${tone}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <small className="text-[9px] font-bold tracking-[0.12em] text-slate-400">
          {label}
        </small>
        <strong className="block truncate text-sm text-slate-800">
          {title}
        </strong>
        {detail && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-slate-500">
            {detail}
          </p>
        )}
      </div>
    </div>
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
      className="mt-4 block rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700"
    >
      {label}
      <input
        id={id}
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg tracking-[0.35em] outline-none focus:border-emerald-500"
        placeholder="000000"
      />
      <small className="mt-1 block font-normal text-slate-400">{hint}</small>
    </label>
  );
}
