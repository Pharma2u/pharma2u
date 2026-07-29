const baseUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");

export type FeedbackItem = {
  id: string;
  category: string;
  subject: string;
  message: string;
  pageUrl: string | null;
  status: "pending" | "rewarded" | "rejected";
  adminNote: string | null;
  rewardPoints: number;
  createdAt: string;
  reviewedAt: string | null;
  images: Array<{ id: string; url: string; sortOrder: number }>;
};

export type LoyaltySummary = {
  balance: number;
  lifetimeEarned: number;
  lifetimeUsed: number;
  rupeesPerPoint: number;
  minimumRedeemPoints: number;
  isActive: boolean;
  transactions: Array<{
    id: string;
    type: string;
    points: number;
    description: string;
    createdAt: string;
  }>;
  unreadRewards: Array<{
    id: string;
    payload: { points?: number; subject?: string } | null;
    createdAt: string;
  }>;
};

async function request<T>(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(baseUrl + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data.error ?? data.message ?? "Request failed.");
  return data as T;
}

export const feedbackLoyaltyApi = {
  loyalty: (token: string) => request<LoyaltySummary>("/loyalty/me", token),
  feedback: (token: string) =>
    request<{ items: FeedbackItem[] }>("/feedback/mine", token),
  submit: (
    token: string,
    item: Pick<FeedbackItem, "category" | "subject" | "message" | "pageUrl">,
    images: File[],
  ) => {
    const body = new FormData();
    body.append("category", item.category);
    body.append("subject", item.subject);
    body.append("message", item.message);
    if (item.pageUrl) body.append("pageUrl", item.pageUrl);
    images.forEach((image) => body.append("images", image));
    return request<FeedbackItem>("/feedback", token, { method: "POST", body });
  },
  markRewardRead: (token: string, id: string) =>
    request<{ id: string; read: boolean }>(
      `/loyalty/notifications/${encodeURIComponent(id)}/read`,
      token,
      { method: "PATCH" },
    ),
};
