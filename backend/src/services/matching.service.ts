import { Prisma, type PrismaClient } from "../generated/prisma/client";

type Database = PrismaClient | Prisma.TransactionClient;
type Coordinates = { id: string; lat: number | null; lng: number | null };
type ProductChoice = { id: string; name: string; price: number; pharmacyId: string };

export type RequestedItem = {
  productId: string;
  qty: number;
};

export type MatchedItem = {
  productId: string;
  name: string;
  price: number;
  pharmacyId: string;
  qty: number;
  fromRelayPharmacy: boolean;
};

export type MatchResult = {
  primaryPharmacyId: string;
  relayPharmacyId: string | null;
  relayNode: { lat: number; lng: number } | null;
  items: MatchedItem[];
};

function matchingError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function kilometresBetween(left: Coordinates, right: Coordinates) {
  if (left.lat === null || left.lng === null || right.lat === null || right.lng === null) {
    return 0;
  }

  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLat = radians(right.lat - left.lat);
  const deltaLng = radians(right.lng - left.lng);
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(left.lat)) * Math.cos(radians(right.lat)) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

async function pharmacyCoordinates(db: Database, pharmacyIds: string[]) {
  if (pharmacyIds.length === 0) return [] as Coordinates[];

  return db.$queryRaw<Coordinates[]>(Prisma.sql`
    SELECT id, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
    FROM pharmacies
    WHERE id IN (${Prisma.join(pharmacyIds)})
  `);
}

function closestPharmacyId(
  pharmacyIds: Set<string>,
  primaryPharmacyId: string,
  locations: Coordinates[],
) {
  const primary = locations.find((location) => location.id === primaryPharmacyId);

  return [...pharmacyIds].sort((leftId, rightId) => {
    const left = locations.find((location) => location.id === leftId);
    const right = locations.find((location) => location.id === rightId);

    if (!primary || !left || !right) return leftId.localeCompare(rightId);
    return kilometresBetween(primary, left) - kilometresBetween(primary, right);
  })[0]!;
}

function relayNodeFor(primary: Coordinates | undefined, relay: Coordinates | undefined) {
  if (!primary || !relay || kilometresBetween(primary, relay) <= 2) return null;
  if (primary.lat === null || primary.lng === null || relay.lat === null || relay.lng === null) return null;

  return {
    lat: (primary.lat + relay.lat) / 2,
    lng: (primary.lng + relay.lng) / 2,
  };
}

export async function matchOrderItems(
  db: Database,
  requestedItems: RequestedItem[],
): Promise<MatchResult> {
  const requestedIds = requestedItems.map((item) => item.productId);
  if (new Set(requestedIds).size !== requestedIds.length) {
    throw matchingError("Each product can only be included once.", 400);
  }

  const sourceProducts = await db.product.findMany({
    where: { id: { in: requestedIds }, isActive: true },
    include: { pharmacy: { select: { id: true, isOpen: true } } },
  });
  if (sourceProducts.length !== requestedItems.length) {
    throw matchingError("One or more products are unavailable.", 400);
  }

  const productsById = new Map(sourceProducts.map((product) => [product.id, product]));
  const primaryProduct = productsById.get(requestedItems[0]!.productId)!;
  const primaryPharmacyId = primaryProduct.pharmacyId;
  if (!primaryProduct.pharmacy.isOpen) {
    throw matchingError("The selected pharmacy is currently closed.", 409);
  }

  const matchedProducts = new Map<string, ProductChoice>();
  const missingItems = requestedItems.filter((item) => {
    const product = productsById.get(item.productId)!;
    const availableAtPrimary = product.pharmacyId === primaryPharmacyId && product.stock >= item.qty;
    if (availableAtPrimary) matchedProducts.set(item.productId, product);
    return !availableAtPrimary;
  });

  let relayPharmacyId: string | null = null;
  if (missingItems.length > 0) {
    const alternatives = await Promise.all(
      missingItems.map(async (item) => {
        const source = productsById.get(item.productId)!;
        const candidates = await db.product.findMany({
          where: {
            isActive: true,
            stock: { gte: item.qty },
            pharmacy: { isOpen: true },
            OR: [{ genericName: source.genericName }, { name: source.name }],
          },
          include: { pharmacy: { select: { id: true } } },
        });
        return { requestedId: item.productId, candidates };
      }),
    );

    const commonPharmacyIds = alternatives
      .map((entry) => new Set(entry.candidates.map((candidate) => candidate.pharmacyId)))
      .reduce((common, candidateIds) => new Set([...common].filter((id) => candidateIds.has(id))));
    if (commonPharmacyIds.size === 0) {
      throw matchingError("The requested quantity is not available from a single nearby pharmacy.", 409);
    }

    const locations = await pharmacyCoordinates(db, [primaryPharmacyId, ...commonPharmacyIds]);
    relayPharmacyId = closestPharmacyId(commonPharmacyIds, primaryPharmacyId, locations);

    for (const alternative of alternatives) {
      const product = alternative.candidates.find(
        (candidate) => candidate.pharmacyId === relayPharmacyId,
      )!;
      matchedProducts.set(alternative.requestedId, product);
    }
  }

  const locations = relayPharmacyId
    ? await pharmacyCoordinates(db, [primaryPharmacyId, relayPharmacyId])
    : [];
  const primaryLocation = locations.find((location) => location.id === primaryPharmacyId);
  const relayLocation = locations.find((location) => location.id === relayPharmacyId);

  return {
    primaryPharmacyId,
    relayPharmacyId,
    relayNode: relayNodeFor(primaryLocation, relayLocation),
    items: requestedItems.map((item) => {
      const product = matchedProducts.get(item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        pharmacyId: product.pharmacyId,
        qty: item.qty,
        fromRelayPharmacy: product.pharmacyId !== primaryPharmacyId,
      };
    }),
  };
}