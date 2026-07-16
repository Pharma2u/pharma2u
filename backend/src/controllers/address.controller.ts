import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import {
  validateAddressCreate,
  validateAddressUpdate,
} from "../validators/address.validator";

const addressFields = {
  id: true,
  label: true,
  flatOrHouse: true,
  addressLine: true,
  landmark: true,
  city: true,
  state: true,
  pincode: true,
  lat: true,
  lng: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listMyAddresses(req: Request, res: Response) {

  const items = await prisma.customerAddress.findMany({
    where: { customerId: req.user!.id },
    select: addressFields,
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  res.json({ items });
}

export async function createMyAddress(req: Request, res: Response) {
  const input = validateAddressCreate(req.body);

  const address = await prisma.$transaction(async (tx) => {
    const count = await tx.customerAddress.count({
      where: { customerId: req.user!.id },
    });

    const isDefault = input.isDefault ?? count === 0;
    if (isDefault)
      await tx.customerAddress.updateMany({
        where: { customerId: req.user!.id, isDefault: true },
        data: { isDefault: false },
      });


    return tx.customerAddress.create({
      data: { ...input, isDefault, customerId: req.user!.id },
      select: addressFields,
    });


  });


  res.status(201).json(address);
}

export async function updateMyAddress(req: Request, res: Response) {
  const input = validateAddressUpdate(req.body),
    id = String(req.params.id);

  const address = await prisma.$transaction(async (tx) => {
    const existing = await tx.customerAddress.findFirst({
      where: { id, customerId: req.user!.id },
      select: { id: true },
    });
    if (!existing) return null;

    if (input.isDefault)
      await tx.customerAddress.updateMany({
        where: { customerId: req.user!.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
  
    return tx.customerAddress.update({
      where: { id },
      data: input,
      select: addressFields,
    });

  });

  if (!address) {
    res.status(404).json({ error: "Address not found." });
    return;
  }

  res.json(address);
}

export async function deleteMyAddress(req: Request, res: Response) {
  const id = String(req.params.id);
  const deleted = await prisma.$transaction(async (tx) => {
    const address = await tx.customerAddress.findFirst({
      where: { id, customerId: req.user!.id },
      select: { id: true, isDefault: true },
    });


    if (!address) return false;
    await tx.customerAddress.delete({ where: { id } });
    
    if (address.isDefault) {
      const replacement = await tx.customerAddress.findFirst({
        where: { customerId: req.user!.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      if (replacement)
        await tx.customerAddress.update({
          where: { id: replacement.id },
          data: { isDefault: true },
        });
    }
    return true;
  });


  if (!deleted) {
    res.status(404).json({ error: "Address not found." });
    return;
  }

  res.status(204).send();
}
