import { afterEach, describe, expect, mock, test } from "bun:test";
import { getBackendProvider } from "@midday/utils/backend";
import type { Client } from "pg";
import {
  assertLocalMigrationMode,
  assertLocalMigrationTarget,
} from "../migration-target";

const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
afterEach(() => {
  if (originalProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
});

describe("local migration boundary", () => {
  test("existing deployments default to Supabase and cannot run local migrations", () => {
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
    expect(getBackendProvider()).toBe("supabase");
    expect(assertLocalMigrationMode).toThrow(
      "require NEXT_PUBLIC_BACKEND_PROVIDER=local",
    );
  });

  test("local migrations require explicit valid selection", () => {
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
    expect(assertLocalMigrationMode).not.toThrow();
    process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "locla";
    expect(assertLocalMigrationMode).toThrow("must be supabase or local");
  });

  test.each([
    { supabase_auth: "auth.users", supabase_storage: null },
    { supabase_auth: null, supabase_storage: "storage.objects" },
  ])("rejects an existing Supabase database before any migration writes", async (row) => {
    const query = mock(async (_statement: string) => ({ rows: [row] }));
    await expect(
      assertLocalMigrationTarget({ query } as unknown as Pick<Client, "query">),
    ).rejects.toThrow("Supabase database");
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0]?.[0]).toStartWith("SELECT ");
  });

  test("allows a separate local database", async () => {
    const query = mock(async () => ({
      rows: [{ supabase_auth: null, supabase_storage: null }],
    }));
    await expect(
      assertLocalMigrationTarget({ query } as unknown as Pick<Client, "query">),
    ).resolves.toBeUndefined();
  });
});
