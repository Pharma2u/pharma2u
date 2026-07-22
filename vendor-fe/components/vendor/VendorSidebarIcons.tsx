"use client";

import {
  BarChart3,
  Calculator,
  CirclePlus,
  LayoutDashboard,
  Package,
  Receipt,
  Store,
  Tags,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Workspace } from "./types";
import { vendorStyles as styles } from "./vendorStyles";

const sections: {
  heading: string;
  items: { id: Workspace; icon: LucideIcon; label: string; detail: string }[];
}[] = [
  {
    heading: "OVERVIEW",
    items: [
      {
        id: "dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        detail: "Store activity and balances",
      },
    ],
  },
  {
    heading: "BILLING & ORDERS",
    items: [
      {
        id: "billing",
        icon: Receipt,
        label: "Counter Billing",
        detail: "Walk-in pharmacy sales",
      },
      {
        id: "orders",
        icon: Receipt,
        label: "Pharma2U Orders Rcvd",
        detail: "Online order fulfilment",
      },
    ],
  },
  {
    heading: "INVENTORY",
    items: [
      {
        id: "products",
        icon: Package,
        label: "Products",
        detail: "Shared online and offline stock",
      },
      {
        id: "add-product",
        icon: CirclePlus,
        label: "Add product",
        detail: "Medicine and healthcare items",
      },
      {
        id: "pharmacy",
        icon: Store,
        label: "My pharmacy",
        detail: "Profile and operating hours",
      },
    ],
  },
  {
    heading: "FINANCE",
    items: [
      {
        id: "finance",
        icon: Calculator,
        label: "Financial Accounting",
        detail: "Online and offline ledger",
      },
      {
        id: "reports",
        icon: BarChart3,
        label: "Financial Reports",
        detail: "P&L and balance sheet",
      },
      {
        id: "promotions",
        icon: Tags,
        label: "Promotions & Coupons",
        detail: "Create pharmacy offers",
      },
      {
        id: "payouts",
        icon: Wallet,
        label: "Payout Management",
        detail: "Withdrawal support tickets",
      },
    ],
  },
];

export function VendorSidebarIcons({
  active,
  onChange,
  open,
  onClose,
}: {
  active: Workspace;
  onChange: (workspace: Workspace) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : styles.sidebarClosed}`}
      aria-label="Vendor workspace"
    >
      <button
        type="button"
        className={styles.mobileClose}
        onClick={onClose}
        aria-label="Close navigation"
      >
        <X size={20} aria-hidden="true" />
      </button>
      {sections.map((section) => (
        <section key={section.heading} className={styles.navSection}>
          <p className={styles.navHeading}>{section.heading}</p>
          {section.items.map((item) => {
            const selected = active === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.id);
                  onClose();
                }}
                className={`${styles.navItem} ${selected ? styles.navItemActive : ""}`}
                aria-current={selected ? "page" : undefined}
              >
                <span
                  className={`${styles.navIcon} ${selected ? "bg-teal-700 text-white" : ""}`}
                  aria-hidden="true"
                >
                  <Icon size={17} strokeWidth={2.25} />
                </span>
                <span className={styles.navCopy}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span
                    className={`${styles.navDetail} ${selected ? "text-teal-700 group-hover:text-teal-700" : ""}`}
                  >
                    {item.detail}
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      ))}
    </aside>
  );
}
