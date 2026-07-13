// Validates rider application fields and product-independent multipart metadata.
export class RiderValidationError extends Error {}
const allowedVehicleTypes = [
  "bike",
  "scooter",
  "motorcycle",
  "bicycle",
  "car",
] as const;


const req = (o: Record<string, unknown>, k: string) => {
  const v = o[k];
  if (typeof v !== "string" || !v.trim())
    throw new RiderValidationError(`${k} is required.`);
  return v.trim();
};


export function validateRiderApplication(v: unknown) {
  if (!v || typeof v !== "object")
    throw new RiderValidationError("Invalid application.");
  const o = v as Record<string, unknown>,
    phone = req(o, "phone"),
    aadharNumber = req(o, "aadharNumber"),
    panNumber = req(o, "panNumber").toUpperCase(),
    vehicleType = req(o, "vehicleType");
  if (!/^[6-9]\d{9}$/.test(phone))
    throw new RiderValidationError(
      "phone must be a valid 10-digit Indian mobile number.",
    );
  if (!/^\d{12}$/.test(aadharNumber))
    throw new RiderValidationError("Invalid Aadhar number.");
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber))
    throw new RiderValidationError("Invalid PAN number.");
  if (!(allowedVehicleTypes as readonly string[]).includes(vehicleType))
    throw new RiderValidationError("Invalid vehicleType.");
  return {
    name: req(o, "name"),
    phone,
    aadharNumber,
    panNumber,
    drivingLicenseNumber: req(o, "drivingLicenseNumber"),
    vehicleType,
    vehicleNumber: req(o, "vehicleNumber"),
  };
}


export function validateRejection(v: unknown) {
  if (!v || typeof v !== "object")
    throw new RiderValidationError("Invalid rejection.");
  return req(v as Record<string, unknown>, "reason");
}
