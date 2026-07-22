"use client";

import { useState } from "react";
import { FleetPanel } from "../FleetPanel";
import { HomepageBannersPanel } from "../HomepageBannersPanel";
import { OperationsPanel } from "../OperationsPanel";
import { PharmacyApplicationsPanel } from "../PharmacyApplicationsPanel";
import { PharmacyOnboardingPanel } from "../PharmacyOnboardingPanel";
import { ProvisioningPanel } from "../ProvisioningPanel";
import { RiderApplicationsPanel } from "../RiderApplicationsPanel";
import { RiderKycOnboardingPanel } from "../RiderKycOnboardingPanel";
import { provisionAdmin } from "@/lib/authApi";
import type { AuthSession } from "@/store/authSlice";
import {
  AccessPanel,
  CompanySetupPanel,
  HrmPanel,
  SubscriptionsPanel,
} from "./ManagementPanels";
import { AccountingPanel, LedgerPanel } from "./FinancePanels";
import {
  AnnouncementsPanel,
  CustomersPanel,
  SupportPanel,
} from "./EngagementPanels";
import { DashboardPanel } from "./DashboardPanel";
import { AdminShell } from "./AdminShell";
import type { AdminSection } from "./types";
import { useWorkspaceData } from "./useWorkspaceData";

export function AdminWorkspace({
  session,
  onSignOut,
}: {
  session: AuthSession;
  onSignOut: () => void;
}) {
  const [section, setSection] = useState<AdminSection>("dashboard");
  const { data, setData, toggleSubscription, loading, error, reload } =
    useWorkspaceData(session.token);
  function navigate(next: AdminSection) {
    setSection(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  let content;
  switch (section) {
    case "dashboard":
      content = (
        <DashboardPanel
          data={data.dashboard}
          userName={session.name}
          onOpenApplications={() => navigate("pharmacy-applications")}
          onOpenAccounting={() => navigate("accounting")}
        />
      );
      break;
    case "operations":
      content = <OperationsPanel token={session.token} />;
      break;
    case "pharmacy-applications":
      content = <PharmacyApplicationsPanel token={session.token} />;
      break;
    case "pharmacy-onboarding":
      content = <PharmacyOnboardingPanel token={session.token} />;
      break;
    case "rider-applications":
      content = <RiderApplicationsPanel token={session.token} />;
      break;
    case "rider-onboarding":
      content = <RiderKycOnboardingPanel token={session.token} />;
      break;
    case "fleet":
      content = <FleetPanel token={session.token} />;
      break;
    case "banners":
      content = <HomepageBannersPanel token={session.token} />;
      break;
    case "accounting":
      content = <AccountingPanel data={data} onChange={setData} />;
      break;
    case "ledger":
      content = (
        <LedgerPanel
          entries={data.ledger}
          onChange={(ledger) => setData({ ...data, ledger })}
        />
      );
      break;
    case "subscriptions":
      content = (
        <SubscriptionsPanel
          items={data.subscriptions}
          onToggle={toggleSubscription}
        />
      );
      break;
    case "announcements":
      content = (
        <AnnouncementsPanel
          items={data.announcements}
          onChange={(announcements) => setData({ ...data, announcements })}
        />
      );
      break;
    case "hrm":
      content = (
        <HrmPanel
          employees={data.employees}
          onChange={(employees) => setData({ ...data, employees })}
        />
      );
      break;
    case "customers":
      content = (
        <CustomersPanel
          customers={data.customers}
          summary={data.customerSummary}
        />
      );
      break;
    case "support":
      content = (
        <SupportPanel
          tickets={data.tickets}
          onChange={(tickets) => setData({ ...data, tickets })}
        />
      );
      break;
    case "access":
      content = <AccessPanel permissions={data.permissions} token={session.token} />;
      break;
    case "company":
      content = (
        <CompanySetupPanel
          company={data.company}
          onSave={(company) => setData({ ...data, company })}
        />
      );
      break;
    case "accounts":
      content = (
        <ProvisioningPanel onProvisionAdmin={(name, phone, currentPassword) =>
            provisionAdmin(session.token, name, phone, currentPassword)
          }
        />
      );
      break;
  }

  if (loading)
    content = (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
        Loading live admin data…
      </div>
    );
  return (
    <AdminShell
      active={section}
      onNavigate={navigate}
      company={data.company}
      userName={session.name}
      onSignOut={onSignOut}
    >
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          <span>{error}</span>
          <button onClick={() => void reload()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}
      {content}
    </AdminShell>
  );
}
