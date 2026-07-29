"use client";

import { usePathname } from "next/navigation";
import { FleetPanel } from "../FleetPanel";
import { HomepageBannersPanel } from "../HomepageBannersPanel";
import { LiveOperationsPanel } from "../live-operations/LiveOperationsPanel";
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
  VendorProfileTypesPanel,
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
import { FeedbackPanel, LoyaltySettingsPanel } from "../FeedbackLoyaltyPanels";
const adminSections: AdminSection[] = [
  "dashboard", "operations", "pharmacy-applications", "pharmacy-onboarding",
  "rider-applications", "rider-onboarding", "fleet", "banners", "accounting",
  "subscriptions", "announcements", "hrm", "ledger", "customers", "feedback",
  "loyalty-settings", "support", "access", "accounts", "company", "vendor-profile-types",
];

function sectionFromPath(pathname: string): AdminSection {
  const section = pathname.split("/")[1];
  return adminSections.includes(section as AdminSection)
    ? (section as AdminSection)
    : "dashboard";
}

function sectionHref(section: AdminSection) {
  return section === "dashboard" ? "/" : `/${section}`;
}

export function AdminWorkspace({
  session,
  onSignOut,
}: {
  session: AuthSession;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const section = sectionFromPath(pathname);
  const {
    data,
    setData,
    saveCompany,
    createLedger,
    createAnnouncement,
    createEmployee,
    updateTicket,
    toggleSubscription,

    error,
    reload,
  } = useWorkspaceData(session.token);
  function navigate(next: AdminSection) {
    window.history.pushState(null, "", sectionHref(next));
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
      content = <LiveOperationsPanel token={session.token} />;
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
      content = <LedgerPanel entries={data.ledger} onCreate={createLedger} />;
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
          onCreate={createAnnouncement}
        />
      );
      break;
    case "hrm":
      content = (
        <HrmPanel employees={data.employees} onCreate={createEmployee} />
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
    case "feedback":
      content = <FeedbackPanel token={session.token} />;
      break;
    case "loyalty-settings":
      content = <LoyaltySettingsPanel token={session.token} />;
      break;
    case "support":
      content = <SupportPanel tickets={data.tickets} onUpdate={updateTicket} />;
      break;
    case "access":
      content = (
        <AccessPanel permissions={data.permissions} token={session.token} />
      );
      break;
    case "vendor-profile-types":
      content = (
        <VendorProfileTypesPanel
          items={data.profileTypes}
          token={session.token}
          onChange={(profileTypes) => setData({ ...data, profileTypes })}
        />
      );
      break;
    case "company":
      content = (
        <CompanySetupPanel
          company={data.company}
          token={session.token}
          onSave={saveCompany}
        />
      );
      break;
    case "accounts":
      content = (
        <ProvisioningPanel
          onProvisionAdmin={(name, phone, currentPassword) =>
            provisionAdmin(session.token, name, phone, currentPassword)
          }
        />
      );
      break;
  }

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
