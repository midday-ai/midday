import { beforeEach, describe, expect, test } from "bun:test";
import { invoicesRouter } from "../../rest/routers/invoices";
import { createTestApp } from "../helpers";
import { mocks } from "../setup";

// Type for response JSON
interface InvoiceListResponse {
  data: Array<{
    id: string;
    [key: string]: unknown;
  }>;
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    cursor: string | null;
  };
}

interface InvoiceResponse {
  id: string;
  [key: string]: unknown;
}

function createApp() {
  const app = createTestApp();
  app.route("/invoices", invoicesRouter);
  return app;
}

// Create a valid invoice response that matches the full schema
function createValidInvoiceForRest() {
  return {
    id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    status: "draft",
    dueDate: "2024-05-31T00:00:00.000Z",
    issueDate: "2024-05-01T00:00:00.000Z",
    invoiceNumber: "INV-001",
    amount: 1000,
    currency: "USD",
    customer: {
      id: "b2c3d4e5-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
      name: "Acme Corp",
      website: null,
      email: "billing@acme.com",
    },
    paidAt: null,
    reminderSentAt: null,
    note: null,
    vat: null,
    tax: null,
    discount: null,
    subtotal: 1000,
    viewedAt: null,
    customerName: "Acme Corp",
    sentTo: null,
    sentAt: null,
    createdAt: "2024-05-01T00:00:00.000Z",
    updatedAt: "2024-05-01T00:00:00.000Z",
    token: "test-token",
    lineItems: [{ id: "line-1", name: "Service", quantity: 1, price: 1000 }],
  };
}

describe("REST: GET /invoices", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.getInvoices.mockReset();
  });

  test("returns 200 with valid invoice data", async () => {
    mocks.getInvoices.mockImplementation(() => ({
      data: [createValidInvoiceForRest()],
      meta: { cursor: null, hasNextPage: false, hasPreviousPage: false },
    }));

    const res = await app.request("/invoices");

    expect(res.status).toBe(200);
    const json = (await res.json()) as InvoiceListResponse;
    expect(json.data).toHaveLength(1);
    expect(json.meta.hasNextPage).toBe(false);
  });

  test("handles empty invoice list", async () => {
    mocks.getInvoices.mockImplementation(() => ({
      data: [],
      meta: { cursor: null, hasNextPage: false, hasPreviousPage: false },
    }));

    const res = await app.request("/invoices");

    expect(res.status).toBe(200);
    const json = (await res.json()) as InvoiceListResponse;
    expect(json.data).toEqual([]);
  });

  test("handles pagination metadata", async () => {
    mocks.getInvoices.mockImplementation(() => ({
      data: [createValidInvoiceForRest()],
      meta: {
        cursor: "next-cursor",
        hasNextPage: true,
        hasPreviousPage: false,
      },
    }));

    const res = await app.request("/invoices");

    expect(res.status).toBe(200);
    const json = (await res.json()) as InvoiceListResponse;
    expect(json.meta.hasNextPage).toBe(true);
    expect(json.meta.cursor).toBe("next-cursor");
  });

  test("calls DB query with team ID", async () => {
    mocks.getInvoices.mockImplementation(() => ({
      data: [],
      meta: { cursor: null, hasNextPage: false, hasPreviousPage: false },
    }));

    await app.request("/invoices?pageSize=10");

    expect(mocks.getInvoices).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        pageSize: 10,
      }),
    );
  });
});

describe("REST: DELETE /invoices/:id", () => {
  const app = createApp();

  beforeEach(() => {
    mocks.deleteInvoice.mockReset();
    mocks.deleteInvoice.mockImplementation(() => ({
      id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
    }));
  });

  test("deletes invoice successfully", async () => {
    const res = await app.request(
      "/invoices/a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      {
        method: "DELETE",
      },
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as InvoiceResponse;
    expect(json.id).toBe("a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d");
  });

  test("calls DB with correct parameters", async () => {
    await app.request("/invoices/a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d", {
      method: "DELETE",
    });

    expect(mocks.deleteInvoice).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: "a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
        teamId: "test-team-id",
      }),
    );
  });
});
