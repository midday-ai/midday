import { expect, test } from "bun:test";
import { getDomainFromEmail } from "./utils";

test("Get domain from email", () => {
  expect(getDomainFromEmail("invoice@supabase.com")).toMatch("supabase.com");
});
