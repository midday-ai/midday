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
