import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { invoiceTemplateRouter } from "../../trpc/routers/invoice-template";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const TEMPLATE_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(invoiceTemplateRouter);

describe("tRPC: invoiceTemplate.list", () => {
  beforeEach(() => {
    mocks.getInvoiceTemplates.mockReset();
    mocks.getInvoiceTemplates.mockImplementation(() => Promise.resolve([]));
  });

  test("returns template list for team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.list();

    expect(result).toEqual([]);
    expect(mocks.getInvoiceTemplates).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns empty array when team has no templates", async () => {
    mocks.getInvoiceTemplates.mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    expect(await caller.list()).toEqual([]);
  });
});

describe("tRPC: invoiceTemplate.get", () => {
  beforeEach(() => {
    mocks.getInvoiceTemplateById.mockReset();
    mocks.getInvoiceTemplateById.mockImplementation(() =>
      Promise.resolve({
        id: TEMPLATE_ID,
        name: "Default",
        isDefault: true,
      }),
    );
  });

  test("returns template by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ id: TEMPLATE_ID });

    expect(result).toMatchObject({
      id: TEMPLATE_ID,
      name: "Default",
      isDefault: true,
    });
    expect(mocks.getInvoiceTemplateById).toHaveBeenCalledWith(
      expect.anything(),
      { id: TEMPLATE_ID, teamId: "test-team-id" },
    );
  });

  test("returns null when template is missing", async () => {
    mocks.getInvoiceTemplateById.mockImplementation(() =>
      Promise.resolve(null),
    );

    const caller = createCaller(createTestContext());
    expect(await caller.get({ id: TEMPLATE_ID })).toBeNull();
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.get({ id: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceTemplate.create", () => {
  beforeEach(() => {
    mocks.createInvoiceTemplate.mockReset();
    mocks.createInvoiceTemplate.mockImplementation(() =>
      Promise.resolve({
        id: TEMPLATE_ID,
        name: "Template",
      }),
    );
  });

  test("creates a template with defaults", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({ name: "Template" });

    expect(result).toMatchObject({ id: TEMPLATE_ID, name: "Template" });
    expect(mocks.createInvoiceTemplate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "Template",
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects empty name", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.create({ name: "" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceTemplate.upsert", () => {
  beforeEach(() => {
    mocks.upsertInvoiceTemplate.mockReset();
    mocks.upsertInvoiceTemplate.mockImplementation(() =>
      Promise.resolve({
        id: TEMPLATE_ID,
        name: "Upserted",
        isDefault: true,
      }),
    );
  });

  test("upserts template by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.upsert({
      id: TEMPLATE_ID,
      name: "Upserted",
      currency: "USD",
    });

    expect(result).toMatchObject({
      id: TEMPLATE_ID,
      name: "Upserted",
      isDefault: true,
    });
    expect(mocks.upsertInvoiceTemplate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: TEMPLATE_ID,
        teamId: "test-team-id",
        name: "Upserted",
        currency: "USD",
      }),
    );
  });
});

describe("tRPC: invoiceTemplate.setDefault", () => {
  beforeEach(() => {
    mocks.setDefaultTemplate.mockReset();
    mocks.setDefaultTemplate.mockImplementation(() =>
      Promise.resolve({
        id: TEMPLATE_ID,
        isDefault: true,
        name: "Default",
      }),
    );
  });

  test("sets template as default", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.setDefault({ id: TEMPLATE_ID });

    expect(result).toMatchObject({
      id: TEMPLATE_ID,
      isDefault: true,
      name: "Default",
    });
    expect(mocks.setDefaultTemplate).toHaveBeenCalledWith(expect.anything(), {
      id: TEMPLATE_ID,
      teamId: "test-team-id",
    });
  });
});

describe("tRPC: invoiceTemplate.delete", () => {
  beforeEach(() => {
    mocks.deleteInvoiceTemplate.mockReset();
    mocks.deleteInvoiceTemplate.mockImplementation(() =>
      Promise.resolve({
        deleted: { id: TEMPLATE_ID },
        newDefault: null,
      }),
    );
  });

  test("deletes template and returns deleted row plus new default", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: TEMPLATE_ID });

    expect(result).toMatchObject({
      deleted: expect.objectContaining({ id: TEMPLATE_ID }),
      newDefault: null,
    });
    expect(mocks.deleteInvoiceTemplate).toHaveBeenCalledWith(
      expect.anything(),
      { id: TEMPLATE_ID, teamId: "test-team-id" },
    );
  });

  test("rejects non-uuid id", async () => {
    const caller = createCaller(createTestContext());

    await expect(caller.delete({ id: "bad" })).rejects.toThrow();
  });
});

describe("tRPC: invoiceTemplate.count", () => {
  beforeEach(() => {
    mocks.getInvoiceTemplateCount.mockReset();
    mocks.getInvoiceTemplateCount.mockImplementation(() => Promise.resolve(3));
  });

  test("returns template count", async () => {
    const caller = createCaller(createTestContext());
    expect(await caller.count()).toBe(3);
    expect(mocks.getInvoiceTemplateCount).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("returns zero when none exist", async () => {
    mocks.getInvoiceTemplateCount.mockImplementation(() => Promise.resolve(0));

    const caller = createCaller(createTestContext());
    expect(await caller.count()).toBe(0);
  });
});
