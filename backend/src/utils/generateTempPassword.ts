// Generates one-time staff credentials using cryptographically secure randomness.
import { randomBytes } from "node:crypto";

const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const lower = "abcdefghijkmnopqrstuvwxyz";
const digits = "23456789";
const symbols = "!@#$%^&*_-+";
const alphabet = upper + lower + digits + symbols;

function pick(characters: string): string {
  return characters[randomBytes(1)[0]! % characters.length]!;
}

export function generateTempPassword(): string {
  const password = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (password.length < 12) password.push(pick(alphabet));
  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomBytes(1)[0]! % (index + 1);
    [password[index], password[swapIndex]] = [
      password[swapIndex]!,
      password[index]!,
    ];
  }
  return password.join("");
}
