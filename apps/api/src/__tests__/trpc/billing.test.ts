import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { billingRouter } from "../../trpc/routers/billing";
import { createTestContext } from "../helpers/test-context";
import { mockDb, mocks } from "../setup";

const createCaller = createCallerFactory(billingRouter);

describe("tRPC: billing.getActiveSubscription", () => {
  beforeEach(() => {
    mocks.polarSubscriptionsList.mockReset();
    mocks.polarSubscriptionsList.mockImplementation(() =>
      Promise.resolve({ result: { items: [] } }),
    );
  });

  test("returns null when Polar has no active subscription", async () => {
    const caller = createCaller(createTestContext());

    expect(await caller.getActiveSubscription()).toBeNull();
    expect(mocks.polarSubscriptionsList).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "polar-customer-id" }),
    );
  });

  test("returns null when Polar list throws", async () => {
    mocks.polarSubscriptionsList.mockRejectedValueOnce(new Error("polar down"));

    const caller = createCaller(createTestContext());
    expect(await caller.getActiveSubscription()).toBeNull();
  });
});

describe("tRPC: billing.cancelSubscription", () => {
  beforeEach(() => {
    mocks.polarSubscriptionsList.mockReset();
    mocks.polarSubscriptionsUpdate.mockReset();
    mocks.updateTeam.mockReset();
    mockDb.query.users.findFirst.mockReset();
    mockDb.query.users.findFirst.mockImplementation(() =>
      Promise.resolve({
        id: "test-user-id",
        teamId: "test-team-id",
        email: "test@example.com",
        usersOnTeams: [{ id: "membership-1", teamId: "test-team-id" }],
      }),
    );
    mocks.polarSubscriptionsUpdate.mockImplementation(() =>
      Promise.resolve({}),
    );
    mocks.updateTeam.mockImplementation(() => Promise.resolve({}));
  });

  test("cancels at period end and updates team via updateTeamById", async () => {
    mocks.polarSubscriptionsList.mockImplementation(() =>
      Promise.resolve({
        result: {
          items: [
            {
              id: "sub_1",
              status: "active",
              cancelAtPeriodEnd: false,
              productId: "prod_test",
              metadata: { teamId: "test-team-id" },
            },
          ],
        },
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.cancelSubscription({
      reason: "too_expensive",
    });

    expect(result).toEqual({ success: true });
    expect(mocks.polarSubscriptionsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sub_1",
        subscriptionUpdate: expect.objectContaining({
          cancelAtPeriodEnd: true,
          customerCancellationReason: "too_expensive",
        }),
      }),
    );
    expect(mocks.updateTeam).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "test-team-id",
        data: { canceledAt: expect.any(String) },
      }),
    );
  });

  test("throws NOT_FOUND when there is no active or canceled subscription", async () => {
    mocks.polarSubscriptionsList.mockImplementation(() =>
      Promise.resolve({ result: { items: [] } }),
    );

    const caller = createCaller(createTestContext());
    await expect(
      caller.cancelSubscription({ reason: "too_expensive" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "No active subscription found",
    });
    expect(mocks.polarSubscriptionsUpdate).not.toHaveBeenCalled();
    expect(mocks.updateTeam).not.toHaveBeenCalled();
  });
});
