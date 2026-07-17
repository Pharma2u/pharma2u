"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-2">
      <input {...props} type={visible ? "text" : "password"} className={`${props.className ?? ""} mt-0 pr-12`} />
      <button type="button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-slate-800">
        {visible ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
      </button>
    </div>
  );
}
