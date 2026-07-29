"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award,
  Bug,
  CheckCircle2,
  ExternalLink,
  Gift,
  ImageIcon,
  MessageSquareText,
  RefreshCw,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  XCircle,
  X,
} from "lucide-react";
import { adminWorkspaceApi } from "@/lib/adminWorkspaceApi";
import type { CustomerFeedback, LoyaltySetting } from "./workspace/types";
import { Button, Card, PageHeading, SearchInput, StatusBadge } from "./workspace/ui";

const emptySetting: LoyaltySetting = {
  id: "default",
  rupeesPerPoint: 1,
  minimumRedeemPoints: 1,
  defaultFeedbackReward: 50,
  isActive: true,
};

function readableDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function feedbackTone(status: CustomerFeedback["status"]) {
  return status === "rewarded" ? "emerald" : status === "rejected" ? "red" : "amber";
}

export function FeedbackPanel({ token }: { token: string }) {
  const [items, setItems] = useState<CustomerFeedback[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [points, setPoints] = useState(50);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feedback, setting] = await Promise.all([
        adminWorkspaceApi.feedback(token, filter),
        adminWorkspaceApi.loyaltySetting(token),
      ]);
      setItems(feedback.items);
      setCounts(feedback.counts);
      setPoints(setting.defaultFeedbackReward);
      setSelectedId((current) => current && feedback.items.some((item) => item.id === current) ? current : feedback.items[0]?.id ?? null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.subject} ${item.message} ${item.category} ${item.customer.name} ${item.customer.phone}`
        .toLowerCase()
        .includes(needle),
    );
  }, [items, query]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  async function review(action: "reward" | "reject") {
    if (!selected || adminNote.trim().length < 3) {
      setError("Add a short review note explaining your decision.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminWorkspaceApi.reviewFeedback(token, selected.id, {
        action,
        rewardPoints: action === "reward" ? points : 0,
        adminNote: adminNote.trim(),
      });
      setSuccess(action === "reward" ? `${points.toLocaleString("en-IN")} points awarded to ${selected.customer.name}.` : "Feedback marked as not eligible for a reward.");
      setAdminNote("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review feedback.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Voice of customer"
        title="Customer feedback"
        description="Verify genuine bug reports and ideas, then reward customers with traceable loyalty points."
        actions={<Button variant="secondary" onClick={() => void load()}><RefreshCw size={16} /> Refresh</Button>}
      />
      {(error || success) && (
        <div role="status" className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {error || success}
        </div>
      )}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Pending review", counts.pending ?? 0, Bug, "text-amber-600 bg-amber-50"],
          ["Rewarded", counts.rewarded ?? 0, Award, "text-emerald-700 bg-emerald-50"],
          ["Not eligible", counts.rejected ?? 0, XCircle, "text-red-600 bg-red-50"],
        ].map(([label, value, Icon, tone]) => {
          const MetricIcon = Icon as typeof Bug;
          return <Card key={String(label)} className="flex items-center gap-4 p-5"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><MetricIcon size={20} /></span><div><p className="text-2xl font-extrabold text-slate-950">{Number(value).toLocaleString("en-IN")}</p><p className="text-xs font-semibold text-slate-500">{String(label)}</p></div></Card>;
        })}
      </div>
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "rewarded", "rejected"].map((status) => (
              <button key={status} onClick={() => setFilter(status)} className={`rounded-xl px-3.5 py-2 text-xs font-bold capitalize transition ${filter === status ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {status === "rejected" ? "Not eligible" : status}
              </button>
            ))}
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Search feedback or customer" />
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading customer feedback…</div>
        ) : !visible.length ? (
          <div className="p-10 text-center"><MessageSquareText className="mx-auto text-slate-300" size={34} /><p className="mt-3 font-bold text-slate-700">No feedback found</p><p className="mt-1 text-sm text-slate-500">New submissions will appear here automatically.</p></div>
        ) : (
          <div className="grid min-h-[560px] lg:grid-cols-[minmax(340px,.9fr)_minmax(430px,1.2fr)]">
            <div className="max-h-[720px] overflow-y-auto border-b border-slate-100 lg:border-b-0 lg:border-r">
              {visible.map((item) => (
                <button key={item.id} onClick={() => { setSelectedId(item.id); setAdminNote(""); setSuccess(""); }} className={`w-full border-b border-slate-100 p-5 text-left transition ${selectedId === item.id ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}>
                  <div className="flex items-start justify-between gap-3"><span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">{item.category}</span><StatusBadge tone={feedbackTone(item.status)}>{item.status === "rejected" ? "not eligible" : item.status}</StatusBadge></div>
                  <h3 className="mt-3 line-clamp-1 font-bold text-slate-900">{item.subject}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{item.message}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span className="font-semibold text-slate-600">{item.customer.name}</span><span>{readableDate(item.createdAt)}</span></div>
                </button>
              ))}
            </div>
            {selected && <FeedbackReview selected={selected} points={points} setPoints={setPoints} adminNote={adminNote} setAdminNote={setAdminNote} saving={saving} onReview={review} />}
          </div>
        )}
      </Card>
    </>
  );
}

function FeedbackReview({ selected, points, setPoints, adminNote, setAdminNote, saving, onReview }: {
  selected: CustomerFeedback;
  points: number;
  setPoints: (value: number) => void;
  adminNote: string;
  setAdminNote: (value: string) => void;
  saving: boolean;
  onReview: (action: "reward" | "reject") => Promise<void>;
}) {
  return (
    <article className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-emerald-700">Submission detail</p><h2 className="mt-1 text-xl font-extrabold text-slate-950">{selected.subject}</h2></div><StatusBadge tone={feedbackTone(selected.status)}>{selected.status === "rejected" ? "not eligible" : selected.status}</StatusBadge></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p><p className="mt-1 font-bold">{selected.customer.name}</p><p className="text-xs text-slate-500">{selected.customer.phone}{selected.customer.email ? ` · ${selected.customer.email}` : ""}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reported</p><p className="mt-1 font-bold capitalize">{selected.category}</p><p className="text-xs text-slate-500">{readableDate(selected.createdAt)}</p></div></div>
      <div className="mt-4 rounded-2xl border border-slate-200 p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{selected.message}</p>{selected.pageUrl && <a href={selected.pageUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700">Open reported page <ExternalLink size={14} /></a>}</div>
      <AttachmentGallery images={selected.images} />
      {selected.status === "pending" ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5"><div className="flex items-center gap-2"><Gift className="text-emerald-700" size={19} /><h3 className="font-bold text-slate-900">Review & reward</h3></div><label className="mt-4 block text-xs font-bold text-slate-600">Points to award<input type="number" min={1} max={100000} value={points} onChange={(event) => setPoints(Math.max(1, Math.round(Number(event.target.value) || 1)))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold" /></label><label className="mt-3 block text-xs font-bold text-slate-600">Decision note<textarea rows={3} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="What did you verify, or why is this not eligible?" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal" /></label><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end"><Button disabled={saving} variant="danger" onClick={() => void onReview("reject")}><XCircle size={16} /> Not eligible</Button><Button disabled={saving} onClick={() => void onReview("reward")}><Award size={16} /> {saving ? "Saving…" : "Verify & award"}</Button></div></div>
      ) : (
        <div className={`mt-5 rounded-2xl p-5 ${selected.status === "rewarded" ? "bg-emerald-50" : "bg-red-50"}`}><div className="flex items-center gap-2 font-bold"><CheckCircle2 size={18} />Decision recorded</div><p className="mt-2 text-sm leading-6 text-slate-600">{selected.adminNote}</p><p className="mt-3 text-xs font-bold text-slate-500">{selected.reviewedBy ? `Reviewed by ${selected.reviewedBy}` : "Reviewed"}{selected.reviewedAt ? ` · ${readableDate(selected.reviewedAt)}` : ""}{selected.rewardPoints ? ` · ${selected.rewardPoints.toLocaleString("en-IN")} points awarded` : ""}</p></div>
      )}
    </article>
  );
}

function AttachmentGallery({ images }: { images: CustomerFeedback["images"] }) {
  const [active, setActive] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <>
      <section className="mt-4 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ImageIcon className="text-violet-600" size={18} /><h3 className="text-sm font-bold text-slate-900">Customer screenshots</h3></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">{images.length} {images.length === 1 ? "image" : "images"}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => <button key={image.id} type="button" onClick={() => setActive(image.url)} aria-label={`View screenshot ${index + 1}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 text-left ring-1 ring-slate-200"><span className="block h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${image.url})` }} /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-2 pt-7 text-[10px] font-bold text-white">Open screenshot {index + 1}</span></button>)}
        </div>
      </section>
      {active && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Feedback screenshot viewer" onClick={() => setActive(null)}><button type="button" onClick={() => setActive(null)} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close screenshot"><X size={22} /></button><div className="max-h-[88vh] max-w-[92vw]" onClick={(event) => event.stopPropagation()}><img src={active} alt="Customer feedback screenshot" className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl" /></div></div>}
    </>
  );
}

export function LoyaltySettingsPanel({ token }: { token: string }) {
  const [setting, setSetting] = useState<LoyaltySetting>(emptySetting);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void adminWorkspaceApi.loyaltySetting(token)
      .then((value) => { if (active) setSetting(value); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load loyalty settings."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      setSetting(await adminWorkspaceApi.updateLoyaltySetting(token, setting));
      setMessage("Loyalty rules saved. Customers will see the updated value immediately.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save loyalty settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card className="p-8 text-sm font-semibold text-slate-500">Loading loyalty setup…</Card>;
  const estimatedValue = setting.defaultFeedbackReward * setting.rupeesPerPoint;
  return (
    <>
      <PageHeading eyebrow="Rewards configuration" title="Loyalty setup" description="Control what one point is worth and the default reward used while reviewing genuine customer feedback." />
      {(error || message) && <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</div>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><SlidersHorizontal size={21} /></span><div><h2 className="font-bold">Point rules</h2><p className="text-xs text-slate-300">Applied platform-wide</p></div></div></div>
          <div className="space-y-5 p-6">
            <label className="block"><span className="text-sm font-bold text-slate-800">Value of one loyalty point</span><p className="mt-1 text-xs text-slate-500">The rupee value customers see for each point.</p><div className="relative mt-3"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span><input aria-label="Rupees per point" type="number" min="0.01" max="1000" step="0.01" value={setting.rupeesPerPoint} onChange={(event) => setSetting({ ...setting, rupeesPerPoint: Number(event.target.value) })} className="h-12 w-full rounded-xl border border-slate-200 pl-9 pr-4 font-bold" /></div></label>
            <label className="block"><span className="text-sm font-bold text-slate-800">Minimum points to use</span><p className="mt-1 text-xs text-slate-500">Customers must reach this balance before redemption.</p><input aria-label="Minimum points" type="number" min="1" max="100000" value={setting.minimumRedeemPoints} onChange={(event) => setSetting({ ...setting, minimumRedeemPoints: Math.round(Number(event.target.value)) })} className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 font-bold" /></label>
            <label className="block"><span className="text-sm font-bold text-slate-800">Default feedback reward</span><p className="mt-1 text-xs text-slate-500">Pre-filled for admins; it can still be adjusted per verified report.</p><input aria-label="Default reward" type="number" min="1" max="100000" value={setting.defaultFeedbackReward} onChange={(event) => setSetting({ ...setting, defaultFeedbackReward: Math.round(Number(event.target.value)) })} className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 font-bold" /></label>
            <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><span><b className="block text-sm">Loyalty programme active</b><span className="text-xs text-slate-500">Show point value and redemption guidance to customers.</span></span><button role="switch" aria-checked={setting.isActive} onClick={() => setSetting({ ...setting, isActive: !setting.isActive })} className={`relative h-7 w-12 rounded-full transition ${setting.isActive ? "bg-emerald-600" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${setting.isActive ? "left-6" : "left-1"}`} /></button></label>
            <Button disabled={saving} className="w-full sm:w-auto" onClick={() => void save()}><Save size={16} />{saving ? "Saving…" : "Save loyalty rules"}</Button>
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white"><Sparkles size={24} /><p className="mt-7 text-xs font-bold uppercase tracking-[.16em] text-violet-200">Customer value preview</p><p className="mt-2 text-3xl font-extrabold">{setting.defaultFeedbackReward.toLocaleString("en-IN")} points</p><p className="mt-1 text-sm text-white/75">worth {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(estimatedValue)}</p><div className="mt-5 rounded-xl bg-white/10 p-3 text-xs leading-5">1 point = ₹{setting.rupeesPerPoint.toLocaleString("en-IN")}</div></Card>
          <Card className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="text-emerald-600" size={19} /><h3 className="font-bold">Safe reward flow</h3></div><ul className="mt-4 space-y-3 text-sm text-slate-600"><li>• A feedback report can be rewarded only once.</li><li>• Every award records the reviewing admin.</li><li>• Customers receive an in-app points notification.</li><li>• The points ledger keeps a permanent audit trail.</li></ul></Card>
        </div>
      </div>
    </>
  );
}
