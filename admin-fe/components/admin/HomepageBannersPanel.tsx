"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { adminOperations, type HomepageBannerInput } from "@/lib/operationsApi";

type Banner = HomepageBannerInput & { id: string };
const initial: HomepageBannerInput = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

export function HomepageBannersPanel({ token }: { token: string }) {
  const [items, setItems] = useState<Banner[]>([]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const load = useCallback(async () => {
    try {
      setItems((await adminOperations.homepageBanners(token)).items);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load banners.",
      );
    }
  }, [token]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function uploadImage(file: File) {
    setError("");
    setUploading(true);
    try {
      const imageUrl = await adminOperations.uploadHomepageBannerImage(token, file);
      field("imageUrl", imageUrl);
      setNotice("Image uploaded. Save the banner to publish it.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      if (editing)
        await adminOperations.updateHomepageBanner(token, editing, form);
      else await adminOperations.createHomepageBanner(token, form);
      setNotice(editing ? "Banner updated." : "Banner created.");
      setForm(initial);
      setEditing(null);
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save banner.",
      );
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await adminOperations.deleteHomepageBanner(token, id);
      if (editing === id) {
        setEditing(null);
        setForm(initial);
      }
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete banner.",
      );
    }
  }
  const field = (key: keyof HomepageBannerInput, value: string | number | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold tracking-[.18em] text-emerald-600">
          HOMEPAGE CONTENT
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Ads & custom banners
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Active banners scroll automatically beneath the customer header. Lower
          display order appears first.
        </p>
      </div>
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      <form
        onSubmit={submit}
        className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2"
      >
        <input
          required
          value={form.title}
          onChange={(e) => field("title", e.target.value)}
          placeholder="Banner title"
          className="rounded-xl border p-3"
        />
        <input
          value={form.subtitle ?? ""}
          onChange={(e) => field("subtitle", e.target.value)}
          placeholder="Short subtitle (optional)"
          className="rounded-xl border p-3"
        />
        <input
          value={form.imageUrl ?? ""}
          onChange={(e) => field("imageUrl", e.target.value)}
          placeholder="Banner image URL (optional)"
          className="rounded-xl border p-3"
        />
        <input
          value={form.linkUrl ?? ""}
          onChange={(e) => field("linkUrl", e.target.value)}
          placeholder="Click-through URL, e.g. /products"
          className="rounded-xl border p-3"
        />
        <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 p-4">
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <b>Homepage banner size:</b> full-width hero, shown at approximately 1240 x 420 px on desktop (3:1 ratio).
            <span className="block mt-1 text-xs text-emerald-800">Upload a landscape image at least 1600 x 540 px for the best result. The image is cropped to fill this wide banner area.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {form.imageUrl ? <img src={form.imageUrl} alt="Banner preview" className="h-28 w-full max-w-[420px] rounded-lg object-cover" /> : <div className="grid h-28 w-full max-w-[420px] place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">No image selected</div>}
            <label className="cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              {uploading ? "Uploading image..." : "Upload banner image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadImage(file); }} className="sr-only" />
            </label>
            {form.imageUrl && <button type="button" onClick={() => field("imageUrl", "")} className="text-sm font-bold text-red-700">Remove image</button>}
          </div>
          <p className="mt-2 text-xs text-slate-500">Upload JPG, PNG, or WebP up to 5 MB. You can also use the image URL field above.</p>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium">
          <span>Display order</span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => field("sortOrder", Number(e.target.value))}
            className="w-20 rounded-lg border p-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => field("isActive", e.target.checked)}
          />{" "}
          Show on homepage
        </label>
        <div className="sm:col-span-2 flex gap-3">
          <button className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950">
            {editing ? "Save banner" : "Add this banner as a new slide"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(initial);
              }}
              className="rounded-xl border px-4 py-2.5 text-sm font-bold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div>
              <p className="font-bold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">
                Order {item.sortOrder} - {item.isActive ? "Visible" : "Hidden"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(item.id);
                  setForm(item);
                }}
                className="rounded-lg border px-3 py-2 text-xs font-bold"
              >
                Edit
              </button>
              <button
                onClick={() => void remove(item.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
            No banners yet. Add one above to show it on the homepage.
          </p>
        )}
      </div>
    </section>
  );
}
