"use client";

import { useState } from "react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { VendorLoginForm } from "@/components/auth/VendorLoginForm";
import { InventoryPanel } from "@/components/inventory/InventoryPanel";
import { OrderQueue } from "@/components/orders/OrderQueue";
import { changePassword, loginVendor } from "@/lib/authApi";
import { clearSession, passwordChanged, setSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { usePersistedVendorSession } from "@/store/usePersistedSession";

type Workspace = "inventory" | "products" | "add-product" | "orders";

export default function VendorPortal() {
  const dispatch = useAppDispatch();
  const { session, hydrated } = usePersistedVendorSession();
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>("inventory");

  async function login(phone: string, password: string) {
    setError("");
    try {
      dispatch(setSession(await loginVendor(phone, password)));
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

  if (!hydrated) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 text-sm text-slate-500">
        Restoring session...
      </main>
    );
  }
  if (!session) return <VendorLoginForm onSubmit={login} error={error} />;
  if (session.mustChangePassword)
    return <ChangePasswordForm onSubmit={replacePassword} error={error} />;

  const addingProduct = workspace === "add-product";
  const viewingProducts = workspace === "products";
  const viewingOrders = workspace === "orders";

  return (
    <main className="min-h-screen bg-[#f5f8f7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-600 text-white shadow-sm">
              <span className="text-lg font-black">P</span>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-teal-700">
                PHARMA2U VENDOR
              </p>
              <h1 className="text-lg font-bold tracking-tight">
                Pharmacy workspace
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex">
              <span className="text-xs font-bold text-slate-500">U</span>
              <span className="max-w-36 truncate text-sm font-semibold">
                {session.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearSession())}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <span aria-hidden="true">-&gt;</span>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24">
          <p className="px-3 pb-2 pt-1 text-[10px] font-bold tracking-[0.18em] text-slate-400">
            WORKSPACE
          </p>
          <nav className="space-y-1" aria-label="Vendor workspace">
            <NavItem
              active={viewingOrders}
              icon={<span className="text-base">#</span>}
              label="Orders"
              detail="Payments and fulfilment"
              onClick={() => setWorkspace("orders")}
            />
            <NavItem
              active={workspace === "inventory"}
              icon={<span className="text-base">[]</span>}
              label="Inventory"
              detail="Stock overview"
              onClick={() => setWorkspace("inventory")}
            />
            <NavItem
              active={viewingProducts}
              icon={<span className="text-base">*</span>}
              label="Your products"
              detail="View and edit catalogue"
              onClick={() => setWorkspace("products")}
            />
            <NavItem
              active={addingProduct}
              icon={<span className="text-lg leading-none">+</span>}
              label="Add product"
              detail="Add medicine or healthcare item"
              onClick={() => setWorkspace("add-product")}
            />{" "}
          </nav>
          <div className="mt-4 rounded-2xl bg-teal-50 p-4">
            <p className="text-xs font-bold text-teal-800">Good practice</p>
            <p className="mt-1 text-xs leading-5 text-teal-700">
              Keep batch, expiry, stock, price, and product images current for
              safe fulfilment.
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-sm sm:px-8">
            <p className="text-xs font-bold tracking-[0.18em] text-teal-300">
              {viewingOrders
                ? "ORDER OPERATIONS"
                : addingProduct || viewingProducts
                  ? "CATALOGUE MANAGEMENT"
                  : "INVENTORY OVERVIEW"}
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              {viewingOrders
                ? "Orders, payments, and refunds"
                : addingProduct
                  ? "Add a product to your catalogue"
                  : viewingProducts
                    ? "Your product catalogue"
                    : "Keep every product ready to sell."}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {viewingOrders
                ? "Review incoming orders, confirm prescriptions, track payment state, pack paid orders, and monitor refunds."
                : addingProduct
                  ? "Add product information, regulatory details, and an image gallery in one organised form."
                  : viewingProducts
                    ? "Review each product, see its image, and edit catalogue details from one place."
                    : "Search your catalogue, review low stock, edit product information, or add a new item from the sidebar."}
            </p>
          </div>
          {viewingOrders ? (
            <OrderQueue token={session.token} />
          ) : (
            <InventoryPanel
              key={workspace}
              token={session.token}
              startAdding={addingProduct}
              showCatalogue={!addingProduct}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function NavItem({
  active,
  icon,
  label,
  detail,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? "bg-teal-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50"}`}
    >
      <span className={active ? "text-white" : "text-teal-600"}>{icon}</span>
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span
          className={`mt-0.5 block text-xs ${active ? "text-teal-100" : "text-slate-500"}`}
        >
          {detail}
        </span>
      </span>
    </button>
  );
}
