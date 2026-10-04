import { afterEach, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import type { Database } from "../client";
import { deleteUser } from "../queries/users";

const original = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = original;
});
function database() {
  const touched: string[] = [];
  const chain = {
    from(table: Parameters<typeof getTableName>[0]) {
      touched.push(getTableName(table));
      return chain;
    },
    where() {
      return chain;
    },
    for: async () => [],
    groupBy: async () => [],
  };
  const tx = {
    select: () => chain,
    delete(table: Parameters<typeof getTableName>[0]) {
      touched.push(getTableName(table));
      return { where: async () => undefined };
    },
  };
  return {
    db: {
      transaction: (callback: (value: typeof tx) => unknown) => callback(tx),
    } as unknown as Database,
    touched,
  };
}
test("default Supabase deletion never accesses local auth tables", async () => {
  delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  const { db, touched } = database();
  await deleteUser(db, crypto.randomUUID());
  expect(touched).toContain("users");
  expect(touched.some((name) => name.startsWith("auth_"))).toBe(false);
});
test("local deletion targets the auth owner for cascading session cleanup", async () => {
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
  const { db, touched } = database();
  await deleteUser(db, crypto.randomUUID());
  expect(touched).toContain("auth_users");
  expect(touched).not.toContain("users");
});
