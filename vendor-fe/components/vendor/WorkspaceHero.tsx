import type { Workspace } from "./types";
import { vendorStyles as styles } from "./vendorStyles";

const headings: Record<
  Workspace,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "Vendor dashboard",
    title: "Your pharmacy, clearly in control",
    description:
      "Track orders, settlement balances and everyday pharmacy operations from one connected workspace.",
  },
  billing: {
    eyebrow: "Offline store",
    title: "Counter Billing",
    description:
      "Create walk-in bills against the same inventory used for Pharma2U online orders.",
  },
  orders: {
    eyebrow: "Order operations",
    title: "Pharma2U Orders",
    description:
      "Review, prepare and hand over online orders from your pharmacy.",
  },
  products: {
    eyebrow: "Unified inventory",
    title: "Your product catalogue",
    description:
      "One stock source keeps online and counter availability synchronised.",
  },
  "add-product": {
    eyebrow: "Unified inventory",
    title: "Add a product",
    description:
      "Add medicine, batch, expiry and pricing information to the shared catalogue.",
  },
  pharmacy: {
    eyebrow: "My pharmacy",
    title: "Store profile and operating hours",
    description:
      "Keep the pharmacy profile, brand assets and availability accurate.",
  },
  finance: {
    eyebrow: "Financial accounting",
    title: "Separate views, one reliable ledger",
    description:
      "Compare online, offline or merged financial data without splitting inventory.",
  },
  reports: {
    eyebrow: "Core financial reports",
    title: "Profit & Loss and Balance Sheet",
    description:
      "Review the current financial position using clear accounting statements.",
  },
  promotions: {
    eyebrow: "Customer growth",
    title: "Promotions & Coupons",
    description:
      "Launch pharmacy-funded offers with transparent settlement deductions.",
  },
  payouts: {
    eyebrow: "Settlements",
    title: "Payout Management",
    description:
      "Review available funds and raise a withdrawal support ticket.",
  },
  settings: {
    eyebrow: "Vendor preferences",
    title: "Settings",
    description:
      "Manage pharmacy-only workspace and order printing preferences.",
  },
};

export function WorkspaceHero({ workspace, userName }: { workspace: Workspace; userName?: string }) {
  const content = headings[workspace];
  if (workspace === "finance" || workspace === "reports") return null;
  const title = workspace === "dashboard" && userName ? `Welcome back, ${userName}` : content.title;
  return (
    <div className={styles.hero}>
      <p className={styles.kicker}>{content.eyebrow}</p>
      <h1 className={styles.heroTitle}>{title}</h1>
      <p className={styles.heroDescription}>{content.description}</p>
    </div>
  );
}
