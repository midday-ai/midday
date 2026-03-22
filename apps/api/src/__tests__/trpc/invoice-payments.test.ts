import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { invoicePaymentsRouter } from "../../trpc/routers/invoice-payments";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(invoicePaymentsRouter);

describe("tRPC: invoicePayments.stripeStatus", () => {
  beforeEach(() => {
    mocks.getTeamById.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({
        id: "test-team-id",
        stripeAccountId: null,
        stripeConnectStatus: null,
      }),
    );
  });

  test("returns disconnected status when Stripe is not linked", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.stripeStatus();

    expect(result).toEqual({
      connected: false,
      status: null,
      stripeAccountId: null,
    });
    expect(mocks.getTeamById).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns connected when team has a Stripe account", async () => {
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({
        id: "test-team-id",
        stripeAccountId: "acct_123",
        stripeConnectStatus: "active",
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.stripeStatus();

    expect(result).toEqual({
      connected: true,
      status: "active",
      stripeAccountId: "acct_123",
    });
  });

  test("throws when team id is missing from context", async () => {
    mocks.simulateMissingTeamOnce();

    const caller = createCaller(createTestContext());

    await expect(caller.stripeStatus()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(mocks.getTeamById).not.toHaveBeenCalled();
  });
});

describe("tRPC: invoicePayments.getConnectUrl", () => {
  test("returns REST connect URL string", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getConnectUrl();

    expect(result).toBe(
      `${process.env.MIDDAY_API_URL ?? "https://api.midday.ai"}/invoice-payments/connect-stripe`,
    );
  });

  test("throws when team id is missing from context", async () => {
    mocks.simulateMissingTeamOnce();
    const caller = createCaller(createTestContext());

    await expect(caller.getConnectUrl()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});

describe("tRPC: invoicePayments.disconnectStripe", () => {
  beforeEach(() => {
    mocks.getTeamById.mockReset();
    mocks.updateTeam.mockReset();
    mocks.getTeamById.mockImplementation(() =>
      Promise.resolve({
        id: "test-team-id",
        stripeAccountId: null,
        stripeConnectStatus: null,
      }),
    );
    mocks.updateTeam.mockImplementation(() => Promise.resolve({}));
  });

  test("clears Stripe fields via getTeamById and updateTeamById", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.disconnectStripe();

    expect(result).toEqual({ success: true });
    expect(mocks.getTeamById).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
    expect(mocks.updateTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "test-team-id",
        data: {
          stripeAccountId: null,
          stripeConnectStatus: null,
        },
      }),
    );
  });
});
