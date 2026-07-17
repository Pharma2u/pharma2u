import { RiderIcon, type RiderIconName } from "@/components/ui/RiderIcon";
import { formatMoney } from "./taskHelpers";

type Props = {
  activeCount: number;
  availableCount: number;
  codTotal: number;
};

type SummaryItem = {
  label: string;
  value: string;
  detail: string;
  icon: RiderIconName;
  tone: "green" | "blue" | "amber";
};

export function DashboardSummary({
  activeCount,
  availableCount,
  codTotal,
}: Props) {
  const items: SummaryItem[] = [
    {
      label: "Active deliveries",
      value: String(activeCount),
      detail: "Orders in progress",
      icon: "route",
      tone: "green",
    },
    {
      label: "Available jobs",
      value: String(availableCount),
      detail: "Ready to accept",
      icon: "package",
      tone: "blue",
    },
    {
      label: "Cash to collect",
      value: formatMoney(codTotal),
      detail: "Across active COD orders",
      icon: "wallet",
      tone: "amber",
    },
  ];

  return (
    <section className="summary-grid" aria-label="Delivery summary">
      {items.map((item) => (
        <article className="summary-card" key={item.label}>
          <span className={`summary-icon ${item.tone}`}>
            <RiderIcon name={item.icon} />
          </span>
          <div className="summary-copy">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
