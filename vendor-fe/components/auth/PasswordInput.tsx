"use client";

import { useState, type InputHTMLAttributes } from "react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-2">
      <input {...props} type={visible ? "text" : "password"} className={`${props.className ?? ""} mt-0 pr-12`} />
      <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-800">
        <EyeIcon hidden={visible} />
      </button>
    </div>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
  ) : (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 3 18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2 3.2M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a9.8 9.8 0 0 0 4.1-.9"/></svg>
  );
}
