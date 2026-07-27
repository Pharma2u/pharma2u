export type RiderDashboardData = {
  profile: {
    name: string;
    verified: boolean;
    vehicleType: string | null;
    vehicleNumber: string | null;
  };
  availability: {
    isOnline: boolean;
    location: {
      lat: number;
      lng: number;
      updatedAt: string;
    } | null;
  };
  today: {
    earnings: number;
    trips: number;
    completionRate: number | null;
  };
  active: {
    count: number;
    codToCollect: number;
  };
};

const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export async function getRiderDashboard(token: string) {
  const response = await fetch(`${apiBase}/riders/dashboard`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await response.json().catch(() => ({}))) as RiderDashboardData & {
    error?: string;
    message?: string;
  };
  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? "Unable to load dashboard.");
  }
  return data;
}
