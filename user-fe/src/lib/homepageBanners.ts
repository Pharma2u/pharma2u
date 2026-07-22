import type { HomepageBanner } from "@/src/components/home/HomepageBannerCarousel";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"
).replace(/\/$/, "");


export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  try {
    const response = await fetch(`${API_URL}/homepage-banners`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    return ((await response.json()) as { items: HomepageBanner[] }).items;
  } catch {
    return [];
  }
}
