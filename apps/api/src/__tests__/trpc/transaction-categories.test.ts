import { beforeEach, describe, expect, test } from "bun:test";
import {
  createTransactionCategory,
  deleteTransactionCategory,
  getCategories,
  getCategoryById,
  updateTransactionCategory,
} from "@midday/db/queries";
import { createCallerFactory } from "../../trpc/init";
import { transactionCategoriesRouter } from "../../trpc/routers/transaction-categories";
import { createTestContext } from "../helpers/test-context";
import { asMock } from "../setup";

const createCaller = createCallerFactory(transactionCategoriesRouter);

const CATEGORY_ID = "c4b7e3d1-2f3b-5e4c-ad2e-3b5c7d8e9f0a";

const fullUpdateInput = {
  id: CATEGORY_ID,
  name: "Updated",
  color: null,
  description: null,
  taxRate: null,
  taxType: null,
  taxReportingCode: null,
  excluded: null,
} as const;

describe("tRPC: transactionCategories.get", () => {
  beforeEach(() => {
    asMock(getCategories).mockReset();
    asMock(getCategories).mockImplementation(() => Promise.resolve([]));
  });

  test("returns categories for the team", async () => {
    asMock(getCategories).mockImplementation(() =>
      Promise.resolve([
        {
          id: CATEGORY_ID,
          name: "Office",
          slug: "office",
          color: "#111111",
          description: null,
          system: false,
          taxRate: null,
          taxType: null,
          taxReportingCode: null,
          excluded: false,
          parentId: null,
          children: [],
        },
      ]),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: CATEGORY_ID,
      name: "Office",
      slug: "office",
      color: "#111111",
    });
  });

  test("passes teamId to DB query", async () => {
    asMock(getCategories).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    await caller.get({ limit: 50 });

    expect(getCategories).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        limit: 50,
      }),
    );
  });

  test("handles empty category list", async () => {
    asMock(getCategories).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toEqual([]);
  });
});

describe("tRPC: transactionCategories.getById", () => {
  beforeEach(() => {
    asMock(getCategoryById).mockReset();
    asMock(getCategoryById).mockImplementation(() =>
      Promise.resolve({
        id: CATEGORY_ID,
        name: "Office",
        color: "#222222",
        slug: "office",
        description: null,
        system: false,
        taxRate: null,
        taxType: null,
        taxReportingCode: null,
        excluded: false,
        parentId: null,
        createdAt: new Date(),
        children: [],
      }),
    );
  });

  test("returns a single category", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: CATEGORY_ID });

    expect(result).toMatchObject({
      id: CATEGORY_ID,
      name: "Office",
    });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.getById({ id: CATEGORY_ID });

    expect(getCategoryById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: CATEGORY_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("returns null when category is not found", async () => {
    asMock(getCategoryById).mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: CATEGORY_ID });

    expect(result).toBeNull();
  });
});

describe("tRPC: transactionCategories.create", () => {
  beforeEach(() => {
    asMock(createTransactionCategory).mockReset();
    asMock(createTransactionCategory).mockImplementation(() =>
      Promise.resolve({
        id: CATEGORY_ID,
        name: "Test",
        color: "#FF0000",
        slug: "test",
        description: null,
        system: false,
        taxRate: null,
        taxType: null,
        taxReportingCode: null,
        excluded: false,
        parentId: null,
      }),
    );
  });

  test("creates category with name and color", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      name: "Test",
      color: "#FF0000",
    });

    expect(result).toMatchObject({
      id: CATEGORY_ID,
      name: "Test",
      color: "#FF0000",
    });
  });

  test("passes teamId and user id to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.create({ name: "Test", color: "#FF0000" });

    expect(createTransactionCategory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        userId: "test-user-id",
        name: "Test",
        color: "#FF0000",
      }),
    );
  });

  test("allows create with name only", async () => {
    asMock(createTransactionCategory).mockImplementation(() =>
      Promise.resolve({
        id: CATEGORY_ID,
        name: "Minimal",
        color: null,
        slug: "minimal",
        description: null,
        system: false,
        taxRate: null,
        taxType: null,
        taxReportingCode: null,
        excluded: false,
        parentId: null,
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.create({ name: "Minimal" });

    expect(result?.name).toBe("Minimal");
  });
});

describe("tRPC: transactionCategories.update", () => {
  beforeEach(() => {
    asMock(updateTransactionCategory).mockReset();
    asMock(updateTransactionCategory).mockImplementation(() =>
      Promise.resolve({
        id: CATEGORY_ID,
        name: "Updated",
        color: null,
        slug: "updated",
        description: null,
        system: false,
        taxRate: null,
        taxType: null,
        taxReportingCode: null,
        excluded: false,
        parentId: null,
      }),
    );
  });

  test("updates category fields", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({ ...fullUpdateInput });

    expect(result).toMatchObject({
      id: CATEGORY_ID,
      name: "Updated",
    });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.update({ ...fullUpdateInput });

    expect(updateTransactionCategory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: CATEGORY_ID,
        name: "Updated",
        teamId: "test-team-id",
      }),
    );
  });

  test("rejects update without required nullable fields", async () => {
    const caller = createCaller(createTestContext());

    await expect(
      caller.update({
        id: CATEGORY_ID,
        name: "Updated",
      } as never),
    ).rejects.toThrow();
  });
});

describe("tRPC: transactionCategories.delete", () => {
  beforeEach(() => {
    asMock(deleteTransactionCategory).mockReset();
    asMock(deleteTransactionCategory).mockImplementation(() =>
      Promise.resolve({ id: CATEGORY_ID }),
    );
  });

  test("deletes category by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: CATEGORY_ID });

    expect(result).toMatchObject({ id: CATEGORY_ID });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: CATEGORY_ID });

    expect(deleteTransactionCategory).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: CATEGORY_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("returns undefined when nothing was deleted", async () => {
    asMock(deleteTransactionCategory).mockImplementation(() =>
      Promise.resolve(undefined),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: CATEGORY_ID });

    expect(result).toBeUndefined();
  });
});
