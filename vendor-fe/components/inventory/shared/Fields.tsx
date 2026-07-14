import type { InputHTMLAttributes } from "react";

export function InputField({
  label,
  required = true,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>
        {label}
        {required && (
          <>
            {" "}
            <span className="text-red-600" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </>
        )}
      </span>
      <input
        required={required}
        {...props}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
      />
    </label>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  amber = false,
}: {
  label: string;
  value: number;
  detail: string;
  amber?: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-4 ${amber ? "border-amber-100 bg-amber-50" : "border-teal-100 bg-teal-50"}`}>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}