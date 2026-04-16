import crypto from "node:crypto";

const inviteAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const inviteCodePattern = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

export function makeInviteCode(length = 8) {
  return Array.from({ length }, () =>
    inviteAlphabet[crypto.randomInt(0, inviteAlphabet.length)]
  ).join("");
}

export function normalizeInviteCode(value: string) {
  const normalized = value.trim().toUpperCase();

  if (normalized.length < 6 || normalized.length > 12) {
    return null;
  }

  return inviteCodePattern.test(normalized) ? normalized : null;
}
