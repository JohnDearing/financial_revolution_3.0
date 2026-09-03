import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const computed = scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, "hex");
  if (computed.byteLength !== existing.byteLength) return false;
  return timingSafeEqual(computed, existing);
}
