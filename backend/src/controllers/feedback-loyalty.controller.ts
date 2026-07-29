import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  deleteUploadedFiles,
  signedDocumentUrl,
  uploadFeedbackScreenshot,
} from "../utils/uploadthing";

const categories = ["bug", "delivery", "medicine", "payment", "suggestion", "other"];

function input(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Object.assign(new Error("Request body must be an object."), { status: 400 });
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, min: number, max: number) {
  const result = typeof value === "string" ? value.trim() : "";
  if (result.length < min || result.length > max) {
    throw Object.assign(new Error(`${field} must be between ${min} and ${max} characters.`), { status: 400 });
  }
  return result;
}

async function serializedFeedback(item: {
  id: string;
  category: string;
  subject: string;
  message: string;
  pageUrl: string | null;
  status: string;
  adminNote: string | null;
  rewardPoints: number;
  createdAt: Date;
  reviewedAt: Date | null;
  images?: Array<{ id: string; path: string; sortOrder: number }>;
}) {
  const { images = [], ...feedback } = item;
  return {
    ...feedback,
    createdAt: item.createdAt.toISOString(),
    reviewedAt: item.reviewedAt?.toISOString() ?? null,
    images: await Promise.all(
      images.map(async (image) => ({
        id: image.id,
        sortOrder: image.sortOrder,
        url: await signedDocumentUrl(image.path),
      })),
    ),
  };
}

async function getSetting() {
  return prisma.loyaltySetting.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function submitFeedback(req: Request, res: Response) {
  const body = input(req.body);
  const category = typeof body.category === "string" ? body.category : "";
  if (!categories.includes(category)) {
    throw Object.assign(new Error("Choose a valid feedback category."), { status: 400 });
  }
  const subject = text(body.subject, "subject", 5, 100);
  const message = text(body.message, "message", 20, 2000);
  const rawPageUrl = typeof body.pageUrl === "string" ? body.pageUrl.trim().slice(0, 500) : "";
  let pageUrl: string | null = null;
  if (rawPageUrl) {
    try {
      const parsed = new URL(rawPageUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      pageUrl = parsed.toString();
    } catch {
      throw Object.assign(new Error("pageUrl must be a valid http or https link."), { status: 400 });
    }
  }
  const files = Array.isArray(req.files) ? req.files : [];
  const uploadedPaths: string[] = [];
  try {
    for (const file of files) {
      uploadedPaths.push(await uploadFeedbackScreenshot(file));
    }
    const item = await prisma.customerFeedback.create({
      data: {
        customerId: req.user!.id,
        category,
        subject,
        message,
        pageUrl,
        images: {
          create: uploadedPaths.map((path, sortOrder) => ({ path, sortOrder })),
        },
      },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    res.status(201).json(await serializedFeedback(item));
  } catch (error) {
    await deleteUploadedFiles(uploadedPaths, "feedback screenshots");
    throw error;
  }
}

export async function listMyFeedback(req: Request, res: Response) {
  const items = await prisma.customerFeedback.findMany({
    where: { customerId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  res.json({ items: await Promise.all(items.map(serializedFeedback)) });
}

export async function getMyLoyalty(req: Request, res: Response) {
  const [account, setting, transactions, rewardNotifications] = await Promise.all([
    prisma.loyaltyAccount.findUnique({ where: { customerId: req.user!.id } }),
    getSetting(),
    prisma.loyaltyTransaction.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notificationLog.findMany({
      where: { userId: req.user!.id, template: "loyalty_points_awarded", readAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, payload: true, createdAt: true },
    }),
  ]);
  res.json({
    balance: account?.balance ?? 0,
    lifetimeEarned: account?.lifetimeEarned ?? 0,
    lifetimeUsed: account?.lifetimeUsed ?? 0,
    rupeesPerPoint: setting.rupeesPerPoint,
    minimumRedeemPoints: setting.minimumRedeemPoints,
    isActive: setting.isActive,
    transactions: transactions.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    unreadRewards: rewardNotifications.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  });
}

export async function markRewardNotificationRead(req: Request, res: Response) {
  const id = String(req.params.id);
  const updated = await prisma.notificationLog.updateMany({
    where: { id, userId: req.user!.id, template: "loyalty_points_awarded", readAt: null },
    data: { readAt: new Date() },
  });
  if (!updated.count) {
    res.status(404).json({ error: "Reward notification not found." });
    return;
  }
  res.json({ id, read: true });
}

export async function listAdminFeedback(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  const allowed = ["all", "pending", "rewarded", "rejected"];
  if (!allowed.includes(status)) {
    res.status(400).json({ error: "Invalid feedback status filter." });
    return;
  }
  const [items, counts] = await Promise.all([
    prisma.customerFeedback.findMany({
      where: status === "all" ? {} : { status },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        reviewedBy: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerFeedback.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  res.json({
    items: await Promise.all(
      items.map(async (item) => ({
        ...(await serializedFeedback(item)),
        customer: item.customer,
        reviewedBy: item.reviewedBy?.name ?? null,
      })),
    ),
    counts: Object.fromEntries(counts.map((item) => [item.status, item._count._all])),
  });
}

export async function reviewFeedback(req: Request, res: Response) {
  const body = input(req.body);
  const action = body.action;
  if (action !== "reward" && action !== "reject") {
    throw Object.assign(new Error("action must be reward or reject."), { status: 400 });
  }
  const adminNote = text(body.adminNote, "adminNote", 3, 500);
  const requestedPoints = Number(body.rewardPoints);
  if (action === "reward" && (!Number.isInteger(requestedPoints) || requestedPoints < 1 || requestedPoints > 100000)) {
    throw Object.assign(new Error("rewardPoints must be a whole number between 1 and 100,000."), { status: 400 });
  }
  const id = String(req.params.id);
  const result = await prisma.$transaction(async (tx) => {
    const feedback = await tx.customerFeedback.findUnique({ where: { id } });
    if (!feedback) throw Object.assign(new Error("Feedback not found."), { status: 404 });
    if (feedback.status !== "pending") {
      throw Object.assign(new Error("This feedback has already been reviewed."), { status: 409 });
    }
    const rewardPoints = action === "reward" ? requestedPoints : 0;
    const guarded = await tx.customerFeedback.updateMany({
      where: { id, status: "pending" },
      data: {
        status: action === "reward" ? "rewarded" : "rejected",
        adminNote,
        rewardPoints,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
    });
    if (!guarded.count) {
      throw Object.assign(new Error("This feedback has already been reviewed."), { status: 409 });
    }
    if (action === "reward") {
      await tx.loyaltyAccount.upsert({
        where: { customerId: feedback.customerId },
        create: { customerId: feedback.customerId, balance: rewardPoints, lifetimeEarned: rewardPoints },
        update: { balance: { increment: rewardPoints }, lifetimeEarned: { increment: rewardPoints } },
      });
      await tx.loyaltyTransaction.create({
        data: {
          customerId: feedback.customerId,
          feedbackId: feedback.id,
          type: "feedback_reward",
          points: rewardPoints,
          description: `Reward for verified feedback: ${feedback.subject}`,
          createdBy: req.user!.id,
        },
      });
      await tx.notificationLog.create({
        data: {
          userId: feedback.customerId,
          channel: "in_app",
          template: "loyalty_points_awarded",
          payload: { points: rewardPoints, feedbackId: feedback.id, subject: feedback.subject },
          sentAt: new Date(),
        },
      });
    }
    return tx.customerFeedback.findUniqueOrThrow({
      where: { id },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        reviewedBy: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });
  });
  res.json({
    ...(await serializedFeedback(result)),
    customer: result.customer,
    reviewedBy: result.reviewedBy?.name ?? null,
  });
}

export async function getLoyaltySetting(_req: Request, res: Response) {
  res.json(await getSetting());
}

export async function updateLoyaltySetting(req: Request, res: Response) {
  const body = input(req.body);
  const rupeesPerPoint = Number(body.rupeesPerPoint);
  const minimumRedeemPoints = Number(body.minimumRedeemPoints);
  const defaultFeedbackReward = Number(body.defaultFeedbackReward);
  if (!Number.isFinite(rupeesPerPoint) || rupeesPerPoint <= 0 || rupeesPerPoint > 1000) {
    throw Object.assign(new Error("rupeesPerPoint must be greater than 0 and no more than 1,000."), { status: 400 });
  }
  if (!Number.isInteger(minimumRedeemPoints) || minimumRedeemPoints < 1 || minimumRedeemPoints > 100000) {
    throw Object.assign(new Error("minimumRedeemPoints must be between 1 and 100,000."), { status: 400 });
  }
  if (!Number.isInteger(defaultFeedbackReward) || defaultFeedbackReward < 1 || defaultFeedbackReward > 100000) {
    throw Object.assign(new Error("defaultFeedbackReward must be between 1 and 100,000."), { status: 400 });
  }
  const setting = await prisma.loyaltySetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      rupeesPerPoint,
      minimumRedeemPoints,
      defaultFeedbackReward,
      isActive: body.isActive !== false,
      updatedBy: req.user!.id,
    },
    update: {
      rupeesPerPoint,
      minimumRedeemPoints,
      defaultFeedbackReward,
      isActive: body.isActive !== false,
      updatedBy: req.user!.id,
    },
  });
  res.json(setting);
}
