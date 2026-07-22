import { vendorStyles as styles } from "./vendorStyles";

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <strong className={styles.metricValue}>{value}</strong>
      <span className={styles.metricDetail}>{detail}</span>
    </article>
  );
}

export function FinanceRow({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`${styles.row} ${dark ? styles.darkRow : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
