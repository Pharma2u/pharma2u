"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Crown, Megaphone, Plus, Send, Star } from "lucide-react";
import type { Announcement, Customer, SupportTicket } from "./types";
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

export function AnnouncementsPanel({
  items,
  onChange,
}: {
  items: Announcement[];
  onChange: (items: Announcement[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    message: "",
    audience: "all" as Announcement["audience"],
  });
  function publish() {
    if (draft.title.trim().length < 4 || draft.message.trim().length < 10) {
      setError(
        "Title must contain at least 4 characters and the message at least 10.",
      );
      return;
    }
    onChange([
      {
        id: `ANN-${Date.now().toString().slice(-5)}`,
        ...draft,
        title: draft.title.trim(),
        message: draft.message.trim(),
        publishedAt: new Date().toISOString().slice(0, 10),
      },
      ...items,
    ]);
    setDraft({ title: "", message: "", audience: "all" });
    setError("");
    setOpen(false);
  }
  return (
    <>
      <PageHeading
        eyebrow="Broadcast communication"
        title="Announcements"
        description="Send operational updates and formal notices to pharmacy owners and delivery partners."
        actions={
          <Button onClick={() => setOpen((value) => !value)}>
            <Plus size={16} /> Create announcement
          </Button>
        }
      />
      {open && (
        <Card className="mb-4 p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div>
              <label className="text-xs font-bold text-slate-600">Title</label>
              <input
                value={draft.title}
                maxLength={80}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Important update"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">
                Audience
              </label>
              <select
                value={draft.audience}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    audience: e.target.value as Announcement["audience"],
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="all">Everyone</option>
                <option value="pharmacies">Pharmacy owners</option>
                <option value="riders">Delivery personnel</option>
              </select>
            </div>
          </div>
          <label className="mt-4 block text-xs font-bold text-slate-600">
            Message
          </label>
          <textarea
            value={draft.message}
            maxLength={500}
            onChange={(e) => setDraft({ ...draft, message: e.target.value })}
            className="mt-1 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Write the notice clearly..."
          />
          {error && (
            <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={publish}>
              <Send size={16} /> Publish now
            </Button>
          </div>
        </Card>
      )}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader
            title="Published notices"
            description={`${items.length} announcements in the workspace`}
          />
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <article className="p-5" key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Megaphone size={19} />
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>
                    </div>
                  </div>
                  <StatusBadge tone="blue">{item.audience}</StatusBadge>
                </div>
                <p className="ml-[52px] mt-3 text-xs text-slate-400">
                  Published {item.publishedAt} · {item.id}
                </p>
              </article>
            ))}
          </div>
        </Card>
        <Card className="h-fit p-5">
          <h3 className="font-bold">Delivery checklist</h3>
          <div className="mt-4 space-y-3">
            {[
              "Clear actionable title",
              "Correct audience selected",
              "No personal customer data",
              "Formal notice reviewed",
            ].map((item) => (
              <div className="flex gap-2 text-sm text-slate-600" key={item}>
                <CheckCircle2 className="shrink-0 text-emerald-600" size={17} />
                {item}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function CustomersPanel({
  customers,
  summary,
}: {
  customers: Customer[];
  summary: { members: number; points: number };
}) {
  const [query, setQuery] = useState("");
  const list = useMemo(
    () =>
      customers.filter((customer) =>
        customer.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [customers, query],
  );
  return (
    <>
      <PageHeading
        eyebrow="Customer database"
        title="Customers & loyalty"
        description="Identify valuable customers and monitor the rewards balance shown in the Pharma2U customer experience."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-5">
          <Crown size={21} className="text-amber-500" />
          <p className="mt-4 text-2xl font-extrabold">
            {summary.members.toLocaleString("en-IN")}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Loyalty members
          </p>
        </Card>
        <Card className="p-5">
          <Star size={21} className="text-violet-500" />
          <p className="mt-4 text-2xl font-extrabold">
            {summary.points.toLocaleString("en-IN")}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            Points in circulation
          </p>
        </Card>
      </div>
      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search customers"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  "Customer",
                  "Orders",
                  "Lifetime spend",
                  "Available points",
                  "Tier",
                ].map((item) => (
                  <th key={item} className="px-5 py-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-4">
                    <b className="block">{customer.name}</b>
                    <span className="text-xs text-slate-400">
                      {customer.phone}
                    </span>
                  </td>
                  <td className="px-5 py-4">{customer.orders}</td>
                  <td className="px-5 py-4 font-bold">
                    {currency.format(customer.spend)}
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-700">
                    {customer.points.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      tone={
                        customer.tier === "Platinum"
                          ? "violet"
                          : customer.tier === "Gold"
                            ? "amber"
                            : "slate"
                      }
                    >
                      {customer.tier}
                    </StatusBadge>
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

export function SupportPanel({
  tickets,
  onChange,
}: {
  tickets: SupportTicket[];
  onChange: (items: SupportTicket[]) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = tickets.filter((ticket) =>
    `${ticket.subject} ${ticket.requester} ${ticket.id}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const advance = (ticket: SupportTicket) =>
    onChange(
      tickets.map((item) =>
        item.id === ticket.id
          ? {
              ...item,
              status: ticket.status === "open" ? "in-progress" : "resolved",
            }
          : item,
      ),
    );
  return (
    <>
      <PageHeading
        eyebrow="Customer service"
        title="Support desk"
        description="Triage customer and partner issues while keeping operational tools isolated by role."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Open", tickets.filter((x) => x.status === "open").length, "red"],
          [
            "In progress",
            tickets.filter((x) => x.status === "in-progress").length,
            "amber",
          ],
          [
            "Resolved",
            tickets.filter((x) => x.status === "resolved").length,
            "emerald",
          ],
        ].map(([label, value, tone]) => (
          <Card className="p-5" key={label}>
            <p className="text-2xl font-extrabold">{value}</p>
            <p
              className={
                tone === "red"
                  ? "mt-1 text-xs font-bold text-red-600"
                  : tone === "amber"
                    ? "mt-1 text-xs font-bold text-amber-600"
                    : "mt-1 text-xs font-bold text-emerald-600"
              }
            >
              {label}
            </p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search tickets"
          />
        </div>
        <div className="divide-y divide-slate-100">
          {visible.map((ticket) => (
            <div
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
              key={ticket.id}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    {ticket.id}
                  </span>
                  <StatusBadge
                    tone={
                      ticket.priority === "high"
                        ? "red"
                        : ticket.priority === "medium"
                          ? "amber"
                          : "slate"
                    }
                  >
                    {ticket.priority}
                  </StatusBadge>
                </div>
                <h3 className="mt-2 font-bold">{ticket.subject}</h3>
                <p className="text-xs text-slate-500">
                  {ticket.requester} · {ticket.category}
                </p>
              </div>
              <StatusBadge
                tone={
                  ticket.status === "resolved"
                    ? "emerald"
                    : ticket.status === "in-progress"
                      ? "blue"
                      : "amber"
                }
              >
                {ticket.status}
              </StatusBadge>
              {ticket.status !== "resolved" && (
                <Button variant="secondary" onClick={() => advance(ticket)}>
                  {ticket.status === "open" ? "Assign to me" : "Resolve"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
