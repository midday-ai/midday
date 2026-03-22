import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { customersRouter } from "../../trpc/routers/customers";
import {
  createCustomersListResponse,
  createMinimalCustomerResponse,
  createValidCustomerResponse,
} from "../factories/customer";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

// Create a test caller
const createCaller = createCallerFactory(customersRouter);

describe("tRPC: customers.get", () => {
  beforeEach(() => {
    mocks.getCustomers.mockReset();
    mocks.getCustomers.mockImplementation(() => createCustomersListResponse());
  });

  test("returns customers list", async () => {
    mocks.getCustomers.mockImplementation(() =>
      createCustomersListResponse([createValidCustomerResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("handles minimal customer data", async () => {
    mocks.getCustomers.mockImplementation(() =>
      createCustomersListResponse([createMinimalCustomerResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.phone).toBeNull();
  });

  test("handles empty list", async () => {
    mocks.getCustomers.mockImplementation(() =>
      createCustomersListResponse([]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toEqual([]);
  });

  test("passes query to DB", async () => {
    mocks.getCustomers.mockImplementation(() =>
      createCustomersListResponse([]),
    );

    const caller = createCaller(createTestContext());
    await caller.get({ q: "Acme" });

    expect(mocks.getCustomers).toHaveBeenCalled();
  });
});

describe("tRPC: customers.getById", () => {
  beforeEach(() => {
    mocks.getCustomerById.mockReset();
  });

  test("returns single customer", async () => {
    mocks.getCustomerById.mockImplementation(() =>
      createValidCustomerResponse(),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result?.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("returns null for non-existent customer", async () => {
    mocks.getCustomerById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    });

    expect(result).toBeNull();
  });

  test("passes correct parameters to DB query", async () => {
    mocks.getCustomerById.mockImplementation(() =>
      createValidCustomerResponse(),
    );

    const caller = createCaller(createTestContext());
    await caller.getById({ id: "c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f" });

    expect(mocks.getCustomerById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: customers.delete", () => {
  beforeEach(() => {
    mocks.deleteCustomer.mockReset();
    mocks.deleteCustomer.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes customer successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result).toBeDefined();
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: "d4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a" });

    expect(mocks.deleteCustomer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

const CUSTOMER_ID = "a1b2c3d4-e5f6-4789-a012-345678901234";
const PORTAL_ID = "d4e5f6a7-b8c9-4012-d345-678901234567";

describe("tRPC: customers.upsert", () => {
  beforeEach(() => {
    mocks.upsertCustomer.mockReset();
    mocks.upsertCustomer.mockImplementation(() =>
      Promise.resolve({
        id: CUSTOMER_ID,
        name: "Customer",
      }),
    );
  });

  test("upserts customer and calls upsertCustomer", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({
      name: "Customer",
      email: "billing@example.com",
    });

    expect(result).toMatchObject({ id: CUSTOMER_ID, name: "Customer" });
    expect(mocks.upsertCustomer).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Customer",
        email: "billing@example.com",
        teamId: "test-team-id",
        userId: "test-user-id",
      }),
    );
  });
});

describe("tRPC: customers.getInvoiceSummary", () => {
  beforeEach(() => {
    mocks.getCustomerInvoiceSummary.mockReset();
    mocks.getCustomerInvoiceSummary.mockImplementation(() =>
      Promise.resolve({
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        invoiceCount: 0,
        currency: "USD",
      }),
    );
  });

  test("returns invoice summary from getCustomerInvoiceSummary", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getInvoiceSummary({ id: CUSTOMER_ID });

    expect(result).toEqual({
      totalAmount: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      invoiceCount: 0,
      currency: "USD",
    });
    expect(mocks.getCustomerInvoiceSummary).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: CUSTOMER_ID,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: customers.togglePortal", () => {
  beforeEach(() => {
    mocks.toggleCustomerPortal.mockReset();
    mocks.toggleCustomerPortal.mockImplementation(() =>
      Promise.resolve({
        id: CUSTOMER_ID,
        portalEnabled: true,
        portalId: "portal_xyz",
      }),
    );
  });

  test("toggles portal and calls toggleCustomerPortal", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.togglePortal({
      customerId: CUSTOMER_ID,
      enabled: true,
    });

    expect(result).toMatchObject({
      id: CUSTOMER_ID,
      portalEnabled: true,
    });
    expect(mocks.toggleCustomerPortal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: CUSTOMER_ID,
        teamId: "test-team-id",
        enabled: true,
      }),
    );
  });
});

describe("tRPC: customers.getByPortalId", () => {
  beforeEach(() => {
    mocks.getCustomerByPortalId.mockReset();
    mocks.getCustomerInvoiceSummary.mockReset();
    mocks.getCustomerByPortalId.mockImplementation(() =>
      Promise.resolve({
        id: CUSTOMER_ID,
        name: "Portal Customer",
        teamId: "test-team-id",
      }),
    );
    mocks.getCustomerInvoiceSummary.mockImplementation(() =>
      Promise.resolve({
        totalAmount: 0,
        paidAmount: 0,
        outstandingAmount: 0,
        invoiceCount: 0,
        currency: "USD",
      }),
    );
  });

  test("returns customer and summary from getCustomerByPortalId", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getByPortalId({ portalId: PORTAL_ID });

    expect(result?.customer).toMatchObject({
      id: CUSTOMER_ID,
      name: "Portal Customer",
    });
    expect(mocks.getCustomerByPortalId).toHaveBeenCalledWith(
      expect.anything(),
      { portalId: PORTAL_ID },
    );
    expect(mocks.getCustomerInvoiceSummary).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: CUSTOMER_ID,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: customers.getPortalInvoices", () => {
  beforeEach(() => {
    mocks.getCustomerByPortalId.mockReset();
    mocks.getCustomerPortalInvoices.mockReset();
    mocks.getCustomerByPortalId.mockImplementation(() =>
      Promise.resolve({
        id: CUSTOMER_ID,
        name: "Portal Customer",
        teamId: "test-team-id",
      }),
    );
    mocks.getCustomerPortalInvoices.mockImplementation(() =>
      Promise.resolve({ data: [], nextCursor: null, hasMore: false }),
    );
  });

  test("returns portal invoices from getCustomerPortalInvoices", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getPortalInvoices({ portalId: PORTAL_ID });

    expect(result.data).toEqual([]);
    expect(result.meta).toEqual({ cursor: null });
    expect(mocks.getCustomerPortalInvoices).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        customerId: CUSTOMER_ID,
        teamId: "test-team-id",
      }),
    );
  });
});
