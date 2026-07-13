"use client";
import { Provider } from "react-redux";
import { authStore } from "@/src/store/authStore";
import { SessionHydrator } from "@/src/components/account/AccountMenu";
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={authStore}>
      <SessionHydrator />
      {children}
    </Provider>
  );
}
