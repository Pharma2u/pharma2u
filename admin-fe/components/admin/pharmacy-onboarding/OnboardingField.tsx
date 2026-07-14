import type { ChangeEvent } from "react";

export function OnboardingField({
  label,
  name,
  value,
  error,
  hint,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  hint: string;
  placeholder: string;
  type?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} <span className="text-red-600">*</span>
      <input
        required
        name={name}
        type={type}
        inputMode={name === "vendorPhone" ? "numeric" : undefined}
        step={type === "number" ? "any" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={`${name}-help`}
        className={`mt-2 w-full rounded-xl border bg-white p-3 outline-none transition focus:ring-2 focus:ring-emerald-200 ${error ? "border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
      />
      <span id={`${name}-help`} className={`mt-1 block text-xs ${error ? "text-red-600" : "text-slate-500"}`}>
        {error ?? hint}
      </span>
    </label>
  );
}