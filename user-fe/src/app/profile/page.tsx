"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Package, UserRound } from "lucide-react";
import { useSelector } from "react-redux";

import type { AuthRootState } from "@/src/store/authStore";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type Profile = {
  id: string;
  name: string;
  phone: string;
  role: string;
  mustChangePassword: boolean;
};

export default function ProfilePage() {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;

    fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error ?? data.message ?? "Unable to load your profile.");
        }

        setProfile(data as Profile);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Unable to load your profile.");
      });
  }, [session]);

  if (!session) {
    return (
      <main className="grid min-h-[calc(100vh-82px)] place-items-center p-5">
        <section className="rounded-2xl border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
          <Link href="/login" className="mt-5 inline-block rounded-xl bg-[#45C9A5] px-5 py-3 font-semibold">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-[#F8FBFA] py-6 sm:py-10">
      <div className="container-custom max-w-4xl">
        <section className="overflow-hidden rounded-3xl border border-[#E5EAE8] bg-white shadow-[0_18px_50px_rgba(23,33,43,.06)]">
          <header className="bg-gradient-to-r from-[#101936] via-[#15345C] to-[#5B3DF5] p-6 text-white sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={30} />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[.16em] text-[#A9F2DC]">MY ACCOUNT</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{profile?.name ?? session.name}</h1>
                <p className="mt-1 text-sm text-white/75">Your health, orders and delivery preferences.</p>
              </div>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            {error && <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-[#F6F8F9] p-4">
                <dt className="text-sm text-[#6B7280]">Mobile number</dt>
                <dd className="mt-1 font-semibold">{profile?.phone ?? "Loading…"}</dd>
              </div>
              <div className="rounded-xl bg-[#F6F8F9] p-4">
                <dt className="text-sm text-[#6B7280]">Account type</dt>
                <dd className="mt-1 font-semibold capitalize">{profile?.role ?? "customer"}</dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href="/orders" className="flex items-center justify-between rounded-2xl border border-[#DDE5E2] p-4 text-sm font-bold text-[#17212B] transition hover:border-[#45C9A5] hover:bg-[#EAFAF5]">
                <span className="flex items-center gap-3"><Package size={18} className="text-[#2EB68F]" />My orders</span>
                →
              </Link>
              <Link href="/" className="flex items-center justify-between rounded-2xl border border-[#DDE5E2] p-4 text-sm font-bold text-[#17212B] transition hover:border-[#45C9A5] hover:bg-[#EAFAF5]">
                <span className="flex items-center gap-3"><MapPin size={18} className="text-[#2EB68F]" />Manage delivery location</span>
                →
              </Link>
            </div>

            <p className="mt-6 text-xs leading-5 text-[#6B7280]">
              Profile editing will appear here when the customer update endpoint is available.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
