import { describe, expect, test } from "bun:test";
import {
  type ApiAccount,
  type DbAccount,
  findMatchingAccount,
} from "@midday/supabase/account-matching";

describe("findMatchingAccount", () => {
  const createDbAccount = (overrides: Partial<DbAccount> = {}): DbAccount => ({
    id: "db-1",
    account_reference: "ref-1234",
    iban: null,
    type: "depository",
    currency: "USD",
    name: "Checking Account",
    ...overrides,
  });

  const createApiAccount = (
    overrides: Partial<ApiAccount> = {},
  ): ApiAccount => ({
    id: "api-1",
    resource_id: "ref-1234",
    iban: null,
    type: "depository",
    currency: "USD",
    name: "Checking Account",
    ...overrides,
  });

  // ── Tier 1: IBAN matching ──────────────────────────────────────────────

  test("matches by IBAN when no resource_id", () => {
    const dbAccounts = [
      createDbAccount({
        iban: "DE89370400440532013000",
        account_reference: null,
      }),
    ];
    const apiAccount = createApiAccount({
      iban: "DE89370400440532013000",
      resource_id: null,
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-1");
  });

  test("resource_id takes priority over IBAN", () => {
    const dbAccounts = [
      createDbAccount({
        id: "db-ref-match",
        account_reference: "ref-1234",
        iban: null,
      }),
      createDbAccount({
        id: "db-iban-match",
        account_reference: null,
        iban: "DE89370400440532013000",
      }),
    ];
    const apiAccount = createApiAccount({
      resource_id: "ref-1234",
      iban: "DE89370400440532013000",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-ref-match");
  });

  // ── Tier 2: resource_id / account_reference matching ───────────────────

  test("matches by resource_id when no IBAN", () => {
    const dbAccounts = [createDbAccount()];
    const apiAccount = createApiAccount();

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-1");
  });

  test("returns null when nothing matches", () => {
    const dbAccounts = [
      createDbAccount({
        account_reference: "5678",
        currency: "EUR",
        type: "credit",
      }),
    ];
    const apiAccount = createApiAccount({
      resource_id: "1234",
      currency: "USD",
      type: "depository",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result).toBeNull();
  });

  // ── Tier 3: fuzzy matching (currency + type + name) ────────────────────

  test("fuzzy matches by currency and type when no IBAN or resource_id", () => {
    const dbAccounts = [
      createDbAccount({
        account_reference: null,
        currency: "EUR",
        type: "depository",
      }),
    ];
    const apiAccount = createApiAccount({
      resource_id: null,
      iban: null,
      currency: "EUR",
      type: "depository",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-1");
  });

  test("fuzzy match prefers name match when multiple candidates", () => {
    const dbAccounts = [
      createDbAccount({
        id: "db-savings",
        account_reference: null,
        currency: "EUR",
        name: "Savings",
      }),
      createDbAccount({
        id: "db-paypal",
        account_reference: null,
        currency: "EUR",
        name: "PayPal",
      }),
    ];
    const apiAccount = createApiAccount({
      resource_id: null,
      iban: null,
      currency: "EUR",
      name: "PayPal",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-paypal");
  });

  test("fuzzy match rejects currency mismatch", () => {
    const dbAccounts = [
      createDbAccount({ account_reference: null, currency: "EUR" }),
    ];
    const apiAccount = createApiAccount({
      resource_id: null,
      iban: null,
      currency: "USD",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result).toBeNull();
  });

  // ── matchedDbIds tracking ──────────────────────────────────────────────

  test("skips already matched accounts", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1" }),
      createDbAccount({ id: "db-2" }),
    ];
    const apiAccount = createApiAccount();
    const matchedIds = new Set<string>(["db-1"]);

    const result = findMatchingAccount(apiAccount, dbAccounts, matchedIds);
    expect(result?.id).toBe("db-2");
  });

  // ── Name matching ──────────────────────────────────────────────────────

  test("prefers exact name match when multiple resource_id candidates", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "Savings Account" }),
      createDbAccount({ id: "db-2", name: "Checking Account" }),
    ];
    const apiAccount = createApiAccount({ name: "Checking Account" });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-2");
  });

  test("name matching is case-insensitive", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "CHECKING ACCOUNT" }),
    ];
    const apiAccount = createApiAccount({ name: "checking account" });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-1");
  });

  test("takes first candidate when no name match", () => {
    const dbAccounts = [
      createDbAccount({ id: "db-1", name: "Account A" }),
      createDbAccount({ id: "db-2", name: "Account B" }),
    ];
    const apiAccount = createApiAccount({ name: "Different Name" });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-1");
  });

  // ── Multi-account scenarios ────────────────────────────────────────────

  test("handles accounts with same resource_id correctly", () => {
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

  test("old accounts without iban or reference fall back to fuzzy match", () => {
    const dbAccounts = [
      createDbAccount({
        id: "db-paypal",
        account_reference: null,
        iban: null,
        currency: "EUR",
        type: "depository",
        name: "PayPal",
      }),
    ];
    const apiAccount = createApiAccount({
      resource_id: "new-resource-id",
      iban: null,
      currency: "EUR",
      type: "depository",
      name: "PayPal",
    });

    const result = findMatchingAccount(apiAccount, dbAccounts, new Set());
    expect(result?.id).toBe("db-paypal");
  });
});
