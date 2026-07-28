export type CompanyBrand = {
  name: string;
  logoUrl: string | null;
};

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api"
).replace(/\/$/, "");

export async function getCompanyBranding(): Promise<CompanyBrand> {
  try {
    const response = await fetch(`${API_URL}/branding`, { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load company branding.");
    const data = (await response.json()) as Partial<CompanyBrand>;
    return {
      name: typeof data.name === "string" && data.name ? data.name : "Pharma2U",
      logoUrl:
        typeof data.logoUrl === "string" && data.logoUrl ? data.logoUrl : null,
    };
  } catch {
    return { name: "Pharma2U", logoUrl: null };
  }
}
