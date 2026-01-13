import { describe, expect, test } from "bun:test";
import {
  type ApiAccount,
  type DbAccount,
  findMatchingAccount,
} from "@midday/supabase/account-matching";

describe("findMatchingAccount", () => {
  const createDbAccount = (overrides: Partial<DbAccount> = {}): DbAccount => ({
    id: "db-1",
    account_reference: "1234",
    type: "depository",
    currency: "USD",
    name: "Checking Account",
    ...overrides,
  });

  const createApiAccount = (
    overrides: Partial<ApiAccount> = {},
  ): ApiAccount => ({
    id: "api-1",
    resource_id: "1234",
    type: "depository",
    currency: "USD",
    name: "Checking Account",
    ...overrides,
  });

  test("matches account by resource_id", () => {
    const dbAccounts = [createDbAccount()];
    const apiAccount = createApiAccount();
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-1");
  });

  test("returns null when resource_id is null", () => {
    const dbAccounts = [createDbAccount()];
    const apiAccount = createApiAccount({ resource_id: null });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).toBeNull();
  });

  test("returns null when no matching resource_id", () => {
    const dbAccounts = [createDbAccount({ account_reference: "5678" })];
    const apiAccount = createApiAccount({ resource_id: "1234" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).toBeNull();
  });

  test("skips already matched accounts", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1" }),
      createDbAccount({ id: "db-2" }),
    ];
    const apiAccount = createApiAccount();
    const matchedIds = new Set<string>(["db-1"]);

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-2");
  });

  test("filters by type when DB has type", () => {
    const dbAccounts = [createDbAccount({ type: "credit" })];
    const apiAccount = createApiAccount({ type: "depository" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).toBeNull();
  });

  test("matches when DB type is null", () => {
    const dbAccounts = [createDbAccount({ type: null })];
    const apiAccount = createApiAccount({ type: "depository" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
  });

  test("filters by currency when DB has currency", () => {
    const dbAccounts = [createDbAccount({ currency: "EUR" })];
    const apiAccount = createApiAccount({ currency: "USD" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).toBeNull();
  });

  test("matches when DB currency is null", () => {
    const dbAccounts = [createDbAccount({ currency: null })];
    const apiAccount = createApiAccount({ currency: "USD" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
  });

  test("prefers exact name match when multiple candidates", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "Savings Account" }),
      createDbAccount({ id: "db-2", name: "Checking Account" }),
    ];
    const apiAccount = createApiAccount({ name: "Checking Account" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-2");
  });

  test("name matching is case-insensitive", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "CHECKING ACCOUNT" }),
    ];
    const apiAccount = createApiAccount({ name: "checking account" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-1");
  });

  test("takes first candidate when no name match", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "Account A" }),
      createDbAccount({ id: "db-2", name: "Account B" }),
    ];
    const apiAccount = createApiAccount({ name: "Different Name" });
    const matchedIds = new Set<string>();

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);

    expect(result).not.toBeNull();
    expect(result?.id).toBe("db-1");
  });

  test("handles accounts with same last_four correctly", () => {
    // Scenario: Two accounts ending in 1234 (checking and savings)
    const dbAccounts = [
      createDbAccount({
        id: "db-checking",
        account_reference: "1234",
        type: "depository",
        name: "Checking",
      }),
      createDbAccount({
        id: "db-savings",
        account_reference: "1234",
        type: "depository",
        name: "Savings",
      }),
    ];

    const matchedIds = new Set<string>();

    // First API account (checking)
    const checkingApi = createApiAccount({
      id: "api-checking",
      resource_id: "1234",
      type: "depository",
      name: "Checking",
    });

    const checkingMatch = findMatchingAccount(
      checkingApi,
      dbAccounts,
      matchedIds,
    );
    expect(checkingMatch?.id).toBe("db-checking");
    matchedIds.add(checkingMatch!.id);

    // Second API account (savings) - should NOT match the already-matched checking
    const savingsApi = createApiAccount({
      id: "api-savings",
      resource_id: "1234",
      type: "depository",
      name: "Savings",
    });

    const savingsMatch = findMatchingAccount(
      savingsApi,
      dbAccounts,
      matchedIds,
    );
    expect(savingsMatch?.id).toBe("db-savings");
  });
});
