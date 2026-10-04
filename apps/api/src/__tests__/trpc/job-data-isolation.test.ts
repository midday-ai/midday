import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { encrypt } from "@midday/encryption";
import { createCallerFactory } from "../../trpc/init";
import { bankConnectionsRouter } from "../../trpc/routers/bank-connections";
import { invoiceRouter } from "../../trpc/routers/invoice";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const id = "a9d792c3-17bc-499e-a85d-7881f15715c5";
const email = "customer@example.test";
const savedEncryptionKey = process.env.MIDDAY_ENCRYPTION_KEY;
const encryptionKey = randomBytes(32).toString("hex");

describe("tRPC jobs data migration tenancy", () => {
  afterAll(() => {
    if (savedEncryptionKey === undefined)
      delete process.env.MIDDAY_ENCRYPTION_KEY;
    else process.env.MIDDAY_ENCRYPTION_KEY = savedEncryptionKey;
    mocks.verifyInvoiceToken.mockImplementation(() => ({
      id: "invoice-123",
      teamId: "test-team-id",
    }));
  });
  beforeEach(() => {
    mocks.updateBankConnectionExpiry.mockReset();
    mocks.markInvoiceViewed.mockReset();
    mocks.verifyInvoiceToken.mockReset();
    mocks.verifyInvoiceToken.mockImplementation(() => ({ id }));
    mocks.getInvoiceById.mockReset();
    mocks.getInvoiceById.mockImplementation(() => ({
      id,
      teamId: "invoice-team",
      customer: { email },
    }));
    process.env.MIDDAY_ENCRYPTION_KEY = encryptionKey;
  });

  test("foreign reconnect returns NOT_FOUND without mutating its row", async () => {
    const foreign = {
      id,
      teamId: "other-team",
      expiresAt: null,
      referenceId: "unchanged",
    };
    mocks.updateBankConnectionExpiry.mockImplementation((_db, params) => {
      if (params.teamId !== foreign.teamId) return undefined;
      Object.assign(foreign, params);
      return foreign;
    });
    const caller = createCallerFactory(bankConnectionsRouter)(
      createTestContext(),
    );
    await expect(
      caller.updateReconnect({ id, referenceId: "attack" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(foreign).toEqual({
      id,
      teamId: "other-team",
      expiresAt: null,
      referenceId: "unchanged",
    });
    expect(mocks.updateBankConnectionExpiry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("reconnect duration preserves provider input and rejects invalid bounds", async () => {
    mocks.updateBankConnectionExpiry.mockImplementation(() => ({ id }));
    const caller = createCallerFactory(bankConnectionsRouter)(
      createTestContext(),
    );
    await caller.updateReconnect({
      id,
      referenceId: "ref",
      accessValidForDays: 90,
    });
    const expected = new Date();
    expected.setDate(expected.getDate() + 90);
    expect(mocks.updateBankConnectionExpiry).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ expiresAt: expected.toDateString() }),
    );
    for (const accessValidForDays of [0, -1, 1.5, 731]) {
      await expect(
        caller.updateReconnect({ id, accessValidForDays }),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });

  test("bad invoice token is rejected before any viewed-at write", async () => {
    mocks.verifyInvoiceToken.mockImplementation(() => {
      throw new Error("Bad token");
    });
    const caller = createCallerFactory(invoiceRouter)(createTestContext());
    await expect(
      caller.getInvoiceByToken({ token: "invalid", viewer: encrypt(email) }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.getInvoiceById).not.toHaveBeenCalled();
    expect(mocks.markInvoiceViewed).not.toHaveBeenCalled();
  });

  test("matching encrypted viewer writes only the token-selected invoice", async () => {
    const caller = createCallerFactory(invoiceRouter)(createTestContext());
    await caller.getInvoiceByToken({
      token: "valid",
      viewer: encodeURIComponent(encrypt(email)),
    });
    expect(mocks.markInvoiceViewed).toHaveBeenCalledWith(expect.anything(), {
      id,
      teamId: "invoice-team",
    });
  });

  test("metadata, malformed viewer, and another customer's viewer never write", async () => {
    const caller = createCallerFactory(invoiceRouter)(createTestContext());
    for (const viewer of [
      undefined,
      "garbage",
      "%zz",
      encrypt("wrong@example.test"),
    ]) {
      expect(
        await caller.getInvoiceByToken({ token: "valid", viewer }),
      ).toMatchObject({ id });
    }
    expect(mocks.markInvoiceViewed).not.toHaveBeenCalled();
  });
});
