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
  | "payouts";

export type OperationsWorkspace = Exclude<Workspace, "products" | "add-product" | "pharmacy">;
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
  cashRevenue: number;
  receivable: number;
  heldBalance: number;
  availableBalance: number;
  stockPayable: number;
  platformEarnings: number;
  pharmacyDiscounts: number;
  upcomingPayout: number;
  totalRevenue: number;
};

export type VendorData = {
  orders: VendorOrder[];
  loading: boolean;
  error: string;
  financials: FinancialSummary;
};
