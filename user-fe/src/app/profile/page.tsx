"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
        if (!response.ok)
          throw new Error(
            data.error ?? data.message ?? "Unable to load your profile.",
          );
        setProfile(data as Profile);
      })
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load your profile.",
        ),
      );
  }, [session]);

  if (!session)
    return (
      <main className="grid min-h-[calc(100vh-82px)] place-items-center p-5">
        <section className="rounded-2xl border bg-white p-8 text-center">
          <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-[#45C9A5] px-5 py-3 font-semibold"
          >
            Sign in
          </Link>
        </section>
      </main>
    );

  return (
    <main className="mx-auto min-h-[calc(100vh-82px)] max-w-3xl p-5 sm:p-10">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold tracking-[0.15em] text-[#2EB68F]">
          MY PROFILE
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {profile?.name ?? session.name}
        </h1>
        {error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>
        )}
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F6F8F9] p-4">
            <dt className="text-sm text-[#6B7280]">Mobile number</dt>
            <dd className="mt-1 font-semibold">
              {profile?.phone ?? "Loading…"}
            </dd>
          </div>
          <div className="rounded-xl bg-[#F6F8F9] p-4">
            <dt className="text-sm text-[#6B7280]">Account type</dt>
            <dd className="mt-1 font-semibold capitalize">
              {profile?.role ?? "customer"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-sm text-[#6B7280]">
          Profile editing is not available yet because the backend does not
          currently provide a customer profile-update endpoint.
        </p>
      </section>
    </main>
  );
}
