import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { pharmacyImageUrl, uploadPharmacyImage } from "../utils/uploadthing";

type BannerInput = {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

function input(body: unknown): BannerInput {
  const data = body as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) throw new Error("A banner title is required.");
  const text = (key: "subtitle" | "imageUrl" | "linkUrl") =>
    typeof data[key] === "string" && data[key].trim() ? data[key].trim() : null;
  return {
    title,
    subtitle: text("subtitle"),
    imageUrl: text("imageUrl"),
    linkUrl: text("linkUrl"),
    isActive: typeof data.isActive === "boolean" ? data.isActive : true,
    sortOrder: Number.isFinite(Number(data.sortOrder))
      ? Number(data.sortOrder)
      : 0,
  };
}


export async function uploadHomepageBannerImage(req: Request, res: Response) {
  const file = req.file;
  if (!file) { res.status(400).json({ error: "A banner image is required." }); return; }
  const key = await uploadPharmacyImage(file, "banner");
  res.status(201).json({ imageUrl: pharmacyImageUrl(key) });
}

export async function listPublicHomepageBanners(_req: Request, res: Response) {
  res.json({
    items: await prisma.homepageBanner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  });
}
export async function listHomepageBanners(_req: Request, res: Response) {
  res.json({
    items: await prisma.homepageBanner.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  });
}
export async function createHomepageBanner(req: Request, res: Response) {
  res
    .status(201)
    .json(await prisma.homepageBanner.create({ data: input(req.body) }));
}


export async function updateHomepageBanner(req: Request, res: Response) {
  const id = String(req.params.id);
  const banner = await prisma.homepageBanner.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!banner) {
    res.status(404).json({ error: "Banner not found." });
    return;
  }
  res.json(
    await prisma.homepageBanner.update({
      where: { id },
      data: input(req.body),
    }),
  );
}


export async function deleteHomepageBanner(req: Request, res: Response) {
  const id = String(req.params.id);
  const banner = await prisma.homepageBanner.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!banner) {
    res.status(404).json({ error: "Banner not found." });
    return;
  }
  await prisma.homepageBanner.delete({ where: { id } });
  res.status(204).send();
}
