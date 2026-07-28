import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { pharmacyImageUrl } from "../utils/uploadthing";

/** Public, deliberately minimal brand record used by every portal header. */
export async function getCompanyBranding(_req: Request, res: Response) {
  const company = await prisma.companyProfile.findUnique({
    where: { id: "default" },
    select: {
      name: true,
      logoPath: true,
      logoDataUrl: true,
      updatedAt: true,
    },
  });
  const logoUrl = company?.logoPath
    ? pharmacyImageUrl(company.logoPath)
    : (company?.logoDataUrl ?? null);

  res.set("Cache-Control", "no-store").json({
    name: company?.name || "Pharma2U",
    logoUrl,
    // Compatibility for the other portals while they migrate to logoUrl.
    logoDataUrl: logoUrl,
    updatedAt: company?.updatedAt ?? null,
  });
}
