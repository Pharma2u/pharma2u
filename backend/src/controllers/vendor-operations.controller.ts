import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

function httpError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function body(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw httpError("Request body must be an object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, required = true) {
  const result = typeof value === "string" ? value.trim() : "";
  if (required && !result) throw httpError(`${label} is required.`);
  return result;
}

function positiveNumber(value: unknown, label: string, allowZero = false) {
  const result = Number(value);
  if (!Number.isFinite(result) || (allowZero ? result < 0 : result <= 0))
    throw httpError(
      `${label} must be ${allowZero ? "zero or greater" : "greater than zero"}.`,
    );
  return result;
}

async function vendorPharmacy(vendorId: string) {
  const pharmacy = await prisma.pharmacy.findFirst({
    where: { vendorUserId: vendorId },
    select: { id: true },
  });
  if (!pharmacy)
    throw httpError("No pharmacy is linked to this vendor account.", 404);
  return pharmacy;
}

async function summary(vendorId: string) {
  const pharmacy = await vendorPharmacy(vendorId);
  const [orders, bills, openPayouts] = await Promise.all([
    prisma.order.findMany({
      where: {
        OR: [{ pharmacyId: pharmacy.id }, { relayPharmacyId: pharmacy.id }],
      },
      select: {
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    }),
    prisma.counterBill.findMany({
      where: { pharmacyId: pharmacy.id },
      select: { total: true, discount: true, paymentMethod: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { pharmacyId: pharmacy.id, status: { in: ["open", "approved"] } },
      _sum: { amount: true },
    }),
  ]);
  const paid = orders.filter((order) => order.paymentStatus === "paid");
  const onlineRevenue = paid
    .filter((order) => order.paymentMethod !== "cod")
    .reduce((sum, order) => sum + order.total, 0);
  const codRevenue = paid
    .filter((order) => order.paymentMethod === "cod")
    .reduce((sum, order) => sum + order.total, 0);
  const offlineRevenue = bills.reduce((sum, bill) => sum + bill.total, 0);
  const cashCounterRevenue = bills
    .filter((bill) => bill.paymentMethod === "cash")
    .reduce((sum, bill) => sum + bill.total, 0);
  const receivable = orders
    .filter((order) => order.paymentStatus === "pending")
    .reduce((sum, order) => sum + order.total, 0);
  const heldBalance = paid
    .filter((order) => order.status !== "delivered")
    .reduce((sum, order) => sum + order.total, 0);
  const pharmacyDiscounts = bills.reduce((sum, bill) => sum + bill.discount, 0);
  const committedPayouts = openPayouts._sum.amount ?? 0;
  const availableBalance = Math.max(
    0,
    onlineRevenue - heldBalance - committedPayouts,
  );
  return {
    pharmacyId: pharmacy.id,
    onlineRevenue,
    offlineRevenue,
    cashRevenue: cashCounterRevenue + codRevenue,
    receivable,
    stockPayable: 0,
    availableBalance,
    heldBalance,
    platformEarnings: onlineRevenue,
    upcomingPayout: committedPayouts,
    pharmacyDiscounts,
    totalRevenue: onlineRevenue + offlineRevenue + codRevenue,
  };
}

export async function getVendorFinancialSummary(req: Request, res: Response) {
  res.json(await summary(req.user!.id));
}

export async function createCounterBill(req: Request, res: Response) {
  const input = body(req.body);
  const pharmacy = await vendorPharmacy(req.user!.id);
  const paymentMethod = text(
    input.paymentMethod,
    "paymentMethod",
  ).toLowerCase();
  if (!["cash", "upi", "card"].includes(paymentMethod))
    throw httpError("paymentMethod must be cash, upi, or card.");
  if (!Array.isArray(input.items) || input.items.length === 0)
    throw httpError("At least one bill item is required.");
  const requested = input.items.map((value) => {
    const item = body(value);
    return {
      productId: text(item.productId, "productId"),
      qty: Math.floor(positiveNumber(item.qty, "qty")),
    };
  });
  const discount = positiveNumber(input.discount ?? 0, "discount", true);

  const bill = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: {
        pharmacyId: pharmacy.id,
        id: { in: requested.map((item) => item.productId) },
        isActive: true,
      },
      select: { id: true, name: true, price: true, stock: true },
    });
    if (products.length !== requested.length)
      throw httpError("One or more selected products are unavailable.", 409);
    const lines = requested.map((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      )!;
      if (product.stock < item.qty)
        throw httpError(
          `Only ${product.stock} units of ${product.name} are available.`,
          409,
        );
      return { product, qty: item.qty };
    });
    const subtotal = lines.reduce(
      (sum, line) => sum + line.product.price * line.qty,
      0,
    );
    if (discount > subtotal)
      throw httpError("Discount cannot exceed the bill subtotal.");
    for (const line of lines) {
      const updated = await tx.product.updateMany({
        where: {
          id: line.product.id,
          pharmacyId: pharmacy.id,
          stock: { gte: line.qty },
        },
        data: { stock: { decrement: line.qty } },
      });
      if (!updated.count)
        throw httpError(
          `Stock changed for ${line.product.name}. Review the bill and try again.`,
          409,
        );
    }
    return tx.counterBill.create({
      data: {
        pharmacyId: pharmacy.id,
        billNumber: `CB-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`,
        customerReference:
          text(input.customerReference, "customerReference", false) || null,
        paymentMethod,
        subtotal,
        discount,
        total: subtotal - discount,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            name: line.product.name,
            qty: line.qty,
            price: line.product.price,
          })),
        },
      },
      include: { items: true },
    });
  });
  res.status(201).json(bill);
}

export async function listVendorPromotions(req: Request, res: Response) {
  const pharmacy = await vendorPharmacy(req.user!.id);
  res.json({
    items: await prisma.vendorPromotion.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: "desc" },
    }),
  });
}

export async function createVendorPromotion(req: Request, res: Response) {
  const input = body(req.body);
  const pharmacy = await vendorPharmacy(req.user!.id);
  const code = text(input.code, "code").toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code))
    throw httpError(
      "Coupon code must be 3 to 24 letters, numbers, underscores, or hyphens.",
    );
  const promotion = await prisma.vendorPromotion.create({
    data: {
      pharmacyId: pharmacy.id,
      title: text(input.title, "title"),
      code,
      amountOff: positiveNumber(input.amountOff, "amountOff"),
      minimumOrder: positiveNumber(
        input.minimumOrder ?? 0,
        "minimumOrder",
        true,
      ),
      expiresAt: input.expiresAt
        ? new Date(text(input.expiresAt, "expiresAt"))
        : null,
    },
  });
  res.status(201).json(promotion);
}

export async function listPayoutRequests(req: Request, res: Response) {
  const pharmacy = await vendorPharmacy(req.user!.id);
  res.json({
    items: await prisma.payoutRequest.findMany({
      where: { pharmacyId: pharmacy.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  });
}


export async function createPayoutRequest(req: Request, res: Response) {
  const input = body(req.body);
  const financials = await summary(req.user!.id);
  const amount = positiveNumber(input.amount, "amount");
  if (amount > financials.availableBalance)
    throw httpError("Withdrawal amount exceeds the available balance.", 409);
  const ticket = await prisma.payoutRequest.create({
    data: {
      pharmacyId: financials.pharmacyId,
      amount,
      note: text(input.note, "note"),
    },
  });
  res.status(201).json(ticket);
}



export async function getVendorSettings(req: Request, res: Response) {
  const pharmacy = await vendorPharmacy(req.user!.id);
  const settings = await prisma.vendorSettings.findUnique({
    where: { pharmacyId: pharmacy.id },
  });
  res.json(
    settings ?? { pharmacyId: pharmacy.id, printerUrl: null, autoPrint: true },
  );
}
export async function updateVendorSettings(req: Request, res: Response) {
  const input = body(req.body);
  const pharmacy = await vendorPharmacy(req.user!.id);
  const printerUrl = text(input.printerUrl, "printerUrl", false) || null;
  if (printerUrl && !/^https?:\/\//i.test(printerUrl))
    throw httpError("Printer URL must start with http:// or https://.");
  const settings = await prisma.vendorSettings.upsert({
    where: { pharmacyId: pharmacy.id },
    create: {
      pharmacyId: pharmacy.id,
      printerUrl,
      autoPrint: input.autoPrint !== false,
    },
    update: { printerUrl, autoPrint: input.autoPrint !== false },
  });
  res.json(settings);
}
