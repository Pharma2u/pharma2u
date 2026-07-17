import type { ReactNode } from "react";
import { RiderIcon } from "@/components/ui/RiderIcon";

type Props = {
  title: string;
  description: string;
  count: number;
  emptyText: string;
  emptyIcon: "check" | "clock";
  onRefresh?: () => void;
  children: ReactNode;
};

export function TaskList({
  title,
  description,
  count,
  emptyText,
  emptyIcon,
  onRefresh,
  children,
}: Props) {
  return (
    <section className="task-panel">
      <header className="task-panel-header">
        <div>
          <div className="task-panel-title">
            <h2>{title}</h2>
            <span>{count}</span>
          </div>
          <p>{description}</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            className="icon-button"
            onClick={onRefresh}
            aria-label={`Refresh ${title.toLowerCase()}`}
          >
            <RiderIcon name="refresh" />
          </button>
        )}
      </header>
      {count > 0 ? (
        <div className="task-stack">{children}</div>
      ) : (
        <div className="task-empty">
          <span>
            <RiderIcon name={emptyIcon} />
          </span>
          <strong>
            {emptyIcon === "check" ? "All clear" : "Nothing waiting"}
          </strong>
          <p>{emptyText}</p>
        </div>
      )}
    </section>
  );
}
