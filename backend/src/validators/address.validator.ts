export class AddressValidationError extends Error {}

type AddressInput = {
  label: string;
  flatOrHouse: string;
  addressLine: string;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  isDefault?: boolean;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AddressValidationError("Request body must be an object.");
  }
  return value as Record<string, unknown>;
}

function requiredText(
  input: Record<string, unknown>,
  field: keyof AddressInput,
  maxLength: number,
) {
  const value = typeof input[field] === "string" ? input[field].trim() : "";

  if (!value) throw new AddressValidationError(`${field} is required.`);


  if (value.length > maxLength)
    throw new AddressValidationError(
      `${field} must be at most ${maxLength} characters.`,
    );


  return value;
}

function optionalLandmark(input: Record<string, unknown>) {
  if (input.landmark === undefined) return undefined;

  if (input.landmark === null) return null;

  if (typeof input.landmark !== "string")
    throw new AddressValidationError("landmark must be a string.");

  const value = input.landmark.trim();

  if (value.length > 120)
    throw new AddressValidationError(
      "landmark must be at most 120 characters.",
    );

  return value || null;
}

function coordinates(input: Record<string, unknown>) {
  const hasLat = input.lat !== undefined,
    hasLng = input.lng !== undefined;

  if (hasLat !== hasLng)
    throw new AddressValidationError("lat and lng must be supplied together.");
  if (!hasLat) return {};
  if (input.lat === null && input.lng === null) return { lat: null, lng: null };
  if (
    typeof input.lat !== "number" ||
    !Number.isFinite(input.lat) ||
    typeof input.lng !== "number" ||
    !Number.isFinite(input.lng)
  ) {
    throw new AddressValidationError("Coordinates must be finite numbers.");
  }

  if (input.lat < -90 || input.lat > 90 || input.lng < -180 || input.lng > 180)
    throw new AddressValidationError("Coordinates are out of range.");
  
  return { lat: input.lat, lng: input.lng };
}

function defaultFlag(input: Record<string, unknown>) {
  if (input.isDefault === undefined) return {};
  if (typeof input.isDefault !== "boolean")
    throw new AddressValidationError("isDefault must be boolean.");
  return { isDefault: input.isDefault };
}

export function validateAddressCreate(value: unknown): AddressInput {
  const input = object(value),
    pincode = requiredText(input, "pincode", 6);
  if (!/^\d{6}$/.test(pincode))
    throw new AddressValidationError(
      "pincode must be a valid 6-digit Indian pincode.",
    );
  return {
    label: requiredText(input, "label", 40),
    flatOrHouse: requiredText(input, "flatOrHouse", 120),
    addressLine: requiredText(input, "addressLine", 300),
    landmark: optionalLandmark(input),
    city: requiredText(input, "city", 80),
    state: requiredText(input, "state", 80),
    pincode,
    ...coordinates(input),
    ...defaultFlag(input),
  };
}

export function validateAddressUpdate(value: unknown): Partial<AddressInput> {
  const input = object(value),
    update: Partial<AddressInput> = {};
  const fields: Array<
    ["label" | "flatOrHouse" | "addressLine" | "city" | "state", number]
  > = [
    ["label", 40],
    ["flatOrHouse", 120],
    ["addressLine", 300],
    ["city", 80],
    ["state", 80],
  ];
  for (const [field, maxLength] of fields)
    if (input[field] !== undefined)
      update[field] = requiredText(input, field, maxLength);
  if (input.pincode !== undefined) {
    const pincode = requiredText(input, "pincode", 6);
    if (!/^\d{6}$/.test(pincode))
      throw new AddressValidationError(
        "pincode must be a valid 6-digit Indian pincode.",
      );
    update.pincode = pincode;
  }
  const landmark = optionalLandmark(input);
  if (landmark !== undefined) update.landmark = landmark;
  Object.assign(update, coordinates(input), defaultFlag(input));
  if (!Object.keys(update).length)
    throw new AddressValidationError(
      "At least one address field must be supplied.",
    );
  return update;
}
