import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { bankAccountsRouter } from "../../trpc/routers/bank-accounts";
import {
  createMinimalBankAccountResponse,
  createValidBankAccountResponse,
} from "../factories/bank-account";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

// Create a test caller
const createCaller = createCallerFactory(bankAccountsRouter);

describe("tRPC: bankAccounts.get", () => {
  beforeEach(() => {
    mocks.getBankAccounts.mockReset();
    mocks.getBankAccounts.mockImplementation(() => []);
  });

  test("returns bank accounts list", async () => {
    mocks.getBankAccounts.mockImplementation(() => [
      createValidBankAccountResponse(),
    ]);

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toHaveLength(1);
  });

  test("handles minimal bank account data", async () => {
    mocks.getBankAccounts.mockImplementation(() => [
      createMinimalBankAccountResponse(),
    ]);

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result[0]!.balance).toBeNull();
  });

  test("handles empty list", async () => {
    mocks.getBankAccounts.mockImplementation(() => []);

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toEqual([]);
  });

  test("filters by enabled status", async () => {
    mocks.getBankAccounts.mockImplementation(() => []);

    const caller = createCaller(createTestContext());
    await caller.get({ enabled: true });

    expect(mocks.getBankAccounts).toHaveBeenCalled();
  });
});

describe("tRPC: bankAccounts.create", () => {
  beforeEach(() => {
    mocks.createBankAccount.mockReset();
    mocks.createBankAccount.mockImplementation(() =>
      createValidBankAccountResponse(),
    );
  });

  test("creates bank account with valid data", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      name: "New Account",
      currency: "USD",
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.create({ name: "Test", currency: "EUR" });

    expect(mocks.createBankAccount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: bankAccounts.update", () => {
  beforeEach(() => {
    mocks.updateBankAccount.mockReset();
    mocks.updateBankAccount.mockImplementation(() =>
      createValidBankAccountResponse(),
    );
  });

  test("updates bank account successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      name: "Updated Account",
    });

    expect(result).toBeDefined();
  });

  test("passes correct parameters to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.update({
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
      enabled: false,
    });

    expect(mocks.updateBankAccount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: bankAccounts.delete", () => {
  beforeEach(() => {
    mocks.deleteBankAccount.mockReset();
    mocks.deleteBankAccount.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes bank account successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result).toBeDefined();
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: "c3d4e5f6-7a8b-4c9d-8e1f-2a3b4c5d6e7f" });

    expect(mocks.deleteBankAccount).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

const ACCOUNT_ID = "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

describe("tRPC: bankAccounts.getTransactionCount", () => {
  beforeEach(() => {
    mocks.getTransactionCountByBankAccountId.mockReset();
    mocks.getTransactionCountByBankAccountId.mockImplementation(() =>
      Promise.resolve(5),
    );
  });

  test("returns transaction count for bank account", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getTransactionCount({ id: ACCOUNT_ID });

    expect(result).toEqual({ count: 5 });
    expect(mocks.getTransactionCountByBankAccountId).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bankAccountId: ACCOUNT_ID,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: bankAccounts.getDetails", () => {
  beforeEach(() => {
    mocks.getBankAccountDetails.mockReset();
    mocks.getBankAccountDetails.mockImplementation(() =>
      Promise.resolve({
        id: ACCOUNT_ID,
        iban: null,
        accountNumber: null,
        routingNumber: null,
        wireRoutingNumber: null,
        bic: null,
        sortCode: null,
      }),
    );
  });

  test("returns decrypted account details", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getDetails({ id: ACCOUNT_ID });

    expect(result).toMatchObject({ id: ACCOUNT_ID });
    expect(mocks.getBankAccountDetails).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        accountId: ACCOUNT_ID,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: bankAccounts.currencies", () => {
  beforeEach(() => {
    mocks.getBankAccountsCurrencies.mockReset();
    mocks.getBankAccountsCurrencies.mockImplementation(() =>
      Promise.resolve([{ currency: "USD" }, { currency: "EUR" }]),
    );
  });

  test("returns distinct currencies for team accounts", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.currencies();

    expect(result).toEqual([{ currency: "USD" }, { currency: "EUR" }]);
    expect(mocks.getBankAccountsCurrencies).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });
});

describe("tRPC: bankAccounts.balances", () => {
  beforeEach(() => {
    mocks.getBankAccountsBalances.mockReset();
    mocks.getBankAccountsBalances.mockImplementation(() =>
      Promise.resolve([
        {
          id: ACCOUNT_ID,
          currency: "USD",
          balance: 1000,
          name: "Checking",
          logo_url: "",
        },
      ]),
    );
  });

  test("returns balances for team bank accounts", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.balances();

    expect(result).toEqual([
      {
        id: ACCOUNT_ID,
        currency: "USD",
        balance: 1000,
        name: "Checking",
        logo_url: "",
      },
    ]);
    expect(mocks.getBankAccountsBalances).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });
});
