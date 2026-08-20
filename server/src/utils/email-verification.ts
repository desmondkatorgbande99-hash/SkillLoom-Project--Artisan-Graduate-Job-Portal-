import crypto from "node:crypto";

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashVerificationToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}