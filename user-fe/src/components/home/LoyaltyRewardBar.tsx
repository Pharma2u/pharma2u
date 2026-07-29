"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift, Sparkles, X } from "lucide-react";
import { useSelector } from "react-redux";
import { feedbackLoyaltyApi, type LoyaltySummary } from "@/src/lib/feedbackLoyalty";
import type { AuthRootState } from "@/src/store/authStore";

export default function LoyaltyRewardBar() {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const reward = summary?.unreadRewards[0];

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    void feedbackLoyaltyApi.loyalty(session.token).then((value) => { if (active) setSummary(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [session?.token]);

  if (!session || !reward) return null;
  const points = Number(reward.payload?.points ?? 0);
  async function dismiss() {
    if (!reward) return;
    setSummary((current) => current ? { ...current, unreadRewards: current.unreadRewards.filter((item) => item.id !== reward.id) } : current);
    await feedbackLoyaltyApi.markRewardRead(session!.token, reward.id).catch(() => undefined);
  }
  return (
    <aside className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#5B3DF5] via-[#694BEF] to-[#14B8A6] p-[1px] shadow-[0_12px_35px_rgba(91,61,245,.18)]">
      <div className="flex items-center gap-3 rounded-[15px] bg-white/95 px-4 py-3 sm:px-5">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#F1EFFF] text-[#5B3DF5]"><Gift size={21} /><Sparkles className="absolute -right-1 -top-1 text-amber-500" size={13} /></span>
        <div className="min-w-0 flex-1"><p className="font-extrabold text-[#201C35]">You got {points.toLocaleString("en-IN")} loyalty points!</p><p className="truncate text-xs text-[#777386]">Thanks for helping us improve{reward.payload?.subject ? ` · ${reward.payload.subject}` : ""}.</p></div>
        <Link href="/profile" className="hidden rounded-xl bg-[#5B3DF5] px-4 py-2 text-xs font-bold text-white sm:block">View points</Link>
        <button type="button" onClick={() => void dismiss()} aria-label="Dismiss points notification" className="rounded-lg p-2 text-[#777386] hover:bg-[#F1EFFF] hover:text-[#5B3DF5]"><X size={17} /></button>
      </div>
    </aside>
  );
}
