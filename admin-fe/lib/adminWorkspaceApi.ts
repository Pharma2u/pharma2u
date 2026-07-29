import { notifyAdminSessionExpired } from "./sessionEvents";
import type {
  Announcement,
  CompanyProfile,
  Employee,
  LedgerEntry,
  RoleUser,
  Subscription,
  SupportTicket,
  WorkspaceData,
  VendorProfileType,
  CustomerFeedback,
  LoyaltySetting,
} from "@/components/admin/workspace/types";

const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
async function request<T>(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(base + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) notifyAdminSessionExpired();
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Request failed.");
  return data as T;
}
export const adminWorkspaceApi = {
  get: (token: string) => request<WorkspaceData>("/admin/workspace", token),
  saveCompany: (token: string, company: CompanyProfile) =>
    request<CompanyProfile>("/admin/company", token, {
      method: "PUT",
      body: JSON.stringify(company),
    }),
  uploadCompanyLogo: async (token: string, logo: File) => {
    const body = new FormData();
    body.append("logo", logo);
    const response = await fetch(base + "/admin/company/logo", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = (await response.json().catch(() => ({}))) as {
      logoDataUrl?: string;
      error?: string;
      message?: string;
    };
    if (response.status === 401) notifyAdminSessionExpired();
    if (!response.ok || !data.logoDataUrl) {
      throw new Error(data.error ?? data.message ?? "Logo upload failed.");
    }
    return data.logoDataUrl;
  },
  createLedger: (
    token: string,
    item: Pick<LedgerEntry, "description" | "division" | "type" | "amount">,
  ) =>
    request<LedgerEntry>("/admin/ledger", token, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  createAnnouncement: (
    token: string,
    item: Pick<Announcement, "title" | "message" | "audience">,
  ) =>
    request<Announcement>("/admin/announcements", token, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  createEmployee: (
    token: string,
    item: Pick<Employee, "name" | "role" | "department" | "monthlySalary">,
  ) =>
    request<Employee>("/admin/employees", token, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  updateTicket: (token: string, item: SupportTicket) =>
    request<SupportTicket>(
      `/admin/support-tickets/${encodeURIComponent(item.id)}`,
      token,
      { method: "PATCH", body: JSON.stringify({ status: item.status }) },
    ),
  updateSubscription: (token: string, item: Subscription) =>
    request<Subscription>(
      `/admin/subscriptions/${encodeURIComponent(item.pharmacyId)}`,
      token,
      { method: "PATCH", body: JSON.stringify({ autopay: item.autopay }) },
    ),
  roleUsers: (token: string, role: RoleUser["role"]) =>
    request<{ items: RoleUser[] }>(
      `/admin/access/users?role=${encodeURIComponent(role)}`,
      token,
    ),
  setUserAccess: (token: string, id: string, isActive: boolean) =>
    request<{ id: string; isActive: boolean }>(
      `/admin/access/users/${encodeURIComponent(id)}`,
      token,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    ),
  createVendorProfileType: (
    token: string,
    input: Pick<VendorProfileType, "name" | "description">,
  ) =>
    request<VendorProfileType>("/admin/vendor-profile-types", token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateVendorProfileType: (token: string, id: string, isActive: boolean) =>
    request<VendorProfileType>(
      `/admin/vendor-profile-types/${encodeURIComponent(id)}`,
      token,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    ),
  feedback: (token: string, status: string) =>
    request<{ items: CustomerFeedback[]; counts: Record<string, number> }>(
      `/admin/feedback?status=${encodeURIComponent(status)}`,
      token,
    ),
  reviewFeedback: (
    token: string,
    id: string,
    review: { action: "reward" | "reject"; rewardPoints: number; adminNote: string },
  ) =>
    request<CustomerFeedback>(
      `/admin/feedback/${encodeURIComponent(id)}/review`,
      token,
      { method: "PATCH", body: JSON.stringify(review) },
    ),
  loyaltySetting: (token: string) =>
    request<LoyaltySetting>("/admin/loyalty-settings", token),
  updateLoyaltySetting: (token: string, setting: LoyaltySetting) =>
    request<LoyaltySetting>("/admin/loyalty-settings", token, {
      method: "PUT",
      body: JSON.stringify(setting),
    }),
};
