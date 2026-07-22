import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function listNotifications(request: Request, response: Response) {
  const audience =
    request.user!.role === "vendor"
      ? "pharmacies"
      : request.user!.role === "rider"
        ? "riders"
        : "all";
  const items = await prisma.adminAnnouncement.findMany({
    where: { audience: { in: ["all", audience] } },
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      message: true,
      audience: true,
      publishedAt: true,
    },
  });
  response.json({
    items: items.map((item) => ({
      ...item,
      publishedAt: item.publishedAt.toISOString(),
    })),
  });
}
