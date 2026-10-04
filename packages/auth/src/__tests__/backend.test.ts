import { afterEach, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));
const { getAuth } = await import("../server");
const original = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = original;
});
test("default Supabase refuses local auth before loading or initializing it", () => {
  delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  expect(() => getAuth()).toThrow("Local authentication is not selected");
});
