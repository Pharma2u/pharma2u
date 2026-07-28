"use client";

import { useMemo, useRef, useState } from "react";
import { adminWorkspaceApi } from "@/lib/adminWorkspaceApi";
import {
  BadgeIndianRupee,
  Building2,
  Camera,
  Check,
  CreditCard,
  IndianRupee,
  Plus,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type {
  CompanyProfile,
  Employee,
  PermissionSummary,
  RoleUser,
  Subscription,
  VendorProfileType,
} from "./types";
import {
  Button,
  Card,
  CardHeader,
  PageHeading,
  SearchInput,
  StatusBadge,
} from "./ui";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function SubscriptionsPanel({
  items,
  onToggle,
}: {
  items: Subscription[];
  onToggle: (item: Subscription) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState("");
  const list = useMemo(
    () =>
      items.filter((item) =>
        item.pharmacy.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );
  function toggle(item: Subscription) {
    void onToggle(item);
    setSaved("Auto-pay preference updated.");
    window.setTimeout(() => setSaved(""), 2500);
  }
  return (
    <>
      <PageHeading
        eyebrow="Recurring revenue"
        title="Subscriptions & auto-pay"
        description="Manage recurring pharmacy dues and monitor mandate health across the network."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <CreditCard className="text-emerald-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">
            {currency.format(items.reduce((sum, item) => sum + item.amount, 0))}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Monthly recurring revenue
          </p>
        </Card>
        <Card className="p-5">
          <Check className="text-blue-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">
            {items.length
              ? `${((items.filter((item) => item.autopay).length / items.length) * 100).toFixed(1)}%`
              : "0%"}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Auto-pay success rate
          </p>
        </Card>
        <Card className="p-5">
          <BadgeIndianRupee className="text-amber-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">
            {items.filter((item) => item.status !== "active").length}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Mandates need attention
          </p>
        </Card>
      </div>
      {saved && (
        <div
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {saved}
        </div>
      )}
      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search pharmacies"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Pharmacy",
                  "Plan",
                  "Monthly due",
                  "Next billing",
                  "Status",
                  "Auto-pay",
                ].map((head) => (
                  <th key={head} className="px-5 py-3">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((item) => (
                <tr key={item.pharmacyId}>
                  <td className="px-5 py-4 font-bold">{item.pharmacy}</td>
                  <td className="px-5 py-4">{item.plan}</td>
                  <td className="px-5 py-4 font-bold">
                    {currency.format(item.amount)}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {item.nextBilling}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      tone={item.status === "active" ? "emerald" : "amber"}
                    >
                      {item.status}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggle(item)}
                      role="switch"
                      aria-checked={item.autopay}
                      className={`relative h-6 w-11 rounded-full transition ${item.autopay ? "bg-emerald-500" : "bg-slate-300"}`}
                    >
                      <span
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${item.autopay ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

export function HrmPanel({
  employees,
  onChange,
}: {
  employees: Employee[];
  onChange: (items: Employee[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    role: "",
    department: "Operations",
    salary: "",
  });
  const payroll = employees.reduce(
    (sum, employee) => sum + employee.monthlySalary,
    0,
  );
  function add() {
    const salary = Number(draft.salary);
    if (
      draft.name.trim().length < 2 ||
      draft.role.trim().length < 2 ||
      salary < 1000
    ) {
      setError("Enter a valid name, role, and monthly salary.");
      return;
    }
    onChange([
      ...employees,
      {
        id: `EMP-${Date.now().toString().slice(-4)}`,
        name: draft.name.trim(),
        role: draft.role.trim(),
        department: draft.department,
        monthlySalary: salary,
        status: "active",
      },
    ]);
    setOpen(false);
    setError("");
    setDraft({ name: "", role: "", department: "Operations", salary: "" });
  }
  return (
    <>
      <PageHeading
        eyebrow="People operations"
        title="HR & payroll"
        description="Maintain employee records, payroll totals, leave status, and standard HR workflows."
        actions={
          <Button onClick={() => setOpen((value) => !value)}>
            <Plus size={16} /> Add employee
          </Button>
        }
      />
      {open && (
        <Card className="mb-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Employee name"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              placeholder="Job role"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <select
              value={draft.department}
              onChange={(e) =>
                setDraft({ ...draft, department: e.target.value })
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option>Operations</option>
              <option>Finance</option>
              <option>Customer Support</option>
              <option>Technology</option>
            </select>
            <input
              type="number"
              min="1000"
              value={draft.salary}
              onChange={(e) => setDraft({ ...draft, salary: e.target.value })}
              placeholder="Monthly salary"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          {error && (
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add}>Save employee</Button>
          </div>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <UserCog className="text-blue-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">{employees.length}</p>
          <p className="text-xs font-semibold text-slate-500">
            Employee records
          </p>
        </Card>
        <Card className="p-5">
          <IndianRupee className="text-emerald-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">
            {currency.format(payroll)}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Monthly payroll
          </p>
        </Card>
        <Card className="p-5">
          <Building2 className="text-violet-600" size={21} />
          <p className="mt-4 text-2xl font-extrabold">
            {new Set(employees.map((item) => item.department)).size}
          </p>
          <p className="text-xs font-semibold text-slate-500">Departments</p>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader
          title="Employee directory"
          description="Payroll-ready active records"
        />
        <div className="divide-y divide-slate-100">
          {employees.map((employee) => (
            <div
              className="grid gap-3 p-5 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-center"
              key={employee.id}
            >
              <div>
                <b className="block text-sm">{employee.name}</b>
                <span className="text-xs text-slate-400">
                  {employee.id} · {employee.role}
                </span>
              </div>
              <span className="text-sm text-slate-600">
                {employee.department}
              </span>
              <b className="text-sm">
                {currency.format(employee.monthlySalary)} / month
              </b>
              <StatusBadge
                tone={employee.status === "active" ? "emerald" : "amber"}
              >
                {employee.status}
              </StatusBadge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function AccessPanel({
  permissions,
  token,
}: {
  permissions: PermissionSummary[];
  token: string;
}) {
  const [selectedRole, setSelectedRole] = useState<RoleUser["role"] | null>(
    null,
  );
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  async function review(role: RoleUser["role"]) {
    setSelectedRole(role);
    setLoading(true);
    setMessage("");
    try {
      setUsers((await adminWorkspaceApi.roleUsers(token, role)).items);
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggle(user: RoleUser) {
    const action = user.isActive ? "revoke access for" : "restore access for";
    if (!window.confirm(`Do you want to ${action} ${user.name}?`)) return;
    setBusyId(user.id);
    setMessage("");
    try {
      const saved = await adminWorkspaceApi.setUserAccess(
        token,
        user.id,
        !user.isActive,
      );
      setUsers((current) =>
        current.map((item) =>
          item.id === saved.id ? { ...item, isActive: saved.isActive } : item,
        ),
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Unable to update access.",
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Role-based security"
        title="Roles & access"
        description="Review actual portal accounts by role and revoke or restore their access."
      />
      {message && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {message}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {permissions.map((item) => (
          <Card className="p-5" key={item.role}>
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck size={20} />
              </span>
              <StatusBadge tone={item.tone}>{item.users} users</StatusBadge>
            </div>
            <h3 className="mt-5 font-bold capitalize">{item.role}</h3>
            <p className="mt-1 text-sm text-slate-500">{item.access}</p>
            <button
              onClick={() => void review(item.role as RoleUser["role"])}
              className="mt-5 text-sm font-bold text-emerald-700"
            >
              Review users
            </button>
          </Card>
        ))}
      </div>
      {selectedRole && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-slate-950/30 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedRole} accounts`}
          onMouseDown={() => setSelectedRole(null)}
        >
          <section
            className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">
                  Role accounts
                </p>
                <h2 className="mt-1 text-2xl font-extrabold capitalize text-slate-950">
                  {selectedRole} users
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Account details and access status
                </p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                aria-label="Close account list"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-xl text-slate-600 hover:bg-slate-50"
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-6 text-sm text-slate-500">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No {selectedRole} accounts found.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <div
                      className="grid gap-3 p-6 md:grid-cols-[1.3fr_1fr_auto] md:items-center"
                      key={user.id}
                    >
                      <div>
                        <b className="block text-slate-900">{user.name}</b>
                        <span className="text-xs text-slate-500">
                          {user.phone}
                          {user.email ? ` · ${user.email}` : ""}
                        </span>
                        <span className="mt-1 block text-xs text-slate-400">
                          Joined{" "}
                          {new Date(user.createdAt).toLocaleDateString("en-IN")}
                          {user.pharmacies.length
                            ? ` · ${user.pharmacies.map((pharmacy) => pharmacy.name).join(", ")}`
                            : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge tone={user.isActive ? "emerald" : "red"}>
                          {user.isActive ? "active" : "revoked"}
                        </StatusBadge>
                        {user.applicationStatus && (
                          <StatusBadge tone="blue">
                            {user.applicationStatus}
                          </StatusBadge>
                        )}
                      </div>
                      <Button
                        variant="secondary"
                        disabled={busyId === user.id}
                        onClick={() => void toggle(user)}
                      >
                        {busyId === user.id
                          ? "Saving…"
                          : user.isActive
                            ? "Revoke access"
                            : "Restore access"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}{" "}
    </>
  );
}
const requiredFields: (keyof CompanyProfile)[] = [
  "name",
  "legalName",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
];
export function VendorProfileTypesPanel({
  items,
  token,
  onChange,
}: {
  items: VendorProfileType[];
  token: string;
  onChange: (items: VendorProfileType[]) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function add() {
    if (!name.trim() || !description.trim()) {
      setMessage("Enter a name and description.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const created = await adminWorkspaceApi.createVendorProfileType(token, {
        name,
        description,
      });
      onChange([...items, created]);
      setName("");
      setDescription("");
      setMessage("Profile type added.");
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Unable to add profile type.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function toggle(item: VendorProfileType) {
    try {
      const saved = await adminWorkspaceApi.updateVendorProfileType(
        token,
        item.id,
        !item.isActive,
      );
      onChange(
        items.map((current) => (current.id === saved.id ? saved : current)),
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Unable to update profile type.",
      );
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Vendor administration"
        title="Vendor profile types"
        description="Define the profile types available to vendor accounts. This setup is visible to administrators only."
      />
      {message && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {message}
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="divide-y divide-slate-100 p-0">
          {items.map((item) => (
            <div
              className="flex items-center justify-between gap-4 p-5"
              key={item.id}
            >
              <div>
                <b className="block text-sm text-slate-900">{item.name}</b>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.description}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void toggle(item)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
              >
                {item.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <h2 className="font-bold text-slate-900">Add profile type</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create a reusable vendor category for onboarding and account
            management.
          </p>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Retail pharmacy"
            className="mt-5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
            rows={3}
            className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
          <Button className="mt-3" onClick={() => void add()} disabled={saving}>
            <Plus size={16} /> {saving ? "Adding..." : "Add profile type"}
          </Button>
        </Card>
      </div>
    </>
  );
}
export function CompanySetupPanel({
  company,
  token,
  onSave,
}: {
  company: CompanyProfile;
  token: string;
  onSave: (profile: CompanyProfile) => Promise<void>;
}) {
  const [draft, setDraft] = useState(company);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CompanyProfile, string>>
  >({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const field = (
    key: keyof CompanyProfile,
    label: string,
    placeholder = "",
  ) => (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={draft[key]}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        placeholder={placeholder}
        className={`mt-1 h-11 w-full rounded-xl border px-3 text-sm ${errors[key] ? "border-red-400" : "border-slate-200"}`}
      />
      {errors[key] && (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {errors[key]}
        </span>
      )}
    </label>
  );
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      setErrors((current) => ({
        ...current,
        logoDataUrl: "Choose a PNG, JPG, or WebP image smaller than 1 MB.",
      }));
      return;
    }

    setUploadingLogo(true);
    setSaveError("");
    try {
      const logoDataUrl = await adminWorkspaceApi.uploadCompanyLogo(
        token,
        file,
      );
      setDraft((current) => ({ ...current, logoDataUrl }));
      setErrors((current) => ({ ...current, logoDataUrl: undefined }));
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "Unable to upload company logo.",
      );
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function save() {
    const nextErrors: Partial<Record<keyof CompanyProfile, string>> = {};
    requiredFields.forEach((key) => {
      if (!draft[key].trim()) nextErrors[key] = "This field is required.";
    });
    if (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email))
      nextErrors.email = "Enter a valid email address.";
    if (draft.pincode && !/^\d{6}$/.test(draft.pincode))
      nextErrors.pincode = "Enter a 6-digit pincode.";
    if (draft.gstin && !/^[0-9A-Z]{15}$/.test(draft.gstin))
      nextErrors.gstin = "GSTIN must contain 15 uppercase letters and digits.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSave(draft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : "Unable to save company settings.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Global configuration"
        title="Company setup"
        description="Company identity used across portal headers, business documents, reports, and print previews."
        actions={
          <Button onClick={() => void save()} disabled={saving}>
            <Save size={16} /> Save settings
          </Button>
        }
      />
      {saved && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          Company details saved. The updated branding will appear across the
          customer, vendor, rider, and admin portals.
        </div>
      )}
      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {saveError}
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold">Company logo</h2>
            <p className="mt-1 text-xs text-slate-500">
              PNG, JPG or WebP · maximum 1 MB
            </p>
            <div className="mt-4 grid min-h-44 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              {draft.logoDataUrl ? (
                <Image
                  unoptimized
                  width={240}
                  height={112}
                  src={draft.logoDataUrl}
                  alt="Uploaded company logo preview"
                  className="max-h-28 max-w-full object-contain"
                />
              ) : (
                <Image
                  width={240}
                  height={96}
                  src="/images/logo/logo.png"
                  alt="Current Pharma2U logo"
                  className="max-h-24 max-w-full object-contain"
                />
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => void upload(e.target.files?.[0])}
            />
            <Button
              variant="secondary"
              className="mt-3 w-full"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingLogo}
            >
              <Camera size={16} />{" "}
              {uploadingLogo ? "Uploading..." : "Upload logo"}
            </Button>
            {errors.logoDataUrl && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                {errors.logoDataUrl}
              </p>
            )}
          </Card>
          <Card className="overflow-hidden">
            <CardHeader
              title="Live print preview"
              description="Header used on reports and invoices"
            />
            <div className="m-4 rounded-xl bg-slate-950 p-4 text-white">
              <div className="flex items-center gap-3">
                {draft.logoDataUrl ? (
                  <Image
                    unoptimized
                    width={40}
                    height={40}
                    src={draft.logoDataUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg bg-white object-contain p-1"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500 font-black">
                    P2U
                  </div>
                )}
                <div>
                  <b className="block text-sm">
                    {draft.name || "Company name"}
                  </b>
                  <span className="text-[10px] text-slate-400">
                    {draft.city || "City"}, {draft.state || "State"}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">
                {draft.phone} · {draft.email}
              </p>
            </div>
          </Card>
        </div>
        <Card>
          <CardHeader
            title="Company details"
            description="Essential legal, contact, and tax information"
          />
          <div className="space-y-6 p-5">
            <fieldset>
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Basic information
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                {field("name", "Display name")}
                {field("legalName", "Legal name")}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Contact details
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                {field("phone", "Phone")}
                {field("email", "Email")}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Registered address
              </legend>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-3">
                  {field("address", "Address")}
                </div>
                {field("city", "City")}
                {field("state", "State")}
                {field("pincode", "Pincode")}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Registration & tax
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                {field(
                  "registrationNumber",
                  "Registration number",
                  "CIN / registration ID",
                )}
                {field("gstin", "GSTIN")}
              </div>
            </fieldset>
          </div>
        </Card>
      </div>
    </>
  );
}
import Image from "next/image";
