import { afterEach, expect, test } from "bun:test";
import { isBlockedNewUser } from "./new-user-gate";

const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
const originalCutoff = process.env.NEW_USER_CUTOFF;
afterEach(() => {
  if (originalProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
  if (originalCutoff === undefined) delete process.env.NEW_USER_CUTOFF;
  else process.env.NEW_USER_CUTOFF = originalCutoff;
});
test("fresh installs accept new users without a cutoff", () => {
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
  delete process.env.NEW_USER_CUTOFF;
  expect(isBlockedNewUser(new Date())).toBe(false);
  process.env.NEW_USER_CUTOFF = "";
  expect(isBlockedNewUser(new Date())).toBe(false);
});
test("configured cutoff blocks new sign-ups and preserves older accounts", () => {
  process.env.NEW_USER_CUTOFF = "2026-01-01T00:00:00Z";
  expect(isBlockedNewUser(new Date("2026-02-01"))).toBe(true);
  expect(isBlockedNewUser("2025-12-31T00:00:00Z")).toBe(false);
  expect(isBlockedNewUser(undefined)).toBe(false);
});

test("Supabase keeps the existing waitlist cutoff by default", () => {
  delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  delete process.env.NEW_USER_CUTOFF;
  expect(isBlockedNewUser("2026-04-21T00:00:00Z")).toBe(true);
  expect(isBlockedNewUser("2026-04-19T00:00:00Z")).toBe(false);
});
