import { RiderIcon } from "@/components/ui/RiderIcon";
import type { RiderTask } from "@/lib/api";
import {
  formatMoney,
  getDestination,
  getPickup,
  googleMapsDirections,
  googleMapsSearch,
  nextTaskAction,
  taskStatusLabel,
} from "./taskHelpers";

type Props = {
  task: RiderTask;
  isActive?: boolean;
  isBusy: boolean;
  onAccept: (task: RiderTask) => void;
  onAdvance: (task: RiderTask) => void;
};

export function TaskCard({
  task,
  isActive = false,
  isBusy,
  onAccept,
  onAdvance,
}: Props) {
  const pickup = getPickup(task);
  const destination = getDestination(task);
  const pickupMapUrl = googleMapsSearch(pickup?.address);
  const navigationUrl = googleMapsDirections(destination);
  const nextAction = nextTaskAction(task);

  return (
    <article className="delivery-card">
      <div className="delivery-card-top">
        <div>
          <span className={`delivery-status status-${task.status}`}>
            {taskStatusLabel(task)}
          </span>
          <h3>{task.orderCode}</h3>
        </div>
        <div className="delivery-price">
          <strong>{formatMoney(task.total)}</strong>
          <small>
            {task.paymentMethod === "cod" ? "Cash on delivery" : "Prepaid"}
          </small>
        </div>
      </div>

      <div className="delivery-route">
        <RouteStop
          kind="pickup"
          label="Pickup from"
          title={pickup?.name ?? "Pickup pharmacy"}
          detail={pickup?.address}
        />
        <RouteStop
          kind="drop"
          label="Deliver to"
          title={
            isActive
              ? (task.dropAddress ?? "Customer address unavailable")
              : "Address shown after acceptance"
          }
          detail={isActive ? task.deliveryInstructions : undefined}
        />
      </div>

      <div className="delivery-items">
        <div className="delivery-items-title">
          <RiderIcon name="package" />
          <span>
            {task.items.length} order item{task.items.length === 1 ? "" : "s"}
          </span>
        </div>
        <p>
          {task.items.map((item) => `${item.name} x ${item.qty}`).join(", ")}
        </p>
      </div>

      {task.isRelay && (
        <p className="relay-note">
          <RiderIcon name="route" />
          Multi-pharmacy relay delivery
        </p>
      )}

      {isActive && destination && (
        <div className="destination-strip">
          <span>
            <RiderIcon name="map" />
          </span>
          <div>
            <strong>Navigation is ready</strong>
            <small>
              {task.dropLat != null && task.dropLng != null
                ? `${task.dropLat.toFixed(5)}, ${task.dropLng.toFixed(5)}`
                : "Using the customer delivery address"}
            </small>
          </div>
        </div>
      )}

      <div className="delivery-actions">
        {isActive && pickupMapUrl && (
          <MapLink href={pickupMapUrl} label="Pickup map" icon="map" />
        )}
        {isActive && navigationUrl && (
          <MapLink href={navigationUrl} label="Navigate" icon="navigation" />
        )}
        {isActive ? (
          nextAction && (
            <button
              type="button"
              className="delivery-primary-action"
              disabled={isBusy}
              onClick={() => onAdvance(task)}
            >
              {isBusy ? "Updating..." : nextAction}
            </button>
          )
        ) : (
          <button
            type="button"
            className="delivery-primary-action"
            disabled={isBusy}
            onClick={() => onAccept(task)}
          >
            {isBusy ? "Accepting..." : "Accept delivery"}
          </button>
        )}
      </div>
    </article>
  );
}

function RouteStop({
  kind,
  label,
  title,
  detail,
}: {
  kind: "pickup" | "drop";
  label: string;
  title: string;
  detail?: string | null;
}) {
  return (
    <div className={`route-stop ${kind}`}>
      <span className="route-marker" />
      <div>
        <small>{label}</small>
        <strong>{title}</strong>
        {detail && <p>{kind === "drop" ? `Note: ${detail}` : detail}</p>}
      </div>
    </div>
  );
}

function MapLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: "map" | "navigation";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="delivery-map-action"
    >
      <RiderIcon name={icon} />
      {label}
    </a>
  );
}
