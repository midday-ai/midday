export const NEW_USER_CUTOFF = "2026-04-20T00:00:00.000Z";

export function isBlockedNewUser(createdAt: string | null | undefined) {
  if (!createdAt) return false;
  // Skip the waitlist gate in non-production Railway environments (staging, etc.)
  if (
    process.env.RAILWAY_ENVIRONMENT &&
    process.env.RAILWAY_ENVIRONMENT !== "production"
  ) {
    return false;
  }
  return new Date(createdAt) >= new Date(NEW_USER_CUTOFF);
}
