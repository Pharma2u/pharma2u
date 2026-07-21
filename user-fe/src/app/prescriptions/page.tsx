"use client";

import Link from "next/link";
import { ChangeEvent, useState } from "react";
import { FileText, Upload } from "lucide-react";

export default function PrescriptionsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (!selected) return;
    if (![
      "image/jpeg", "image/png", "image/webp", "application/pdf",
    ].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("Choose a JPG, PNG, WebP, or PDF prescription up to 5 MB.");
      event.currentTarget.value = "";
      return;
    }
    setFile(selected);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#F8FBFA]">
      <div className="container-custom py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2EB68F]">Prescription medicines</p>
        <h1 className="mt-2 text-3xl font-bold text-[#17212B]">Upload your prescription</h1>
        <p className="mt-3 max-w-2xl text-[#64717D]">Choose a clear photo or PDF now. At checkout, select the same prescription to attach it securely to your order for pharmacy review.</p>

        <section className="mt-8 max-w-xl rounded-3xl border border-[#E5EAE8] bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B8DDD2] bg-[#F4FCF9] px-6 py-10 text-center transition hover:border-[#45C9A5]">
            <Upload size={30} className="text-[#2EB68F]" />
            <span className="mt-3 text-sm font-bold text-[#17212B]">Choose prescription file</span>
            <span className="mt-1 text-xs text-[#64717D]">JPG, PNG, WebP, or PDF · maximum 5 MB</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={selectFile} />
          </label>
          {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          {file && <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#CDEEE3] bg-[#F4FCF9] p-4"><FileText className="text-[#2EB68F]" size={22} /><div><p className="text-sm font-bold text-[#17212B]">{file.name}</p><p className="mt-0.5 text-xs text-[#64717D]">Ready to attach at checkout</p></div></div>}
        </section>

        <Link href="/products" className="mt-6 inline-flex rounded-xl bg-[#45C9A5] px-5 py-3 text-sm font-bold text-[#17212B]">Browse prescription medicines</Link>
      </div>
    </main>
  );
}