"use client";
import { useCallback, useEffect, useState } from "react";
import { adminOperations } from "@/lib/operationsApi";

type Rider = { id: string; name: string; phone: string; kyc?: { aadharNumber: string; panNumber: string; drivingLicenseNumber: string; vehicleType: string; vehicleNumber: string; aadharImageUrl: string; panImageUrl: string; dlImageUrl: string } };

export function RiderApplicationsPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Rider[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState("");
  const load = useCallback(async () => { try { setError(""); setItems((await adminOperations.pending(token)).items); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load rider applications."); } }, [token]);
  useEffect(() => { void load(); }, [load]);
  async function approve(id: string) { setBusy(id); try { const rider = await adminOperations.approve(token, id); setNotice(`Rider approved. Phone: ${rider.phone}. Temporary password: ${rider.temporaryPassword}`); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to approve rider."); } finally { setBusy(""); } }
  async function reject(id: string) { const reason = reasons[id]?.trim(); if (!reason) return setError("Enter a rejection reason before rejecting."); setBusy(id); try { await adminOperations.reject(token, id, reason); setNotice("Rider application rejected."); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Unable to reject rider."); } finally { setBusy(""); } }
  return <section className="mx-auto mt-8 max-w-5xl space-y-5">
    <div className="flex items-end justify-between gap-4"><div><p className="text-sm font-bold text-emerald-600">COMPLIANCE QUEUE</p><h2 className="mt-2 text-2xl font-bold">Rider applications</h2><p className="mt-2 text-sm text-slate-500">Review all submitted identity, vehicle, and document details before accepting or rejecting.</p></div><button onClick={() => void load()} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">Refresh</button></div>
    {(error || notice) && <p className={`rounded-xl p-4 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || notice}</p>}
    {items.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">No pending rider applications.</p>}
    {items.map((rider) => <article key={rider.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{rider.name}</h3><p className="mt-1 text-sm text-slate-500">{rider.phone}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">Pending review</span></div>
      {rider.kyc ? <><dl className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><Detail label="Aadhaar number" value={rider.kyc.aadharNumber}/><Detail label="PAN number" value={rider.kyc.panNumber}/><Detail label="Driving licence" value={rider.kyc.drivingLicenseNumber}/><Detail label="Vehicle type" value={rider.kyc.vehicleType}/><Detail label="Vehicle number" value={rider.kyc.vehicleNumber}/></dl><div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-emerald-700"><a target="_blank" rel="noreferrer" href={rider.kyc.aadharImageUrl}>View Aadhaar</a><a target="_blank" rel="noreferrer" href={rider.kyc.panImageUrl}>View PAN</a><a target="_blank" rel="noreferrer" href={rider.kyc.dlImageUrl}>View driving licence</a></div></> : <p className="mt-4 text-sm text-red-700">KYC details are missing.</p>}
      <label className="mt-5 block text-sm font-medium">Rejection reason <span className="text-red-600">*</span><textarea value={reasons[rider.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [rider.id]: event.target.value }))} className="mt-2 min-h-20 w-full rounded-xl border p-3" placeholder="Required only when rejecting"/></label>
      <div className="mt-4 flex gap-3"><button disabled={busy === rider.id} onClick={() => void approve(rider.id)} className="rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-slate-950 disabled:opacity-60">Approve</button><button disabled={busy === rider.id} onClick={() => void reject(rider.id)} className="rounded-xl border border-red-200 px-4 py-2 font-semibold text-red-700 disabled:opacity-60">Reject</button></div>
    </article>)}
  </section>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-900">{value}</dd></div>; }