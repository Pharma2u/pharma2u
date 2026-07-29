"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  LoaderCircle,
  Pencil,
  Plus,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import {
  createPharmacyEmployee,
  listPharmacyEmployees,
  updatePharmacyEmployee,
  type PharmacyEmployee,
  type PharmacyEmployeeInput,
} from "@/lib/authApi";

const emptyDraft = (): PharmacyEmployeeInput => ({
  name: "",
  phone: "",
  email: "",
  designation: "",
  employmentType: "full_time",
  monthlySalary: 0,
  joiningDate: new Date().toISOString().slice(0, 10),
});

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const label = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function PharmacyStaffPanel({ token }: { token: string }) {
  const [employees, setEmployees] = useState<PharmacyEmployee[]>([]);
  const [draft, setDraft] = useState<PharmacyEmployeeInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEmployees((await listPharmacyEmployees(token)).items);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load pharmacy staff.",
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(
    () => ({
      active: employees.filter((item) => item.status === "active").length,
      payroll: employees
        .filter((item) => item.status !== "inactive")
        .reduce((sum, item) => sum + item.monthlySalary, 0),
    }),
    [employees],
  );

  function startAdd() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError("");
    setOpen(true);
  }

  function startEdit(employee: PharmacyEmployee) {
    setEditingId(employee.id);
    setDraft({
      name: employee.name,
      phone: employee.phone,
      email: employee.email ?? "",
      designation: employee.designation,
      employmentType: employee.employmentType,
      monthlySalary: employee.monthlySalary,
      joiningDate: employee.joiningDate,
    });
    setError("");
    setOpen(true);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = editingId
        ? await updatePharmacyEmployee(token, editingId, draft)
        : await createPharmacyEmployee(token, draft);
      setEmployees((items) =>
        editingId
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items],
      );
      setOpen(false);
      setEditingId(null);
      setDraft(emptyDraft());
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(employee: PharmacyEmployee) {
    setUpdatingId(employee.id);
    setError("");
    try {
      const saved = await updatePharmacyEmployee(token, employee.id, {
        status: employee.status === "active" ? "inactive" : "active",
      });
      setEmployees((items) =>
        items.map((item) => (item.id === saved.id ? saved : item)),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update employee status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
            <UsersRound size={21} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700">
              Staff management
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Pharmacy employees
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Maintain employee details, employment status, and monthly payroll.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={startAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white"
        >
          <Plus size={17} /> Add employee
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Total employees",
            value: employees.length,
            Icon: UsersRound,
          },
          {
            title: "Active staff",
            value: summary.active,
            Icon: UserRoundCheck,
          },
          {
            title: "Monthly payroll",
            value: money.format(summary.payroll),
            Icon: BriefcaseBusiness,
          },
        ].map(({ title, value, Icon }) => (
          <article
            key={title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <Icon className="text-teal-700" size={18} />
            <p className="mt-3 text-xl font-extrabold text-slate-950">
              {String(value)}
            </p>
            <p className="text-xs font-semibold text-slate-500">{title}</p>
          </article>
        ))}
      </div>

      {open && (
        <form
          onSubmit={save}
          className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/40 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-slate-900">
              {editingId ? "Edit employee" : "Add employee"}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm font-bold text-slate-500"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Full name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
              required
            />
            <Field
              label="Mobile number"
              value={draft.phone}
              onChange={(phone) => setDraft({ ...draft, phone })}
              type="tel"
              required
            />
            <Field
              label="Email address"
              value={draft.email ?? ""}
              onChange={(email) => setDraft({ ...draft, email })}
              type="email"
            />
            <Field
              label="Designation"
              value={draft.designation}
              onChange={(designation) => setDraft({ ...draft, designation })}
              placeholder="Pharmacist, cashier..."
              required
            />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Employment type
              <select
                value={draft.employmentType}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    employmentType: event.target
                      .value as PharmacyEmployeeInput["employmentType"],
                  })
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
              >
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <Field
              label="Monthly salary"
              value={String(draft.monthlySalary)}
              onChange={(monthlySalary) =>
                setDraft({ ...draft, monthlySalary: Number(monthlySalary) })
              }
              type="number"
              required
            />
            <Field
              label="Joining date"
              value={draft.joiningDate}
              onChange={(joiningDate) => setDraft({ ...draft, joiningDate })}
              type="date"
              required
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={saving}
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update employee"
                  : "Save employee"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid min-h-36 place-items-center">
          <LoaderCircle className="animate-spin text-teal-700" size={23} />
        </div>
      ) : employees.length ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Employee",
                  "Contact",
                  "Employment",
                  "Salary",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-bold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3">
                    <b className="block text-slate-900">{employee.name}</b>
                    <span className="text-xs text-slate-400">
                      {employee.employeeCode} · {employee.designation}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="block">{employee.phone}</span>
                    <span className="text-xs">
                      {employee.email || "No email"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <span className="block">
                      {label(employee.employmentType)}
                    </span>
                    <span className="text-xs">
                      Joined {employee.joiningDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {money.format(employee.monthlySalary)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        employee.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : employee.status === "on_leave"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {label(employee.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(employee)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                        aria-label={`Edit ${employee.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === employee.id}
                        onClick={() => void toggleStatus(employee)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        aria-label={
                          employee.status === "active"
                            ? `Deactivate ${employee.name}`
                            : `Activate ${employee.name}`
                        }
                      >
                        {employee.status === "active" ? (
                          <UserRoundX size={15} />
                        ) : (
                          <UserRoundCheck size={15} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <UsersRound className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 font-bold text-slate-700">
            No employees added yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Add pharmacy staff to maintain their employment and payroll details.
          </p>
        </div>
      )}
    </section>
  );
}

function Field({
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
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={type === "number" ? 0 : undefined}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
      />
    </label>
  );
}
