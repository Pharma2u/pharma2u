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
  createLedger: (token: string, item: LedgerEntry) =>
    request<LedgerEntry>("/admin/ledger", token, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  createAnnouncement: (token: string, item: Announcement) =>
    request<Announcement>("/admin/announcements", token, {
      method: "POST",
      body: JSON.stringify(item),
    }),
  createEmployee: (token: string, item: Employee) =>
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
};
