export const adminSessionExpiredEvent = "pharma2u:admin-session-expired";

export function notifyAdminSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(adminSessionExpiredEvent));
  }
}