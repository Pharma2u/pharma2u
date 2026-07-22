"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Filter,
  Plus,
  ReceiptIndianRupee,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { FinanceScope, LedgerEntry, WorkspaceData } from "./types";
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
const scopes: { value: FinanceScope; label: string }[] = [
  { value: "combined", label: "Master balance" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "logistics", label: "Logistics" },
  { value: "corporate", label: "Corporate office" },
];

function amountBy(entries: LedgerEntry[], types: LedgerEntry["type"][]) {
  return entries
    .filter((entry) => types.includes(entry.type))
    .reduce((sum, entry) => sum + entry.amount, 0);
}

export function AccountingPanel({
  data,
  onChange,
}: {
  data: WorkspaceData;
  onChange: (next: WorkspaceData) => void;
}) {
  const visible =
    data.financeScope === "combined"
      ? data.ledger
      : data.ledger.filter((entry) => entry.division === data.financeScope);
  const income = amountBy(visible, ["income", "receivable"]);
  const outgoing = amountBy(visible, ["expense", "payable"]);
  const cards = [
    {
      label: "Income & receivables",
      amount: income,
      icon: TrendingUp,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Expenses & payables",
      amount: outgoing,
      icon: TrendingDown,
      tone: "text-red-600 bg-red-50",
    },
    {
      label: "Net master balance",
      amount: income - outgoing,
      icon: Wallet,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pending items",
      amount: visible.filter((entry) => entry.status !== "paid").length,
      icon: ReceiptIndianRupee,
      tone: "text-violet-600 bg-violet-50",
      count: true,
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="Finance ecosystem"
        title="Unified accounting"
        description="Switch between isolated business units or monitor the combined master balance."
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Download size={16} /> Export report
          </Button>
        }
      />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5">
        {scopes.map((scope) => (
          <button
            key={scope.value}
            onClick={() => onChange({ ...data, financeScope: scope.value })}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${data.financeScope === scope.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            {scope.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, amount, icon: Icon, tone, count }) => (
          <Card className="p-5" key={label}>
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}
            >
              <Icon size={20} />
            </div>
            <p className="mt-4 text-xl font-extrabold text-slate-950">
              {count ? amount : currency.format(amount)}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <Card>
          <CardHeader
            title="Division performance"
            description="Income against outgoing balance"
          />
          <div className="space-y-6 p-5">
            {["pharmacy", "logistics", "corporate"].map((division) => {
              const rows = data.ledger.filter(
                (entry) => entry.division === division,
              );
              const total = amountBy(rows, ["income", "receivable"]);
              const cost = amountBy(rows, ["expense", "payable"]);
              const width = Math.max(
                10,
                Math.round((total / Math.max(total, cost, 1)) * 100),
              );
              return (
                <div key={division}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-bold capitalize">{division}</span>
                    <span className="font-semibold text-slate-500">
                      {currency.format(total - cost)}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-400">
            Financial position
          </p>
          <p className="mt-6 text-3xl font-extrabold">
            {currency.format(income - outgoing)}
          </p>
          <p className="mt-1 text-sm text-slate-400">Current net balance</p>
          <div className="mt-7 space-y-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Accounts receivable</span>
              <b>{currency.format(amountBy(visible, ["receivable"]))}</b>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Accounts payable</span>
              <b>{currency.format(amountBy(visible, ["payable"]))}</b>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export function LedgerPanel({
  entries,
  onChange,
}: {
  entries: LedgerEntry[];
  onChange: (entries: LedgerEntry[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    description: "",
    amount: "",
    type: "income" as LedgerEntry["type"],
    division: "pharmacy" as LedgerEntry["division"],
  });
  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        `${entry.reference} ${entry.description} ${entry.division}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [entries, query],
  );
  function addEntry() {
    const amount = Number(draft.amount);
    if (
      draft.description.trim().length < 3 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Enter a description and a valid amount greater than zero.");
      return;
    }
    const now = new Date();
    onChange([
      {
        id: `TXN-${Date.now().toString().slice(-6)}`,
        date: now.toISOString().slice(0, 10),
        reference: `MAN-${Date.now().toString().slice(-4)}`,
        description: draft.description.trim(),
        division: draft.division,
        type: draft.type,
        amount,
        status: "pending",
      },
      ...entries,
    ]);
    setDraft({
      description: "",
      amount: "",
      type: "income",
      division: "pharmacy",
    });
    setError("");
    setShowForm(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="Bookkeeping"
        title="General ledger"
        description="Track billing, payables, receivables, income, and expenses in one auditable register."
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Download size={16} /> Export
            </Button>
            <Button onClick={() => setShowForm((value) => !value)}>
              <Plus size={16} /> New entry
            </Button>
          </>
        }
      />
      {showForm && (
        <Card className="mb-4 p-5">
          <h2 className="font-bold">Add manual ledger entry</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              aria-label="Description"
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Description"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <input
              aria-label="Amount"
              type="number"
              min="1"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              placeholder="Amount in ₹"
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <select
              aria-label="Entry type"
              value={draft.type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  type: e.target.value as LedgerEntry["type"],
                })
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="receivable">Receivable</option>
              <option value="payable">Payable</option>
            </select>
            <select
              aria-label="Division"
              value={draft.division}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  division: e.target.value as LedgerEntry["division"],
                })
              }
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="pharmacy">Pharmacy</option>
              <option value="logistics">Logistics</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          {error && (
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={addEntry}>Save entry</Button>
          </div>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search ledger"
          />
          <Button variant="secondary">
            <Filter size={16} /> Filters
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Date / Reference",
                  "Description",
                  "Division",
                  "Type",
                  "Amount",
                  "Status",
                ].map((head) => (
                  <th className="px-5 py-3 font-bold" key={head}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => (
                <tr className="hover:bg-slate-50/50" key={entry.id}>
                  <td className="px-5 py-4">
                    <b className="block text-slate-900">{entry.date}</b>
                    <span className="text-xs text-slate-400">
                      {entry.reference}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {entry.description}
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-500">
                    {entry.division}
                  </td>
                  <td className="px-5 py-4 capitalize">{entry.type}</td>
                  <td className="px-5 py-4 font-bold">
                    {currency.format(entry.amount)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      tone={
                        entry.status === "paid"
                          ? "emerald"
                          : entry.status === "overdue"
                            ? "red"
                            : "amber"
                      }
                    >
                      {entry.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">
              No ledger entries match your search.
            </p>
          )}
        </div>
      </Card>
    </>
  );
}
