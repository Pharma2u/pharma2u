import type { VendorOrder } from "@/lib/authApi";

export type Workspace =
  | "dashboard"
  | "billing"
  | "orders"
  | "products"
  | "add-product"
  | "pharmacy"
  | "finance"
  | "reports"
  | "promotions"
  | "payouts"
  | "settings";

export type OperationsWorkspace = Exclude<
  Workspace,
  "products" | "add-product" | "pharmacy" | "settings"
>;
export type FinanceMode = "online" | "offline" | "merged";

type TodayOrderMetrics = {
  received: number;
  pending: number;
  packed: number;
  outForDelivery: number;
  delivered: number;
  failed: number;
};
export type FinancialSummary = {
  today: TodayOrderMetrics;
  allTime: TodayOrderMetrics;
  onlineRevenue: number;
  offlineRevenue: number;
  cashRevenue: number;
  receivable: number;
  heldBalance: number;
  availableBalance: number;
  inventoryPurchaseValue: number;
  platformEarnings: number;
  pharmacyDiscounts: number;
  upcomingPayout: number;
  totalRevenue: number;
};

export type VendorData = {
  orders: VendorOrder[];
  loading: boolean;
  financialsLoaded: boolean;
  error: string;
  financials: FinancialSummary;
};
