"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type Notice = {
  id: string;
  title: string;
  message: string;
  publishedAt: string;
};
const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export function VendorNotifications({ token }: { token: string }) {
  const [items, setItems] = useState<Notice[]>([]);
  useEffect(() => {
    const load = async () => {
      const response = await fetch(`${base}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) setItems((await response.json()).items ?? []);
    };
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [token]);
  return (
    <details className="relative">
      <summary
        className="relative grid h-10 w-10 cursor-pointer list-none place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {items.length > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        )}
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold">
          Admin notifications
        </div>
        {items.length ? (
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <article
                className="border-b border-slate-100 px-4 py-3"
                key={item.id}
              >
                <b className="block text-sm">{item.title}</b>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {item.message}
                </p>
                <time className="mt-2 block text-[11px] text-slate-400">
                  {new Date(item.publishedAt).toLocaleDateString("en-IN")}
                </time>
              </article>
            ))}
          </div>
        ) : (
          <p className="p-4 text-sm text-slate-500">No notifications yet.</p>
        )}
      </div>
    </details>
  );
}
