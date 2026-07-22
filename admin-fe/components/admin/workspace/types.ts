export type AdminSection =
  | "operations"
  | "dashboard"
  | "pharmacy-applications"
  | "pharmacy-onboarding"
  | "rider-applications"
  | "rider-onboarding"
  | "fleet"
  | "banners"
  | "accounting"
  | "subscriptions"
  | "announcements"
  | "hrm"
  | "ledger"
  | "customers"
  | "support"
  | "access"
  | "accounts"
  | "company";

export type CompanyProfile = {
  name: string;
  legalName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  registrationNumber: string;
  logoDataUrl: string;
};

export type FinanceScope = "combined" | "pharmacy" | "logistics" | "corporate";

export type LedgerEntry = {
  id: string;
  date: string;
  reference: string;
  description: string;
  division: Exclude<FinanceScope, "combined">;
  type: "receivable" | "payable" | "expense" | "income";
  amount: number;
  status: "paid" | "pending" | "overdue";
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  audience: "all" | "pharmacies" | "riders";
  publishedAt: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  monthlySalary: number;
  status: "active" | "on-leave";
};

export type SupportTicket = {
  id: string;
  subject: string;
  requester: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "resolved";
};

export type Subscription = {
  pharmacyId: string;
  pharmacy: string;
  plan: string;
  amount: number;
  nextBilling: string;
  autopay: boolean;
  status: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  orders: number;
  spend: number;
  points: number;
  tier: string;
};

export type RoleUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "admin" | "vendor" | "rider" | "customer";
  isActive: boolean;
  applicationStatus: string | null;
  createdAt: string;
  pharmacies: { name: string; address: string }[];
};
export type PermissionSummary = {
  role: string;
  users: number;
  access: string;
  tone: "emerald" | "blue" | "violet" | "amber";
};

export type DashboardData = {
  grossVolume: number;
  activePharmacies: number;
  fulfilledOrders: number;
  activeRiders: number;
  revenueByMonth: { month: string; value: number }[];
  pendingApplications: {
    id: string;
    pharmacyName: string;
    address: string;
    submittedAt: string;
  }[];
  topPharmacy: { name: string; gmv: number; orders: number } | null;
  newCustomers: number;
  onTimePercent: number;
  averageFulfilmentMinutes: number;
  netMarginPercent: number;
};

export type WorkspaceData = {
  company: CompanyProfile;
  financeScope: FinanceScope;
  ledger: LedgerEntry[];
  announcements: Announcement[];
  employees: Employee[];
  tickets: SupportTicket[];
  subscriptions: Subscription[];
  customers: Customer[];
  customerSummary: { members: number; points: number };
  permissions: PermissionSummary[];
  dashboard: DashboardData;
};
