"use client";
import { Provider } from "react-redux";
import { authStore } from "@/src/store/authStore";
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Provider store={authStore}>{children}</Provider>;
}
