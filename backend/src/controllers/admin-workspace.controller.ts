import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";

const fields = [
  "name",
  "legalName",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "gstin",
  "registrationNumber",
] as const;
const divisions = ["pharmacy", "logistics", "corporate"] as const;
const ledgerTypes = ["receivable", "payable", "expense", "income"] as const;
const audiences = ["all", "pharmacies", "riders"] as const;
const ticketStatuses = ["open", "in-progress", "resolved"] as const;
function bad(message: string): never {
  const error = new Error(message) as Error & { status: number };
  error.status = 400;
  throw error;
}
function value(body: unknown, key: string, min = 1, max = 500) {
  const raw = (body as Record<string, unknown>)?.[key];
  const result = typeof raw === "string" ? raw.trim() : "";
  if (result.length < min || result.length > max) bad(`${key} is invalid.`);
  return result;
}
function choice<T extends string>(
  body: unknown,
  key: string,
  options: readonly T[],
) {
  const result = value(body, key);
  if (!options.includes(result as T)) bad(`${key} is invalid.`);
  return result as T;
}
function money(body: unknown, key: string) {
  const result = Number((body as Record<string, unknown>)?.[key]);
  if (!Number.isFinite(result) || result < 0) bad(`${key} is invalid.`);
  return result;
}
const date = (item: Date) => item.toISOString().slice(0, 10);
const code = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;

export async function getAdminWorkspace(_req: Request, res: Response) {
  const [
    company,
    ledger,
    announcements,
    employees,
    tickets,
    pharmacies,
    subscriptions,
    customers,
    roles,
    orders,
    applications,
    riders,
  ] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "default" } }),
    prisma.ledgerEntry.findMany({ orderBy: { entryDate: "desc" } }),
    prisma.adminAnnouncement.findMany({ orderBy: { publishedAt: "desc" } }),
    prisma.employee.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.supportTicket.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pharmacy.findMany({ select: { id: true, name: true } }),
    prisma.pharmacySubscription.findMany(),
    prisma.user.findMany({
      where: { role: "customer" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        ordersAsCustomer: { select: { total: true, status: true } },
      },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.order.findMany({
      select: {
        total: true,
        status: true,
        createdAt: true,
        deliveredAt: true,
        pharmacy: { select: { id: true, name: true } },
      },
    }),
    prisma.pharmacyApplication.findMany({
      where: { status: "pending" },
      select: { id: true, pharmacyName: true, address: true, createdAt: true },
      take: 5,
    }),
    prisma.user.count({
      where: { role: "rider", applicationStatus: "approved" },
    }),
  ]);
  const subscriptionByPharmacy = new Map(
    subscriptions.map((item) => [item.pharmacyId, item]),
  );
  const customerItems = customers.map((customer) => {
    const completed = customer.ordersAsCustomer.filter(
      (order) => order.status === "delivered",
    );
    const spend = completed.reduce((sum, order) => sum + order.total, 0);
    const points = Math.floor(spend / 10);
    return {
      id: customer.id,
      name: customer.name,
      phone: `••••• ${customer.phone.slice(-4)}`,
      orders: completed.length,
      spend,
      points,
      tier:
        points >= 5000
          ? "Platinum"
          : points >= 2500
            ? "Gold"
            : points >= 1000
              ? "Silver"
              : "Member",
    };
  });
  const delivered = orders.filter((order) => order.status === "delivered");
  const totals = new Map<
    string,
    { name: string; gmv: number; orders: number }
  >();
  for (const order of delivered) {
    const current = totals.get(order.pharmacy.id) ?? {
      name: order.pharmacy.name,
      gmv: 0,
      orders: 0,
    };
    current.gmv += order.total;
    current.orders += 1;
    totals.set(order.pharmacy.id, current);
  }
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - 5 + index);
    const end = new Date(start);
    end.setUTCMonth(end.getUTCMonth() + 1);
    return {
      month: start.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
      value: delivered
        .filter((order) => order.createdAt >= start && order.createdAt < end)
        .reduce((sum, order) => sum + order.total, 0),
    };
  });
  const deliveryMinutes = delivered.flatMap((order) =>
    order.deliveredAt
      ? [(order.deliveredAt.getTime() - order.createdAt.getTime()) / 60000]
      : [],
  );
  res.json({
    company:
      company ??
      Object.fromEntries([
        ...fields.map((key) => [key, ""]),
        ["logoDataUrl", ""],
      ]),
    financeScope: "combined",
    ledger: ledger.map((item) => ({
      id: item.id,
      date: date(item.entryDate),
      reference: item.reference,
      description: item.description,
      division: item.division,
      type: item.type,
      amount: item.amount,
      status: item.status,
    })),
    announcements: announcements.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      audience: item.audience,
      publishedAt: date(item.publishedAt),
    })),
    employees: employees.map((item) => ({
      id: item.employeeCode,
      name: item.name,
      role: item.jobRole,
      department: item.department,
      monthlySalary: item.monthlySalary,
      status: item.status,
    })),
    tickets: tickets.map((item) => ({
      id: item.ticketCode,
      subject: item.subject,
      requester: item.requester,
      category: item.category,
      priority: item.priority,
      status: item.status,
    })),
    subscriptions: pharmacies.map((pharmacy) => {
      const item = subscriptionByPharmacy.get(pharmacy.id);
      return {
        pharmacyId: pharmacy.id,
        pharmacy: pharmacy.name,
        plan: item?.plan ?? "Unconfigured",
        amount: item?.amount ?? 0,
        nextBilling: item?.nextBilling
          ? date(item.nextBilling)
          : "Not scheduled",
        autopay: item?.autopay ?? false,
        status: item?.status ?? "attention",
      };
    }),
    customers: customerItems,
    customerSummary: {
      members: customerItems.length,
      points: customerItems.reduce((sum, item) => sum + item.points, 0),
    },
    permissions: roles.map((item) => ({
      role: item.role,
      users: item._count._all,
      access: `${item.role} portal access`,
      tone:
        item.role === "admin"
          ? "emerald"
          : item.role === "vendor"
            ? "blue"
            : item.role === "rider"
              ? "violet"
              : "amber",
    })),
    dashboard: {
      grossVolume: delivered.reduce((sum, order) => sum + order.total, 0),
      activePharmacies: pharmacies.length,
      fulfilledOrders: delivered.length,
      activeRiders: riders,
      revenueByMonth: monthlyRevenue,
      pendingApplications: applications.map((application) => ({
        id: application.id,
        pharmacyName: application.pharmacyName,
        address: application.address,
        submittedAt: date(application.createdAt),
      })),
      topPharmacy:
        [...totals.values()].sort((a, b) => b.gmv - a.gmv)[0] ?? null,
      newCustomers: customers.filter(
        (item) => item.createdAt >= new Date(Date.now() - 30 * 86400000),
      ).length,
      onTimePercent: deliveryMinutes.length
        ? (deliveryMinutes.filter((minutes) => minutes <= 30).length /
            deliveryMinutes.length) *
          100
        : 0,
      averageFulfilmentMinutes: deliveryMinutes.length
        ? deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length
        : 0,
      netMarginPercent: delivered.length
        ? ((ledger
            .filter((item) => item.type === "income" || item.type === "receivable")
            .reduce((sum, item) => sum + item.amount, 0) -
            ledger
              .filter((item) => item.type === "expense" || item.type === "payable")
              .reduce((sum, item) => sum + item.amount, 0)) /
            Math.max(delivered.reduce((sum, order) => sum + order.total, 0), 1)) * 100
        : 0,
    },
  });
}

export async function saveCompany(req: Request, res: Response) {
  const data = {
    name: value(req.body, "name"),
    legalName: value(req.body, "legalName"),
    phone: value(req.body, "phone"),
    email: value(req.body, "email"),
    address: value(req.body, "address"),
    city: value(req.body, "city"),
    state: value(req.body, "state"),
    pincode: value(req.body, "pincode"),
    gstin: value(req.body, "gstin", 0),
    registrationNumber: value(req.body, "registrationNumber", 0),
    logoDataUrl:
      typeof req.body?.logoDataUrl === "string" ? req.body.logoDataUrl : null,
  };
  res.json(
    await prisma.companyProfile.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: data,
    }),
  );
}

export async function createLedgerEntry(req: Request, res: Response) {
  const item = await prisma.ledgerEntry.create({
    data: {
      reference: code("MAN"),
      description: value(req.body, "description", 3, 200),
      division: choice(req.body, "division", divisions),
      type: choice(req.body, "type", ledgerTypes),
      amount: money(req.body, "amount"),
      createdBy: req.user!.id,
    },
  });
  res
    .status(201)
    .json({
      id: item.id,
      date: date(item.entryDate),
      reference: item.reference,
      description: item.description,
      division: item.division,
      type: item.type,
      amount: item.amount,
      status: item.status,
    });
}

export async function createAnnouncement(req: Request, res: Response) {
  const item = await prisma.adminAnnouncement.create({
    data: {
      title: value(req.body, "title", 4, 80),
      message: value(req.body, "message", 10, 500),
      audience: choice(req.body, "audience", audiences),
      publishedBy: req.user!.id,
    },
  });
  res
    .status(201)
    .json({
      id: item.id,
      title: item.title,
      message: item.message,
      audience: item.audience,
      publishedAt: date(item.publishedAt),
    });
}

export async function createEmployee(req: Request, res: Response) {
  const item = await prisma.employee.create({
    data: {
      employeeCode: code("EMP"),
      name: value(req.body, "name", 2, 100),
      jobRole: value(req.body, "role", 2, 100),
      department: value(req.body, "department", 2, 100),
      monthlySalary: money(req.body, "monthlySalary"),
    },
  });
  res
    .status(201)
    .json({
      id: item.employeeCode,
      name: item.name,
      role: item.jobRole,
      department: item.department,
      monthlySalary: item.monthlySalary,
      status: item.status,
    });
}

export async function updateTicket(req: Request, res: Response) {
  const ticketCode = String(req.params.id);
  const existing = await prisma.supportTicket.findUnique({
    where: { ticketCode },
  });
  if (!existing) {
    res.status(404).json({ error: "Support ticket not found." });
    return;
  }
  const status = choice(req.body, "status", ticketStatuses);
  const item = await prisma.supportTicket.update({
    where: { ticketCode },
    data: {
      status,
      assignedTo: status === "in-progress" ? req.user!.id : existing.assignedTo,
    },
  });
  res.json({
    id: item.ticketCode,
    subject: item.subject,
    requester: item.requester,
    category: item.category,
    priority: item.priority,
    status: item.status,
  });
}

export async function updateSubscription(req: Request, res: Response) {
  const pharmacyId = String(req.params.pharmacyId);
  const pharmacy = await prisma.pharmacy.findUnique({
    where: { id: pharmacyId },
    select: { name: true },
  });
  if (!pharmacy) {
    res.status(404).json({ error: "Pharmacy not found." });
    return;
  }
  if (typeof req.body?.autopay !== "boolean") bad("autopay must be a boolean.");
  const autopay = req.body.autopay as boolean;
  const item = await prisma.pharmacySubscription.upsert({
    where: { pharmacyId },
    create: { pharmacyId, autopay, status: autopay ? "active" : "attention" },
    update: { autopay, status: autopay ? "active" : "attention" },
  });
  res.json({
    pharmacyId,
    pharmacy: pharmacy.name,
    plan: item.plan,
    amount: item.amount,
    nextBilling: item.nextBilling ? date(item.nextBilling) : "Not scheduled",
    autopay: item.autopay,
    status: item.status,
  });
}
