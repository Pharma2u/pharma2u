"use client";

import type { OperationsWorkspace, VendorData, Workspace } from "./types";
import { VendorDashboard } from "./VendorDashboard";
import { CounterBilling } from "./CounterBilling";
import { OrderStatusQueue } from "./OrderStatusQueue";
import { FinancialAccounting } from "./FinancialAccounting";
import { FinancialReports } from "./FinancialReports";
import { PromotionsCoupons } from "./PromotionsCoupons";
import { PayoutManagement } from "./PayoutManagement";

export function VendorOperations({
  token,
  workspace,
  data,
  reload,
  onNavigate,
}: {
  token: string;
  workspace: OperationsWorkspace;
  data: VendorData;
  reload: () => Promise<void>;
  onNavigate: (workspace: Workspace) => void;
}) {
  if (workspace === "dashboard")
    return (
      <VendorDashboard
        orders={data.orders}
        financials={data.financials}
        loading={data.loading}
        onViewOrders={() => onNavigate("orders")}
      />
    );
  if (workspace === "billing")
    return <CounterBilling token={token} onDataChanged={reload} />;
  if (workspace === "orders")
    return (
      <OrderStatusQueue
        token={token}
        orders={data.orders}
        loading={data.loading}
        error={data.error}
        onChanged={reload}
      />
    );
  if (workspace === "finance")
    return <FinancialAccounting financials={data.financials} />;
  if (workspace === "reports")
    return <FinancialReports financials={data.financials} />;
  if (workspace === "promotions") return <PromotionsCoupons token={token} />;
  return (
    <PayoutManagement
      token={token}
      financials={data.financials}
      onChanged={reload}
    />
  );
}
