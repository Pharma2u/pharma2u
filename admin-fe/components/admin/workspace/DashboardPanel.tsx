import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  IndianRupee,
  PackageCheck,
  Star,
  Truck,
  UsersRound,
} from "lucide-react";
import { Card, CardHeader, PageHeading, StatusBadge } from "./ui";
import type { DashboardData } from "./types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export function DashboardPanel({
  data,
  userName,
  onOpenApplications,
  onOpenAccounting,
}: {
  data: DashboardData;
  userName: string;
  onOpenApplications: () => void;
  onOpenAccounting: () => void;
}) {
  const metrics = [
    {
      label: "Gross platform volume",
      value: currency.format(data.grossVolume),
      change: "Delivered orders",
      icon: IndianRupee,
      positive: true,
    },
    {
      label: "Active pharmacies",
      value: data.activePharmacies.toLocaleString("en-IN"),
      change: "Current network",
      icon: Building2,
      positive: true,
    },
    {
      label: "Orders fulfilled",
      value: data.fulfilledOrders.toLocaleString("en-IN"),
      change: "Delivered",
      icon: PackageCheck,
      positive: true,
    },
    {
      label: "Active riders",
      value: data.activeRiders.toLocaleString("en-IN"),
      change: "Approved riders",
      icon: Truck,
      positive: true,
    },
  ];
  const maxRevenue = Math.max(
    ...data.revenueByMonth.map((item) => item.value),
    1,
  );
  return (
    <>
      <PageHeading
        eyebrow="Command centre"
        title={`Welcome back, ${userName}`}
        description="A live view of pharmacy operations, financial health, and network performance."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card className="p-5" key={metric.label}>
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon size={20} />
                </span>
                <span
                  className={`flex items-center gap-1 text-xs font-bold ${metric.positive ? "text-emerald-600" : "text-red-500"}`}
                >
                  {metric.positive ? (
                    <ArrowUpRight size={14} />
                  ) : (
                    <ArrowDownRight size={14} />
                  )}
                  {metric.change}
                </span>
              </div>
              <p className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {metric.label}
              </p>
            </Card>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.7fr)]">
        <Card>
          <CardHeader
            title="Revenue across the ecosystem"
            description="Last six months · combined view"
            action={
              <button
                onClick={onOpenAccounting}
                className="text-xs font-bold text-emerald-700"
              >
                View accounting
              </button>
            }
          />
          <div className="px-5 py-5">
            <div className="flex h-56 items-end gap-3 sm:gap-5">
              {data.revenueByMonth.map((item) => (
                <div
                  className="flex h-full flex-1 flex-col justify-end gap-2"
                  key={item.month}
                >
                  <div className="relative flex-1 rounded-t-lg bg-slate-50">
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-emerald-500 transition-all"
                      style={{
                        height: `${Math.max(2, (item.value / maxRevenue) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-slate-400">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-5 border-t border-slate-100 pt-4 text-xs">
              <span className="text-slate-500">
                This month{" "}
                <b className="ml-1 text-slate-900">
                  {currency.format(data.revenueByMonth.at(-1)?.value ?? 0)}
                </b>
              </span>
              <span className="text-slate-500">
                Net margin{" "}
                <b className="ml-1 text-emerald-700">
                  {data.netMarginPercent.toFixed(1)}%
                </b>
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Joining requests"
            description="Awaiting administrative action"
            action={
              <button
                onClick={onOpenApplications}
                className="text-xs font-bold text-emerald-700"
              >
                View all
              </button>
            }
          />
          <div className="divide-y divide-slate-100 px-5">
            {data.pendingApplications.map((application) => (
              <div
                className="flex items-center gap-3 py-4"
                key={application.id}
              >
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                  {application.pharmacyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {application.pharmacyName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {application.address}
                  </p>
                </div>
                <StatusBadge tone="amber">
                  {application.submittedAt}
                </StatusBadge>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Star className="text-amber-500" size={21} />
            <h3 className="font-bold">Top pharmacy</h3>
          </div>
          <p className="mt-5 text-lg font-extrabold">
            {data.topPharmacy?.name ?? "No delivered orders yet"}
          </p>
          <p className="text-sm text-slate-500">
            {data.topPharmacy
              ? `${currency.format(data.topPharmacy.gmv)} GMV · ${data.topPharmacy.orders.toLocaleString("en-IN")} orders`
              : "Performance will appear after deliveries"}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <UsersRound className="text-blue-500" size={21} />
            <h3 className="font-bold">Customer growth</h3>
          </div>
          <p className="mt-5 text-lg font-extrabold">
            {data.newCustomers.toLocaleString("en-IN")} new customers
          </p>
          <p className="text-sm text-slate-500">
            Registered in the last 30 days
          </p>
        </Card>
        <Card className="p-5 md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <Truck className="text-violet-500" size={21} />
            <h3 className="font-bold">Delivery SLA</h3>
          </div>
          <p className="mt-5 text-lg font-extrabold">
            {data.onTimePercent.toFixed(1)}% on time
          </p>
          <p className="text-sm text-slate-500">
            Average fulfilment: {Math.round(data.averageFulfilmentMinutes)}{" "}
            minutes
          </p>
        </Card>
      </div>
    </>
  );
}
