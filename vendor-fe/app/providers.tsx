"use client";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { ActionToastProvider } from "@/components/ui/ActionToasts";
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ActionToastProvider>{children}</ActionToastProvider>
    </Provider>
  );
}
