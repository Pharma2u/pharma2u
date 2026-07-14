import type { ReactNode } from "react";

export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="text-lg text-slate-500" aria-label="Close">×</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function FormActions({
  onClose,
  label,
  destructive = false,
  action,
}: {
  onClose: () => void;
  label: string;
  destructive?: boolean;
  action?: () => void;
}) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
      <button type={action ? "button" : "submit"} onClick={action} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"}`}>{label}</button>
    </div>
  );
}