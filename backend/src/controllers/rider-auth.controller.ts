import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createAuthToken } from "../utils/jwt";

const genericMessage =
  "If this is an approved rider number, an OTP has been sent.";

export async function requestRiderOtp(req: Request, res: Response) {
  const phone =
    typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  if (!/^[6-9]\d{9}$/.test(phone)) {
    res.status(400).json({ error: "Enter a valid 10-digit mobile number." });
    return;
  }
  const rider = await prisma.user.findFirst({
    where: {
      phone,
      role: "rider",
      applicationStatus: "approved",
      isActive: true,
    },
    select: { id: true },
  });
  if (!rider) {
    res.json({ message: genericMessage });
    return;
  }
  const code = randomInt(100_000, 1_000_000).toString();
  await prisma.$transaction([
    prisma.riderLoginOtp.create({
      data: {
        phone,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    }),
    prisma.notificationLog.create({
      data: {
        userId: rider.id,
        channel: "sms",
        template: "rider_login_otp",
        payload: { code, expiresInMinutes: 5 },
      },
    }),
  ]);
  res.json({
    message: genericMessage,
    ...(process.env.NODE_ENV === "production" ? {} : { developmentOtp: code }),
  });
}

export async function verifyRiderOtp(req: Request, res: Response) {
  const phone =
    typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const code = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";
  if (!/^[6-9]\d{9}$/.test(phone) || !/^\d{6}$/.test(code)) {
    res
      .status(400)
      .json({ error: "A valid mobile number and 6-digit OTP are required." });
    return;
  }
  const otp = await prisma.riderLoginOtp.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp || otp.expiresAt < new Date() || otp.attempts >= 5) {
    res.status(401).json({ error: "OTP is invalid or expired." });
    return;
  }
  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    await prisma.riderLoginOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    res.status(401).json({ error: "OTP is invalid or expired." });
    return;
  }
  const rider = await prisma.user.findFirst({
    where: {
      phone,
      role: "rider",
      applicationStatus: "approved",
      isActive: true,
    },
    select: { id: true, name: true, role: true, mustChangePassword: true },
  });
  if (!rider) {
    res.status(401).json({ error: "OTP is invalid or expired." });
    return;
  }
  await prisma.$transaction([
    prisma.riderLoginOtp.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    }),
    // OTP is itself a complete authentication option, so it satisfies the
    // temporary-password gate for riders who choose passwordless access.
    prisma.user.update({
      where: { id: rider.id },
      data: { mustChangePassword: false },
    }),
  ]);
  const token = createAuthToken(rider.id, rider.role);
  res.json({
    token,
    role: "rider",
    name: rider.name,
    mustChangePassword: false,
  });
}
