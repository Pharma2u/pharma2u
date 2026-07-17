import { RiderIcon } from "@/components/ui/RiderIcon";

type Props = {
  isOnline: boolean;
  message: string;
  onToggle: () => void;
};

export function AvailabilityPanel({ isOnline, message, onToggle }: Props) {
  return (
    <section className={`availability-panel ${isOnline ? "is-online" : ""}`}>
      <div className="availability-main">
        <span className="availability-icon">
          <RiderIcon name="location" />
          <i aria-hidden="true" />
        </span>
        <div>
          <div className="availability-title">
            <h2>
              {isOnline ? "Online and discoverable" : "Currently offline"}
            </h2>
            <span>{isOnline ? "LIVE" : "OFFLINE"}</span>
          </div>
          <p>{message}</p>
        </div>
      </div>
      <button
        type="button"
        className={
          isOnline ? "availability-button offline" : "availability-button"
        }
        onClick={onToggle}
      >
        {isOnline ? "Go offline" : "Start duty"}
      </button>
    </section>
  );
}
