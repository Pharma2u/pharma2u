"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { VendorLoginForm } from "@/components/auth/VendorLoginForm";
import { InventoryPanel } from "@/components/inventory/InventoryPanel";
import { VendorHeader } from "@/components/vendor/VendorHeader";
import { VendorOperations } from "@/components/vendor/VendorOperations";
import { VendorSidebarIcons as VendorSidebar } from "@/components/vendor/VendorSidebarIcons";
import { WorkspaceHero } from "@/components/vendor/WorkspaceHero";
import { useVendorData } from "@/components/vendor/useVendorData";
import { useAutoPrinter } from "@/components/vendor/useAutoPrinter";
import type { OperationsWorkspace, Workspace } from "@/components/vendor/types";
import { vendorStyles as styles } from "@/components/vendor/vendorStyles";
import { changePassword, loginVendor } from "@/lib/authApi";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedVendorSession } from "@/store/usePersistedSession";

export default function VendorPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedVendorSession();
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>("dashboard");

  async function login(phone: string, password: string) {
    setError("");
    try { dispatch(setSession(await loginVendor(phone, password))); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Sign-in failed."); }
  }

  async function replacePassword(currentPassword: string, newPassword: string) {
    setError("");
    try { await changePassword(session!.token, currentPassword, newPassword); dispatch(passwordChanged()); }
    catch (caught) { const message = caught instanceof Error ? caught.message : "Unable to change password."; setError(message); throw caught; }
  }

  if (!hydrated) return <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">Restoring session…</main>;
  if (!session) return <VendorLoginForm onSubmit={login} error={error} />;
  if (session.mustChangePassword) return <ChangePasswordForm onSubmit={replacePassword} error={error} />;

  return <AuthenticatedPortal token={session.token} name={session.name} workspace={workspace} onWorkspaceChange={setWorkspace} onSignOut={() => dispatch(clearSession())} />;
}

function AuthenticatedPortal({ token, name, workspace, onWorkspaceChange, onSignOut }: { token: string; name: string; workspace: Workspace; onWorkspaceChange: (workspace: Workspace) => void; onSignOut: () => void }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const data = useVendorData(token);
  useAutoPrinter(token, data.orders);
  const inventoryWorkspace = workspace === "products" || workspace === "add-product" || workspace === "pharmacy";

  return <main className={styles.shell}>
    <VendorHeader name={name} token={token} onSignOut={onSignOut} onMenuOpen={() => setNavigationOpen(true)} />
    {navigationOpen && <button type="button" className="fixed inset-0 z-40 bg-slate-950/35 min-[921px]:hidden" aria-label="Close navigation" onClick={() => setNavigationOpen(false)} />}
    <div className={styles.layout}>
      <VendorSidebar active={workspace} onChange={onWorkspaceChange} open={navigationOpen} onClose={() => setNavigationOpen(false)} />
      <section className={styles.content}><WorkspaceHero workspace={workspace} />{inventoryWorkspace ? <InventoryPanel key={workspace} token={token} startAdding={workspace === "add-product"} showCatalogue={workspace === "products"} showPharmacyProfile={workspace === "pharmacy"} /> : <VendorOperations token={token} workspace={workspace as OperationsWorkspace} data={data} reload={data.reload} onNavigate={onWorkspaceChange} />}</section>
    </div>
  </main>;
}
