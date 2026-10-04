import { isLocalBackend } from "@midday/utils/backend";
export function isBlockedNewUser(createdAt: string | Date | null | undefined) {
  const cutoff =
    process.env.NEW_USER_CUTOFF ??
    (isLocalBackend() ? undefined : "2026-04-20T00:00:00.000Z");
  if (!cutoff || !createdAt) return false;
  return new Date(createdAt).getTime() >= new Date(cutoff).getTime();
}
