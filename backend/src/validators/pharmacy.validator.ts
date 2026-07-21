// Validates pharmacy administration request bodies.
export class PharmacyValidationError extends Error {}
const text = (o: Record<string, unknown>, k: string) => {
  const v = o[k];
  if (typeof v !== "string" || !v.trim())
    throw new PharmacyValidationError(`${k} is required.`);
  return v.trim();
};

const number = (o: Record<string, unknown>, k: string) => {
  const v = o[k];
  if (typeof v !== "number" || !Number.isFinite(v))
    throw new PharmacyValidationError(`${k} must be a finite number.`);
  return v;
};

const body = (v: unknown) => {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw new PharmacyValidationError("Request body must be an object.");
  return v as Record<string, unknown>;
};

export function validatePharmacyCreate(v: unknown) {
  const o = body(v),
    lat = number(o, "lat"),
    lng = number(o, "lng"),
    vendorPhone = text(o, "vendorPhone");
  if (!/^[6-9]\d{9}$/.test(vendorPhone))
    throw new PharmacyValidationError(
      "vendorPhone must be a valid 10-digit Indian mobile number.",
    );
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
    throw new PharmacyValidationError("Coordinates are out of range.");
  return {
    name: text(o, "pharmacyName"),
    address: text(o, "address"),
    lat,
    lng,
    drugLicenseNumber: text(o, "drugLicenseNumber"),
    pharmacistName: text(o, "pharmacistName"),
    pharmacistLicenseNumber: text(o, "pharmacistLicenseNumber"),
    vendorName: text(o, "vendorName"),
    vendorPhone,
  };
}

export function validatePharmacyUpdate(v: unknown) {
  const o = body(v),
    out: Record<string, unknown> = {};
  for (const key of [
    "name",
    "address",
    "drugLicenseNumber",
    "pharmacistName",
    "pharmacistLicenseNumber",
  ]) {
    if (o[key] !== undefined) out[key] = text(o, key);
  }
  if (o.isOpen !== undefined) {
    if (typeof o.isOpen !== "boolean")
      throw new PharmacyValidationError("isOpen must be boolean.");
    out.isOpen = o.isOpen;
  }
  const hasLat = o.lat !== undefined,
    hasLng = o.lng !== undefined;
  if (hasLat !== hasLng)
    throw new PharmacyValidationError("lat and lng must be supplied together.");
  if (hasLat) {
    const lat = number(o, "lat"),
      lng = number(o, "lng");
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
      throw new PharmacyValidationError("Coordinates are out of range.");
    out.lat = lat;
    out.lng = lng;
  }
  if (!Object.keys(out).length)
    throw new PharmacyValidationError("No update fields supplied.");
  return out;
}

export function validateVendorPharmacyProfile(v: unknown) {
  const o = body(v),
    out: Record<string, unknown> = {};
  for (const key of ["name", "address", "openingTime", "closingTime"])
    if (o[key] !== undefined) out[key] = text(o, key);
  if (o.operatingDays !== undefined) {
    const days = Array.isArray(o.operatingDays)
      ? o.operatingDays
      : typeof o.operatingDays === "string"
        ? o.operatingDays.split(",")
        : null;
    if (!days || days.some((day) => typeof day !== "string" || !day.trim()))
      throw new PharmacyValidationError(
        "operatingDays must be a list of days.",
      );
    out.operatingDays = [...new Set(days.map((day) => day.trim()))];
  }
  return out;
}
