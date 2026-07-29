"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Gift,
  History,
  MapPin,
  MessageSquareHeart,
  Package,
  Phone,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  feedbackLoyaltyApi,
  type LoyaltySummary,
} from "@/src/lib/feedbackLoyalty";
import type { AuthRootState } from "@/src/store/authStore";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
type Profile = {
  id: string;
  name: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
};

const emptyLoyalty: LoyaltySummary = {
  balance: 0,
  lifetimeEarned: 0,
  lifetimeUsed: 0,
  rupeesPerPoint: 1,
  minimumRedeemPoints: 1,
  isActive: true,
  transactions: [],
  unreadRewards: [],
};

export default function ProfilePage() {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary>(emptyLoyalty);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    const profileRequest = fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          data.error ?? data.message ?? "Unable to load your profile.",
        );
      return data as Profile;
    });
    void Promise.all([
      profileRequest,
      feedbackLoyaltyApi.loyalty(session.token),
      feedbackLoyaltyApi.feedback(session.token),
    ])
      .then(([customer, rewards, feedback]) => {
        if (active) {
          setProfile(customer);
          setLoyalty(rewards);
          setFeedbackCount(feedback.items.length);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load your profile.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session?.token]);

  if (!session)
    return (
      <main className="grid min-h-[calc(100vh-82px)] place-items-center bg-[#F8F7FC] p-5">
        <section className="rounded-3xl border border-[#E9E4F3] bg-white p-8 text-center">
          <UserRound className="mx-auto text-[#5B3DF5]" size={38} />
          <h1 className="mt-4 text-2xl font-extrabold">
            Sign in to view your profile
          </h1>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-[#5B3DF5] px-5 py-3 font-bold text-white"
          >
            Sign in
          </Link>
        </section>
      </main>
    );

  const redeemProgress = Math.min(
    100,
    (loyalty.balance / Math.max(loyalty.minimumRedeemPoints, 1)) * 100,
  );
  const walletValue = loyalty.balance * loyalty.rupeesPerPoint;
  return (
    <main className="min-h-[calc(100vh-82px)] bg-[#F8F7FC] py-6 sm:py-10">
      <div className="container-custom max-w-6xl">
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#130F25] via-[#2B1D5A] to-[#5B3DF5] p-6 text-white shadow-[0_24px_70px_rgba(53,34,143,.22)] sm:p-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
                <UserRound size={30} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#BEB2FF]">
                  My account
                </p>
                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                  {profile?.name ?? session.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/65">
                  <Phone size={14} />{" "}
                  {profile?.phone ?? (loading ? "Loading…" : "Customer")}
                </p>
              </div>
            </div>
            <Link
              href="/feedback"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-[#5B3DF5] transition "
            >
              <MessageSquareHeart size={18}  /> Share feedback
            </Link>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-[#E6DFF3] bg-white shadow-[0_14px_45px_rgba(53,34,143,.06)]">
              <div className="relative overflow-hidden bg-gradient-to-r from-[#F1EFFF] to-[#E8FAF5] p-6 sm:p-7">
                <Sparkles
                  className="absolute -right-2 -top-3 text-white/70"
                  size={100}
                />
                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.15em] text-[#5B3DF5]">
                      <Star size={15} fill="currentColor" /> Pharma2U loyalty
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-tight text-[#201C35]">
                      {loyalty.balance.toLocaleString("en-IN")}{" "}
                      <span className="text-lg font-bold text-[#777386]">
                        points
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[#6E697B]">
                      Estimated value ₹
                      {walletValue.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-[#5B3DF5] shadow-sm">
                    <WalletCards size={28} />
                  </span>
                </div>
              </div>
              <div className="p-6 sm:p-7">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Lifetime earned", loyalty.lifetimeEarned, Award],
                    ["Points used", loyalty.lifetimeUsed, Gift],
                    ["Feedback shared", feedbackCount, MessageSquareHeart],
                  ].map(([label, value, Icon]) => {
                    const ItemIcon = Icon as typeof Award;
                    return (
                      <div
                        key={String(label)}
                        className="rounded-2xl bg-[#FAF9FC] p-4"
                      >
                        <ItemIcon className="text-[#5B3DF5]" size={18} />
                        <p className="mt-3 text-xl font-extrabold">
                          {Number(value).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-[#777386]">
                          {String(label)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {loyalty.isActive && (
                  <div className="mt-5 rounded-2xl border border-[#E9E4F3] p-4">
                    <div className="flex justify-between gap-3 text-xs">
                      <span className="font-bold text-[#28243A]">
                        Redemption readiness
                      </span>
                      <span className="text-[#777386]">
                        Minimum{" "}
                        {loyalty.minimumRedeemPoints.toLocaleString("en-IN")}{" "}
                        points
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEEAF4]">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#5B3DF5] to-[#14B8A6] transition-all"
                        style={{ width: `${redeemProgress}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs leading-5 text-[#777386]">
                      1 point = ₹
                      {loyalty.rupeesPerPoint.toLocaleString("en-IN")}.{" "}
                      {loyalty.balance >= loyalty.minimumRedeemPoints
                        ? "Your balance is ready to use on eligible Pharma2U purchases."
                        : `Earn ${(loyalty.minimumRedeemPoints - loyalty.balance).toLocaleString("en-IN")} more points to reach the minimum.`}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[#E9E4F3] bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#5B3DF5]">
                    Points ledger
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">
                    Recent activity
                  </h2>
                </div>
                <History className="text-[#B4ABC4]" />
              </div>
              {!loyalty.transactions.length ? (
                <div className="mt-5 rounded-2xl bg-[#FAF9FC] p-8 text-center">
                  <Gift className="mx-auto text-[#C5BDD8]" />
                  <p className="mt-3 text-sm font-bold">
                    No points activity yet
                  </p>
                  <p className="mt-1 text-xs text-[#777386]">
                    Verified feedback rewards will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-[#EEEAF4]">
                  {loyalty.transactions.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-4">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.points > 0 ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}
                      >
                        <Gift size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#28243A]">
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9A95A5]">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-IN",
                            { dateStyle: "medium" },
                          )}
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-extrabold ${item.points > 0 ? "text-emerald-700" : "text-[#5B3DF5]"}`}
                      >
                        {item.points > 0 ? "+" : ""}
                        {item.points.toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-[#E9E4F3] bg-white p-5">
              <h2 className="font-extrabold">Quick actions</h2>
              <div className="mt-4 space-y-2">
                {[
                  ["/orders", "My orders", Package],
                  ["/", "Manage delivery location", MapPin],
                  ["/feedback", "Report a bug or idea", MessageSquareHeart],
                ].map(([href, label, Icon]) => {
                  const ActionIcon = Icon as typeof Package;
                  return (
                    <Link
                      key={String(href) + String(label)}
                      href={String(href)}
                      className="flex items-center gap-3 rounded-2xl border border-[#E9E4F3] p-4 text-sm font-bold transition hover:border-[#BFB2EB] hover:bg-[#FAF9FE]"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#F1EFFF] text-[#5B3DF5]">
                        <ActionIcon size={17} />
                      </span>
                      <span className="flex-1">{String(label)}</span>
                      <ArrowRight className="text-[#A59DAF]" size={16} />
                    </Link>
                  );
                })}
              </div>
            </section>
            <section className="rounded-3xl bg-[#19132D] p-6 text-white">
              <Gift className="text-[#7CE8CA]" size={24} />
              <h2 className="mt-5 text-lg font-extrabold">
                Earn points by helping
              </h2>
              <p className="mt-2 text-xs leading-6 text-white/65">
                Share clear, original bug reports or useful platform
                suggestions. Our team verifies each submission before awarding
                points.
              </p>
              <Link
                href="/feedback"
                className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#9DF0D8]"
              >
                Share feedback <ArrowRight size={15} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
