"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

type Notice = { id: string; title: string; message: string; publishedAt: string };
export function NotificationsMenu({ token }: { token: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const load = async () => { const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"}/notifications`, { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }); if (response.ok) setItems((await response.json()).items ?? []); };
    void load(); const id = window.setInterval(() => void load(), 30_000); return () => window.clearInterval(id);
  }, [token]);
  return <div className="relative"><button onClick={() => setOpen((v) => !v)} aria-label="Notifications" className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={19} />{items.length > 0 && <i className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />}</button>{open && <div className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-80"><div className="mb-3 flex items-center justify-between"><strong className="text-sm">Notifications</strong><button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400"><X size={17} /></button></div>{items.length ? <div className="space-y-2">{items.map((item) => <article key={item.id} className="rounded-xl bg-slate-50 p-3"><strong className="block text-sm text-slate-800">{item.title}</strong><p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p><small className="mt-1 block text-[10px] text-slate-400">{new Date(item.publishedAt).toLocaleDateString("en-IN")}</small></article>)}</div> : <p className="py-8 text-center text-sm text-slate-400">No notifications yet.</p>}</div>}</div>;
}
