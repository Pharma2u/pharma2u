"use client";
import { FormEvent, useState } from "react";
import { PasswordInput } from "./PasswordInput";
type Mode = "login" | "register";
type Props = {
  onSubmit: (
    mode: Mode,
    values: {
      name: string;
      phone: string;
      email: string;
      address: string;
      password: string;
    },
  ) => Promise<void>;
  error: string;
};
export function CustomerAuthForm({ onSubmit, error }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    await onSubmit(mode, { name, phone, email, address, password }).finally(
      () => setLoading(false),
    );
  }
  return (
    <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-xl">
      <p className="text-sm font-bold tracking-[0.2em] text-[#2eb68f]">
        PHARMA2U
      </p>
      <h1 className="mt-3 text-3xl font-bold text-[#17212b]">
        {mode === "login" ? "Welcome back" : "Create an account"}
      </h1>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        {mode === "register" && (
          <>
            <label className="block text-sm font-medium">
              Full name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
                placeholder="you@example.com"
              />
            </label>{" "}
            <label className="block text-sm font-medium">
              Address
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
          </>
        )}
        <label className="block text-sm font-medium">
          {mode === "login" ? "Email or mobile number" : "Mobile number"}
          <input
            required
            inputMode={mode === "login" ? "email" : "numeric"}
            value={phone}
            onChange={(event) =>
              setPhone(
                mode === "login"
                  ? event.target.value
                  : event.target.value.replace(/\D/g, "").slice(0, 10),
              )
            }
            className="mt-2 w-full rounded-xl border p-3"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <PasswordInput
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border p-3"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-[#45c9a5] p-3 font-semibold text-[#17212b] disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create customer account"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
        className="mt-5 w-full text-sm font-semibold text-[#2eb68f]"
      >
        {mode === "login"
          ? "New here? Register"
          : "Already registered? Sign in"}
      </button>
    </section>
  );
}
