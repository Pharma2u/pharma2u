"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { VendorLoginForm } from "@/components/auth/VendorLoginForm";
import { InventoryPanel } from "@/components/inventory/InventoryPanel";
import { VendorSettingsPanel } from "@/components/vendor/VendorSettingsPanel";
import { PharmacyStaffPanel } from "@/components/vendor/PharmacyStaffPanel";
import { VendorOperations } from "@/components/vendor/VendorOperations";
import { VendorShell } from "@/components/vendor/VendorShell";
import { WorkspaceHero } from "@/components/vendor/WorkspaceHero";
import { useVendorData } from "@/components/vendor/useVendorData";
import { useAutoPrinter } from "@/components/vendor/useAutoPrinter";
import type { OperationsWorkspace, Workspace } from "@/components/vendor/types";
import { changePassword, loginVendor } from "@/lib/authApi";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedVendorSession } from "@/store/usePersistedSession";
const vendorWorkspaces: Workspace[] = [
  "dashboard", "billing", "orders", "products", "add-product", "pharmacy",
  "finance", "reports", "promotions", "payouts", "settings",
];

function workspaceFromPath(pathname: string): Workspace {
  const section = pathname.split("/")[1];
  return vendorWorkspaces.includes(section as Workspace)
    ? (section as Workspace)
    : "dashboard";
}

function workspaceHref(workspace: Workspace) {
  return workspace === "dashboard" ? "/" : `/${workspace}`;
}

export default function VendorPortal() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { session, hydrated } = usePersistedVendorSession();
  const [error, setError] = useState("");
  const workspace = workspaceFromPath(pathname);
  const navigateToWorkspace = (next: Workspace) => window.history.pushState(null, "", workspaceHref(next));

  async function login(phone: string, password: string) {
    setError("");
    try {
      dispatch(setSession(await loginVendor(phone, password)));
      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed.");
    }
  }

  async function replacePassword(currentPassword: string, newPassword: string) {
    setError("");
    try {
      await changePassword(session!.token, currentPassword, newPassword);
      dispatch(passwordChanged());
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to change password.";
      setError(message);
      throw caught;
    }
  }

  if (!hydrated)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Restoring session…
      </main>
    );
  if (!session) return <VendorLoginForm onSubmit={login} error={error} />;
  if (session.mustChangePassword)
    return <ChangePasswordForm onSubmit={replacePassword} error={error} />;

  return (
    <AuthenticatedPortal
      token={session.token}
      name={session.name}
      workspace={workspace}
      onWorkspaceChange={navigateToWorkspace}
      onSignOut={() => dispatch(clearSession())}
    />
  );
}

function AuthenticatedPortal({
  token,
  name,
  workspace,
  onWorkspaceChange,
  onSignOut,
}: {
  token: string;
  name: string;
  workspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  onSignOut: () => void;
}) {
  const data = useVendorData(token);
  useAutoPrinter(token, data.orders);
  const inventoryWorkspace =
    workspace === "products" ||
    workspace === "add-product" ||
    workspace === "pharmacy";

  return (
    <VendorShell
      active={workspace}
      onNavigate={onWorkspaceChange}
      userName={name}
      token={token}
      onSignOut={onSignOut}
    >
      {data.error && workspace === "dashboard" && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          <span>{data.error}</span>
          <button
            type="button"
            onClick={() => void data.reload()}
            className="font-bold underline"
          >
            Retry
          </button>
        </div>
      )}
      <WorkspaceHero workspace={workspace} userName={name} />
      {workspace === "settings" ? (
        <VendorSettingsPanel token={token} />
      ) : workspace === "pharmacy" ? (
        <div className="space-y-5">
          <InventoryPanel
            key={workspace}
            token={token}
            showCatalogue={false}
            showPharmacyProfile
          />
          <PharmacyStaffPanel token={token} />
        </div>
      ) : inventoryWorkspace ? (
        <InventoryPanel
          key={workspace}
          token={token}
          startAdding={workspace === "add-product"}
          showCatalogue={workspace === "products"}
          showPharmacyProfile={false}
        />
      ) : (
        <VendorOperations
          token={token}
          workspace={workspace as OperationsWorkspace}
          data={data}
          reload={data.reload}
          onNavigate={onWorkspaceChange}
        />
      )}
    </VendorShell>
  );
}
