"use client";
import { CustomerAuthForm } from "@/src/components/auth/CustomerAuthForm";
import { setSession, type AuthSession } from "@/src/store/authStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
export default function CustomerAuthPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  async function submit(
    mode: "login" | "register",
    values: {
      name: string;
      phone: string;
      email: string;
      address: string;
      password: string;
    },
  ) {
    setError("");
    const response = await fetch(
      `${baseUrl}/auth/${mode === "login" ? "login" : "register"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { identifier: values.phone, password: values.password }
            : values,
        ),
      },
    );
    const data = (await response.json().catch(() => ({}))) as AuthSession & {
      message?: string;
      error?: string;
    };
    if (!response.ok) {
      setError(
        data.error ?? data.message ?? "Unable to complete your request.",
      );
      return;
    }
    if (data.role !== "customer") {
      setError("Please use the portal assigned to your account role.");
      return;
    }
    dispatch(setSession(data));
    localStorage.setItem("pharma2u_auth", JSON.stringify(data));
    router.replace("/");
  }
  return (
    <main className="grid min-h-[calc(100vh-82px)] place-items-center bg-[#f6f8f9] p-5">
      <CustomerAuthForm onSubmit={submit} error={error} />
    </main>
  );
}
