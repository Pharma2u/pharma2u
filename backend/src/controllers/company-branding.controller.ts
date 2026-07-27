import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

/** Public, deliberately minimal brand record used by every portal header. */
export async function getCompanyBranding(_req: Request, res: Response) {
  const company = await prisma.companyProfile.findUnique({
    where: { id: "default" },
    select: { name: true, logoDataUrl: true, updatedAt: true },
  });
  res.set("Cache-Control", "no-store").json({
    name: company?.name || "Pharma2U",
    logoDataUrl: company?.logoDataUrl ?? null,
    updatedAt: company?.updatedAt ?? null,
  });
}
