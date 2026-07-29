"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bug,
  CheckCircle2,
  Gift,
  ImagePlus,
  Lightbulb,
  LoaderCircle,
  MessageSquareHeart,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
  feedbackLoyaltyApi,
  type FeedbackItem,
} from "@/src/lib/feedbackLoyalty";
import type { AuthRootState } from "@/src/store/authStore";

const categories = [
  ["bug", "Bug or error", Bug],
  ["delivery", "Delivery", MessageSquareHeart],
  ["medicine", "Medicine details", ShieldCheck],
  ["payment", "Payment", MessageSquareHeart],
  ["suggestion", "Suggestion", Lightbulb],
  ["other", "Other", MessageSquareHeart],
] as const;

function statusStyle(status: FeedbackItem["status"]) {
  return status === "rewarded"
    ? "bg-emerald-50 text-emerald-700"
    : status === "rejected"
      ? "bg-slate-100 text-slate-600"
      : "bg-amber-50 text-amber-700";
}

export default function FeedbackPage() {
  const session = useSelector((state: AuthRootState) => state.auth.session);
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [draft, setDraft] = useState({
    category: "bug",
    subject: "",
    message: "",
    pageUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<File[]>([]);

  function addImages(selected: FileList | File[]) {
    const incoming = Array.from(selected);
    const invalid = incoming.find(
      (file) =>
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024,
    );
    if (invalid) {
      setError(
        "Screenshots must be JPEG, PNG, or WebP images no larger than 5 MB.",
      );
      return;
    }
    const combined = [...images, ...incoming].filter(
      (file, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.name === file.name &&
            candidate.size === file.size &&
            candidate.lastModified === file.lastModified,
        ) === index,
    );
    if (combined.length > 5) setError("You can attach up to 5 screenshots.");
    else setError("");
    setImages(combined.slice(0, 5));
  }

  useEffect(() => {
    const token = session?.token;
    if (!token) return;
    let active = true;
    void feedbackLoyaltyApi
      .feedback(token)
      .then((value) => {
        if (active) setItems(value.items);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Unable to load feedback.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!session?.token) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const saved = await feedbackLoyaltyApi.submit(
        session.token,
        { ...draft, pageUrl: draft.pageUrl.trim() || null },
        images,
      );
      setItems((current) => [saved, ...current]);
      setDraft({ category: "bug", subject: "", message: "", pageUrl: "" });
      setImages([]);
      setSuccess(true);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send feedback.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!session)
    return (
      <main className="grid min-h-[calc(100vh-82px)] place-items-center bg-[#F8F7FC] p-5">
        <section className="max-w-md rounded-3xl border border-[#E9E4F3] bg-white p-8 text-center shadow-sm">
          <MessageSquareHeart className="mx-auto text-[#5B3DF5]" size={38} />
          <h1 className="mt-4 text-2xl font-extrabold">
            Sign in to share feedback
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#777386]">
            Your account helps us follow up and award points for verified
            reports.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-[#5B3DF5] px-5 py-3 text-sm font-bold text-white"
          >
            Sign in
          </Link>
        </section>
      </main>
    );

  return (
    <main className="min-h-[calc(100vh-82px)] bg-[#F8F7FC] py-7 sm:py-10">
      <div className="container-custom max-w-6xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#5B3DF5]"
        >
          <ArrowLeft size={16} /> Back to profile
        </Link>
        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]">
          <section className="overflow-hidden rounded-3xl border border-[#E9E4F3] bg-white shadow-[0_18px_50px_rgba(53,34,143,.07)]">
            <header className="bg-gradient-to-br from-[#16112C] via-[#33236E] to-[#5B3DF5] p-6 text-white sm:p-8">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
                  <MessageSquareHeart size={27} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-[#BEB2FF]">
                    Help us improve
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                    Share feedback
                  </h1>
                  <p className="mt-1 text-sm text-white/70">
                    Genuine reports may earn loyalty points after review.
                  </p>
                </div>
              </div>
            </header>
            <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
              {success && (
                <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircle2 className="shrink-0" size={19} />
                  <span>
                    <b className="block">Feedback sent</b>Our team will verify
                    it. Any reward will appear on your home page and profile.
                  </span>
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700"
                >
                  {error}
                </p>
              )}
              <fieldset>
                <legend className="text-sm font-extrabold text-[#28243A]">
                  What is this about?
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDraft({ ...draft, category: id })}
                      className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${draft.category === id ? "border-[#5B3DF5] bg-[#F1EFFF] text-[#5B3DF5] ring-2 ring-[#5B3DF5]/10" : "border-[#E9E4F3] text-[#6E697B] hover:bg-[#FAF9FE]"}`}
                    >
                      <Icon size={19} />
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="block text-sm font-extrabold text-[#28243A]">
                Short title
                <input
                  required
                  minLength={5}
                  maxLength={100}
                  value={draft.subject}
                  onChange={(event) =>
                    setDraft({ ...draft, subject: event.target.value })
                  }
                  placeholder="Example: Cart count does not update"
                  className="mt-2 h-12 w-full rounded-xl border border-[#DDD6E9] bg-[#FAF9FC] px-4 text-sm font-normal outline-none focus:border-[#5B3DF5] focus:bg-white focus:ring-4 focus:ring-[#5B3DF5]/10"
                />
              </label>
              <label className="block text-sm font-extrabold text-[#28243A]">
                Tell us what happened
                <textarea
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={6}
                  value={draft.message}
                  onChange={(event) =>
                    setDraft({ ...draft, message: event.target.value })
                  }
                  placeholder="What did you expect, what happened instead, and how can we reproduce it?"
                  className="mt-2 w-full resize-y rounded-xl border border-[#DDD6E9] bg-[#FAF9FC] p-4 text-sm font-normal leading-6 outline-none focus:border-[#5B3DF5] focus:bg-white focus:ring-4 focus:ring-[#5B3DF5]/10"
                />
                <span className="mt-1 block text-right text-[11px] font-normal text-[#9A95A5]">
                  {draft.message.length}/2000
                </span>
              </label>
              <label className="block text-sm font-extrabold text-[#28243A]">
                Page link{" "}
                <span className="font-normal text-[#9A95A5]">(optional)</span>
                <input
                  type="url"
                  maxLength={500}
                  value={draft.pageUrl}
                  onChange={(event) =>
                    setDraft({ ...draft, pageUrl: event.target.value })
                  }
                  placeholder="https://…"
                  className="mt-2 h-12 w-full rounded-xl border border-[#DDD6E9] bg-[#FAF9FC] px-4 text-sm font-normal outline-none focus:border-[#5B3DF5] focus:bg-white"
                />
              </label>
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[#28243A]">
                      Screenshots{" "}
                      <span className="font-normal text-[#9A95A5]">
                        (optional)
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-[#9A95A5]">
                      Add up to 5 images · JPEG, PNG or WebP · 5 MB each
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#777386]">
                    {images.length}/5
                  </span>
                </div>
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((file, index) => (
                      <FilePreview
                        key={`${file.name}-${file.lastModified}`}
                        file={file}
                        onRemove={() =>
                          setImages((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
                {images.length < 5 && (
                  <label className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#CDC3E3] bg-[#FAF9FE] px-5 text-center transition hover:border-[#5B3DF5] hover:bg-[#F5F1FF]">
                    <ImagePlus className="text-[#5B3DF5]" size={24} />
                    <span className="mt-2 text-sm font-extrabold text-[#5B3DF5]">
                      Choose screenshots
                    </span>
                    <span className="mt-1 text-[11px] text-[#9A95A5]">
                      You can select several images together
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        if (event.target.files) addImages(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <button
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] text-sm font-bold text-white transition hover:bg-[#4526D8] disabled:opacity-60"
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Send size={17} />
                )}
                {saving ? "Sending…" : "Send feedback"}
              </button>
            </form>
          </section>
          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-[#E9E4F3] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <Gift className="text-[#5B3DF5]" size={20} />
                <h2 className="font-extrabold">Your submissions</h2>
              </div>
              {loading ? (
                <p className="mt-5 text-sm text-[#777386]">Loading…</p>
              ) : !items.length ? (
                <div className="mt-5 rounded-2xl bg-[#FAF9FE] p-6 text-center">
                  <MessageSquareHeart className="mx-auto text-[#C5BDD8]" />
                  <p className="mt-3 text-sm font-bold">No feedback yet</p>
                </div>
              ) : (
                <div className="mt-4 max-h-[600px] space-y-3 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-[#E9E4F3] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B3DF5]">
                          {item.category}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold capitalize ${statusStyle(item.status)}`}
                        >
                          {item.status === "rejected"
                            ? "reviewed"
                            : item.status}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-extrabold">
                        {item.subject}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#777386]">
                        {item.message}
                      </p>
                      {item.images.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-x-auto">
                          {item.images.map((image) => (
                            <a
                              key={image.id}
                              href={image.url}
                              target="_blank"
                              rel="noreferrer"
                              aria-label="Open feedback screenshot"
                              className="h-14 w-16 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-[#E5DFF0]"
                              style={{ backgroundImage: `url(${image.url})` }}
                            />
                          ))}
                        </div>
                      )}
                      {item.rewardPoints > 0 && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                          <Gift size={14} /> +
                          {item.rewardPoints.toLocaleString("en-IN")} points
                        </p>
                      )}
                      <p className="mt-3 text-[10px] text-[#9A95A5]">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-3xl bg-[#19132D] p-6 text-white">
              <ShieldCheck className="text-[#7CE8CA]" size={23} />
              <h3 className="mt-4 font-extrabold">How review works</h3>
              <p className="mt-2 text-xs leading-6 text-white/65">
                Our team checks whether a report is reproducible, useful, and
                original. Rewards are discretionary and every decision is
                recorded to prevent duplicate awards.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#E5DFF0] bg-[#F4F1F8]">
      <div
        className="h-full w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#201C35]/80 text-white shadow transition hover:bg-red-600"
      >
        <X size={14} />
      </button>
      <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-5 text-[10px] font-semibold text-white">
        {file.name}
      </div>
    </div>
  );
}
