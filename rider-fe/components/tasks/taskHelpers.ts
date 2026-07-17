import type { RiderTask } from "@/lib/api";

export const formatMoney = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format;

export function getPickup(task: RiderTask) {
  return task.leg === "relay" ? task.relayPharmacy : task.pharmacy;
}

export function getDestination(task: RiderTask) {
  if (task.dropLat != null && task.dropLng != null) {
    return `${task.dropLat},${task.dropLng}`;
  }
  return task.dropAddress;
}

export function googleMapsSearch(query?: string) {
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

export function googleMapsDirections(destination?: string) {
  return destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : null;
}

export function taskStatusLabel(task: RiderTask) {
  if (task.leg === "relay") return "Relay handoff";
  return task.status.replaceAll("_", " ");
}

export function nextTaskAction(task: RiderTask) {
  if (task.leg === "relay") {
    return task.status === "relay_pending" ? "Confirm handoff" : null;
  }
  if (task.status === "rider_assigned") return "Confirm pickup";
  if (task.status === "picked_up" || task.status === "relay_pending") {
    return "Start delivery";
  }
  if (task.status === "on_the_way") return "Mark delivered";
  return null;
}
