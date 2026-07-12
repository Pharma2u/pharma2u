// Validates untrusted request bodies for authentication endpoints.
export type RegisterInput = {
  phone: string;
  password: string;
  name: string;
  address?: string;
};
export type LoginInput = { phone: string; password: string };
export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};
export type ProvisionStaffInput = {
  phone: string;
  name: string;
  role: "vendor" | "rider";
};
export type ProvisionAdminInput = {
  phone: string;
  name: string;
  currentPassword: string;
};

export class ValidationError extends Error {}
const phonePattern = /^[6-9]\d{9}$/;

function bodyObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new ValidationError("Request body must be an object.");
  return body as Record<string, unknown>;
}
function requiredString(body: Record<string, unknown>, field: string): string {
  if (typeof body[field] !== "string" || !body[field].trim())
    throw new ValidationError(`${field} is required.`);
  return body[field].trim();
}
function password(body: Record<string, unknown>, field: string): string {
  const value = requiredString(body, field);
  if (value.length < 8)
    throw new ValidationError(`${field} must be at least 8 characters.`);
  return value;
}
function phone(body: Record<string, unknown>): string {
  const value = requiredString(body, "phone");
  if (!phonePattern.test(value))
    throw new ValidationError(
      "phone must be a valid 10-digit Indian mobile number.",
    );
  return value;
}

export function validateRegister(body: unknown): RegisterInput {
  const data = bodyObject(body);
  const address = data.address;
  if (address !== undefined && typeof address !== "string")
    throw new ValidationError("address must be a string.");
  return {
    phone: phone(data),
    password: password(data, "password"),
    name: requiredString(data, "name"),
    ...(typeof address === "string" && address.trim()
      ? { address: address.trim() }
      : {}),
  };
}
export function validateLogin(body: unknown): LoginInput {
  const data = bodyObject(body);
  return { phone: phone(data), password: requiredString(data, "password") };
}
export function validateChangePassword(body: unknown): ChangePasswordInput {
  const data = bodyObject(body);
  return {
    currentPassword: requiredString(data, "currentPassword"),
    newPassword: password(data, "newPassword"),
  };
}
export function validateProvisionStaff(body: unknown): ProvisionStaffInput {
  const data = bodyObject(body);
  const role = data.role;
  if (role !== "vendor" && role !== "rider")
    throw new ValidationError("role must be either vendor or rider.");
  return { phone: phone(data), name: requiredString(data, "name"), role };
}
export function validateProvisionAdmin(body: unknown): ProvisionAdminInput {
  const data = bodyObject(body);
  return {
    phone: phone(data),
    name: requiredString(data, "name"),
    currentPassword: requiredString(data, "currentPassword"),
  };
}
