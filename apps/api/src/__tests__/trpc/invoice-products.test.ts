import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { invoiceProductsRouter } from "../../trpc/routers/invoice-products";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const PRODUCT_ID = "c4d5e6f7-8901-4234-a789-abcdef012345";

const createCaller = createCallerFactory(invoiceProductsRouter);

describe("tRPC: invoiceProducts.get", () => {
  beforeEach(() => {
    mocks.getInvoiceProducts.mockReset();
    mocks.getInvoiceProducts.mockImplementation(() => Promise.resolve([]));
  });

  test("returns products with default filters", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toEqual([]);
    expect(mocks.getInvoiceProducts).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
      expect.objectContaining({
        sortBy: "popular",
        limit: 50,
        includeInactive: false,
      }),
    );
  });

  test("returns products when input is omitted", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get(undefined);

    expect(result).toEqual([]);
  });

  test("rejects limit above maximum", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.get({ limit: 101 })).rejects.toThrow();
  });
});

describe("tRPC: invoiceProducts.getById", () => {
  beforeEach(() => {
    mocks.getInvoiceProductById.mockReset();
    mocks.getInvoiceProductById.mockImplementation(() =>
      Promise.resolve({
        id: PRODUCT_ID,
        name: "Consulting",
        price: 150,
      }),
    );
  });

  test("returns product by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: PRODUCT_ID });

    expect(result).toMatchObject({
      id: PRODUCT_ID,
      name: "Consulting",
      price: 150,
    });
    expect(mocks.getInvoiceProductById).toHaveBeenCalledWith(
      expect.anything(),
      PRODUCT_ID,
      "test-team-id",
    );
  });

  test("returns null when product is missing", async () => {
    mocks.getInvoiceProductById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    expect(await caller.getById({ id: PRODUCT_ID })).toBeNull();
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.getById({ id: "x" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceProducts.create", () => {
  beforeEach(() => {
    mocks.createInvoiceProduct.mockReset();
    mocks.createInvoiceProduct.mockImplementation(() =>
      Promise.resolve({
        id: PRODUCT_ID,
        name: "Product",
        price: 100,
      }),
    );
  });

  test("creates product with name, price, and currency", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      name: "Product",
      price: 100,
      currency: "USD",
    });

    expect(result).toMatchObject({
      id: PRODUCT_ID,
      name: "Product",
      price: 100,
    });
    expect(mocks.createInvoiceProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Product",
        price: 100,
        currency: "USD",
        teamId: "test-team-id",
        createdBy: "test-user-id",
      }),
    );
  });
});

describe("tRPC: invoiceProducts.upsert", () => {
  beforeEach(() => {
    mocks.upsertInvoiceProduct.mockReset();
    mocks.upsertInvoiceProduct.mockImplementation(() =>
      Promise.resolve({
        id: PRODUCT_ID,
        name: "Upserted",
        price: 200,
        currency: "USD",
      }),
    );
  });

  test("upserts product by name and price", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({
      name: "Upserted",
      price: 200,
      currency: "USD",
    });

    expect(result).toMatchObject({
      id: PRODUCT_ID,
      name: "Upserted",
      price: 200,
    });
    expect(mocks.upsertInvoiceProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Upserted",
        price: 200,
        currency: "USD",
        teamId: "test-team-id",
        createdBy: "test-user-id",
      }),
    );
  });
});

describe("tRPC: invoiceProducts.updateProduct", () => {
  beforeEach(() => {
    mocks.updateInvoiceProduct.mockReset();
    mocks.updateInvoiceProduct.mockImplementation(() =>
      Promise.resolve({
        id: PRODUCT_ID,
        name: "Updated",
      }),
    );
  });

  test("updates product name", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.updateProduct({
      id: PRODUCT_ID,
      name: "Updated",
    });

    expect(result).toMatchObject({ id: PRODUCT_ID, name: "Updated" });
    expect(mocks.updateInvoiceProduct).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: PRODUCT_ID,
        name: "Updated",
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: invoiceProducts.incrementUsage", () => {
  beforeEach(() => {
    mocks.incrementProductUsage.mockReset();
    mocks.incrementProductUsage.mockImplementation(() => Promise.resolve());
  });

  test("increments usage and returns success", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.incrementUsage({ id: PRODUCT_ID });

    expect(result).toEqual({ success: true });
    expect(mocks.incrementProductUsage).toHaveBeenCalledWith(
      expect.anything(),
      PRODUCT_ID,
      "test-team-id",
    );
  });
});

describe("tRPC: invoiceProducts.saveLineItemAsProduct", () => {
  beforeEach(() => {
    mocks.saveLineItemAsProduct.mockReset();
    mocks.saveLineItemAsProduct.mockImplementation(() =>
      Promise.resolve({
        product: {
          id: "d1d2d3d4-e5f6-7890-abcd-ef1234567890",
          name: "Item",
        },
        shouldClearProductId: false,
      }),
    );
  });

  test("saves line item as product", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.saveLineItemAsProduct({
      name: "Item",
      price: 50,
    });

    expect(result.product).toMatchObject({
      id: "d1d2d3d4-e5f6-7890-abcd-ef1234567890",
      name: "Item",
    });
    expect(result.shouldClearProductId).toBe(false);
    expect(mocks.saveLineItemAsProduct).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
      "test-user-id",
      expect.objectContaining({
        name: "Item",
        price: 50,
      }),
      undefined,
    );
  });
});

describe("tRPC: invoiceProducts.delete", () => {
  beforeEach(() => {
    mocks.deleteInvoiceProduct.mockReset();
    mocks.deleteInvoiceProduct.mockImplementation(() => Promise.resolve(true));
  });

  test("returns true when delete succeeds", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: PRODUCT_ID });

    expect(result).toBe(true);
    expect(mocks.deleteInvoiceProduct).toHaveBeenCalledWith(
      expect.anything(),
      PRODUCT_ID,
      "test-team-id",
    );
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.delete({ id: "not-uuid" })).rejects.toThrow();
  });
});
