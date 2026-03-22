import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { invoiceRecurringRouter } from "../../trpc/routers/invoice-recurring";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const RECURRING_ID = "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2";
const CUSTOMER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(invoiceRecurringRouter);

describe("tRPC: invoiceRecurring.list", () => {
  beforeEach(() => {
    mocks.getInvoiceRecurringList.mockReset();
    mocks.getInvoiceRecurringList.mockImplementation(() =>
      Promise.resolve({
        data: [],
        meta: {
          cursor: null,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      }),
    );
  });

  test("returns paginated list with defaults", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list({});

    expect(result).toEqual({
      data: [],
      meta: {
        cursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
    expect(mocks.getInvoiceRecurringList).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        cursor: null,
        pageSize: 25,
      }),
    );
  });

  test("rejects when team context is missing", async () => {
    mocks.simulateMissingTeamOnce();

    const caller = createCaller(createTestContext());

    await expect(caller.list({})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("rejects invalid customerId filter", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.list({ customerId: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceRecurring.get", () => {
  beforeEach(() => {
    mocks.getInvoiceRecurringById.mockReset();
    mocks.getInvoiceRecurringById.mockImplementation(() =>
      Promise.resolve({
        id: RECURRING_ID,
        frequency: "monthly_date",
      }),
    );
  });

  test("returns recurring series by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ id: RECURRING_ID });

    expect(result).toMatchObject({
      id: RECURRING_ID,
      frequency: "monthly_date",
    });
  });

  test("throws when series is not found", async () => {
    mocks.getInvoiceRecurringById.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());

    await expect(caller.get({ id: RECURRING_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.get({ id: "invalid" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceRecurring.delete", () => {
  beforeEach(() => {
    mocks.deleteInvoiceRecurring.mockReset();
    mocks.deleteInvoiceRecurring.mockImplementation(() =>
      Promise.resolve({ id: RECURRING_ID }),
    );
    mocks.updateInvoice.mockReset();
    mocks.updateInvoice.mockImplementation(() => Promise.resolve({}));
  });

  test("deletes series and returns id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: RECURRING_ID });

    expect(result).toEqual({ id: RECURRING_ID });
  });

  test("throws when series is not found", async () => {
    mocks.deleteInvoiceRecurring.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());

    await expect(caller.delete({ id: RECURRING_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: invoiceRecurring.pause", () => {
  beforeEach(() => {
    mocks.pauseInvoiceRecurring.mockReset();
    mocks.pauseInvoiceRecurring.mockImplementation(() =>
      Promise.resolve({
        id: RECURRING_ID,
        status: "paused",
      }),
    );
    mocks.updateInvoice.mockReset();
    mocks.updateInvoice.mockImplementation(() => Promise.resolve({}));
  });

  test("pauses series and returns paused record", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.pause({ id: RECURRING_ID });

    expect(result).toMatchObject({ id: RECURRING_ID, status: "paused" });
  });

  test("throws when series is not found", async () => {
    mocks.pauseInvoiceRecurring.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());

    await expect(caller.pause({ id: RECURRING_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: invoiceRecurring.resume", () => {
  beforeEach(() => {
    mocks.resumeInvoiceRecurring.mockReset();
    mocks.resumeInvoiceRecurring.mockImplementation(() =>
      Promise.resolve({
        id: RECURRING_ID,
        status: "active",
      }),
    );
  });

  test("resumes series and returns active record", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.resume({ id: RECURRING_ID });

    expect(result).toMatchObject({ id: RECURRING_ID, status: "active" });
    expect(mocks.resumeInvoiceRecurring).toHaveBeenCalledWith(
      expect.anything(),
      { id: RECURRING_ID, teamId: "test-team-id" },
    );
  });

  test("throws when series cannot be resumed", async () => {
    mocks.resumeInvoiceRecurring.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());

    await expect(caller.resume({ id: RECURRING_ID })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("tRPC: invoiceRecurring.create", () => {
  beforeEach(() => {
    mocks.getCustomerById.mockReset();
    mocks.createInvoiceRecurring.mockReset();
    mocks.createInvoiceRecurring.mockImplementation(() =>
      Promise.resolve({
        id: RECURRING_ID,
        frequency: "monthly_last_day",
        endType: "never",
      }),
    );
    mocks.getCustomerById.mockImplementation(() =>
      Promise.resolve({
        id: CUSTOMER_ID,
        email: "client@example.com",
        billingEmail: null,
      }),
    );
  });

  test("creates series with customer, frequency, timezone, and endType", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      customerId: CUSTOMER_ID,
      frequency: "monthly_last_day",
      timezone: "America/New_York",
      endType: "never",
    });

    expect(result).toMatchObject({
      id: RECURRING_ID,
      frequency: "monthly_last_day",
      endType: "never",
    });
    expect(mocks.getCustomerById).toHaveBeenCalledWith(expect.anything(), {
      id: CUSTOMER_ID,
      teamId: "test-team-id",
    });
    expect(mocks.createInvoiceRecurring).toHaveBeenCalled();
  });
});

describe("tRPC: invoiceRecurring.update", () => {
  beforeEach(() => {
    mocks.updateInvoiceRecurring.mockReset();
    mocks.updateInvoiceRecurring.mockImplementation(() =>
      Promise.resolve({
        id: RECURRING_ID,
        customerName: "Updated Co",
      }),
    );
  });

  test("applies partial update", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({
      id: RECURRING_ID,
      customerName: "Updated Co",
    });

    expect(result).toMatchObject({
      id: RECURRING_ID,
      customerName: "Updated Co",
    });
    expect(mocks.updateInvoiceRecurring).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: RECURRING_ID,
        teamId: "test-team-id",
        customerName: "Updated Co",
      }),
    );
  });
});

describe("tRPC: invoiceRecurring.getUpcoming", () => {
  beforeEach(() => {
    mocks.getUpcomingInvoices.mockReset();
    mocks.getUpcomingInvoices.mockImplementation(() =>
      Promise.resolve({
        invoices: [{ date: "2026-05-01T00:00:00.000Z", amount: 200 }],
        summary: {
          hasEndDate: false,
          totalCount: null,
          totalAmount: null,
          currency: "USD",
        },
      }),
    );
  });

  test("returns upcoming preview with limit", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getUpcoming({ id: RECURRING_ID, limit: 5 });

    expect(result.invoices).toHaveLength(1);
    expect(result.summary.currency).toBe("USD");
    expect(mocks.getUpcomingInvoices).toHaveBeenCalledWith(expect.anything(), {
      id: RECURRING_ID,
      teamId: "test-team-id",
      limit: 5,
    });
  });
});
