import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { bankConnectionsRouter } from "../../trpc/routers/bank-connections";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const CONN_ID = "d1e2f3a4-b5c6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(bankConnectionsRouter);

describe("tRPC: bankConnections.get", () => {
  beforeEach(() => {
    mocks.getBankConnections.mockReset();
    mocks.getBankConnections.mockImplementation(() => Promise.resolve([]));
  });

  test("returns connections for team", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.get({})).toEqual([]);
    expect(mocks.getBankConnections).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("passes enabled filter when provided", async () => {
    const caller = createCaller(createTestContext());
    await caller.get({ enabled: true });

    expect(mocks.getBankConnections).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        enabled: true,
      }),
    );
  });
});

describe("tRPC: bankConnections.delete", () => {
  beforeEach(() => {
    mocks.deleteBankConnection.mockReset();
    mocks.deleteBankConnection.mockImplementation(() =>
      Promise.resolve({
        id: CONN_ID,
        referenceId: "ref-xyz",
        provider: "gocardless",
        accessToken: "token-abc",
      }),
    );
  });

  test("deletes connection and returns row", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: CONN_ID });

    expect(result).toMatchObject({
      id: CONN_ID,
      referenceId: "ref-xyz",
      provider: "gocardless",
    });
    expect(mocks.deleteBankConnection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: CONN_ID, teamId: "test-team-id" }),
    );
  });

  test("throws when connection is not found", async () => {
    mocks.deleteBankConnection.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());

    await expect(caller.delete({ id: CONN_ID })).rejects.toThrow(
      "Bank connection not found",
    );
  });
});
