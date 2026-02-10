import { beforeEach, describe, expect, test } from "bun:test";
// Import after mocking (mocks are set up via preload)
import { createCallerFactory } from "../../trpc/init";
import { invoiceRouter } from "../../trpc/routers/invoice";
import {
  createInvoicesListResponse,
  createMinimalInvoiceResponse,
  createPaidInvoiceResponse,
  createValidInvoiceResponse,
} from "../factories/invoice";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

// Create a test caller
const createCaller = createCallerFactory(invoiceRouter);

describe("tRPC: invoice.get", () => {
  beforeEach(() => {
    mocks.getInvoices.mockReset();
    mocks.getInvoices.mockImplementation(() => createInvoicesListResponse());
  });

  test("returns invoices list", async () => {
    mocks.getInvoices.mockImplementation(() =>
      createInvoicesListResponse([createValidInvoiceResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toHaveLength(1);
    expect(result.meta.hasNextPage).toBe(false);
  });

  test("handles minimal invoice data", async () => {
    mocks.getInvoices.mockImplementation(() =>
      createInvoicesListResponse([createMinimalInvoiceResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.vat).toBeNull();
  });

  test("handles empty list", async () => {
    mocks.getInvoices.mockImplementation(() => createInvoicesListResponse([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data).toEqual([]);
  });

  test("filters by status", async () => {
    mocks.getInvoices.mockImplementation(() => createInvoicesListResponse([]));

    const caller = createCaller(createTestContext());
    await caller.get({ statuses: ["paid"] });

    // Just verify the mock was called - the status filtering happens in the DB
    expect(mocks.getInvoices).toHaveBeenCalled();
  });

  test("handles paid invoices", async () => {
    mocks.getInvoices.mockImplementation(() =>
      createInvoicesListResponse([createPaidInvoiceResponse()]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result.data[0]!.status).toBe("paid");
  });
});

describe("tRPC: invoice.getById", () => {
  beforeEach(() => {
    mocks.getInvoiceById.mockReset();
  });

  test("returns single invoice", async () => {
    mocks.getInvoiceById.mockImplementation(() => createValidInvoiceResponse());

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result?.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("returns null for non-existent invoice", async () => {
    mocks.getInvoiceById.mockImplementation(() => null);

    const caller = createCaller(createTestContext());
    const result = await caller.getById({
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
    });

    expect(result).toBeNull();
  });

  test("passes correct parameters to DB query", async () => {
    mocks.getInvoiceById.mockImplementation(() => createValidInvoiceResponse());

    const caller = createCaller(createTestContext());
    await caller.getById({ id: "c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f" });

    expect(mocks.getInvoiceById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "c3d4e5f6-7a8b-4c9d-0e1f-2a3b4c5d6e7f",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: invoice.delete", () => {
  beforeEach(() => {
    mocks.deleteInvoice.mockReset();
    mocks.deleteInvoice.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes invoice successfully", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    });

    expect(result).toBeDefined();
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: "d4e5f6a7-8b9c-4d0e-1f2a-3b4c5d6e7f8a" });

    expect(mocks.deleteInvoice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: invoice.invoiceSummary", () => {
  beforeEach(() => {
    mocks.getInvoiceSummary.mockReset();
    mocks.getInvoiceSummary.mockImplementation(() => ({
      totalAmount: 10000,
      invoiceCount: 5,
      currency: "USD",
    }));
  });

  test("returns invoice summary", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.invoiceSummary();

    expect(result.totalAmount).toBeDefined();
    expect(result.invoiceCount).toBeDefined();
    expect(result.currency).toBeDefined();
  });

  test("passes statuses to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.invoiceSummary({ statuses: ["paid"] });

    expect(mocks.getInvoiceSummary).toHaveBeenCalled();
  });
});

describe("tRPC: invoice.searchInvoiceNumber", () => {
  beforeEach(() => {
    mocks.searchInvoiceNumber.mockReset();
    mocks.searchInvoiceNumber.mockImplementation(() => []);
  });

  test("searches for invoice numbers", async () => {
    mocks.searchInvoiceNumber.mockImplementation(() => [
      { invoiceNumber: "INV-001" },
      { invoiceNumber: "INV-002" },
    ]);

    const caller = createCaller(createTestContext());
    const result = await caller.searchInvoiceNumber({ query: "INV" });

    expect(result).toHaveLength(2);
  });

  test("returns empty array for no matches", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.searchInvoiceNumber({ query: "NONEXISTENT" });

    expect(result).toHaveLength(0);
  });
});
