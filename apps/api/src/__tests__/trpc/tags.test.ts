import { beforeEach, describe, expect, test } from "bun:test";
import { createTag, deleteTag, getTags, updateTag } from "@midday/db/queries";
import { createCallerFactory } from "../../trpc/init";
import { tagsRouter } from "../../trpc/routers/tags";
import { createTestContext } from "../helpers/test-context";
import { asMock } from "../setup";

const createCaller = createCallerFactory(tagsRouter);

const TAG_ID = "b3b6e2c2-1f2a-4e3b-9c1d-2a4b6e2c21f2";

describe("tRPC: tags.get", () => {
  beforeEach(() => {
    asMock(getTags).mockReset();
    asMock(getTags).mockImplementation(() => Promise.resolve([]));
  });

  test("returns tags list", async () => {
    asMock(getTags).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get();

    expect(result).toEqual([]);
  });

  test("passes teamId to DB query", async () => {
    asMock(getTags).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    await caller.get();

    expect(getTags).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ teamId: "test-team-id" }),
    );
  });

  test("handles empty list", async () => {
    asMock(getTags).mockImplementation(() => Promise.resolve([]));

    const caller = createCaller(createTestContext());
    const result = await caller.get();

    expect(result).toHaveLength(0);
  });
});

describe("tRPC: tags.create", () => {
  beforeEach(() => {
    asMock(createTag).mockReset();
    asMock(createTag).mockImplementation(() =>
      Promise.resolve({ id: TAG_ID, name: "Test Tag" }),
    );
  });

  test("creates tag with valid name", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({ name: "Test Tag" });

    expect(result).toEqual({ id: TAG_ID, name: "Test Tag" });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.create({ name: "Test Tag" });

    expect(createTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        name: "Test Tag",
      }),
    );
  });

  test("allows empty string name", async () => {
    asMock(createTag).mockImplementation(() =>
      Promise.resolve({ id: TAG_ID, name: "" }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.create({ name: "" });

    expect(result.name).toBe("");
  });
});

describe("tRPC: tags.update", () => {
  beforeEach(() => {
    asMock(updateTag).mockReset();
    asMock(updateTag).mockImplementation(() =>
      Promise.resolve({ id: TAG_ID, name: "Updated" }),
    );
  });

  test("updates tag name", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.update({ id: TAG_ID, name: "Updated" });

    expect(result).toEqual({ id: TAG_ID, name: "Updated" });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.update({ id: TAG_ID, name: "Updated" });

    expect(updateTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: TAG_ID,
        name: "Updated",
        teamId: "test-team-id",
      }),
    );
  });

  test("allows empty string as new name", async () => {
    asMock(updateTag).mockImplementation(() =>
      Promise.resolve({ id: TAG_ID, name: "" }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.update({ id: TAG_ID, name: "" });

    expect(result.name).toBe("");
  });
});

describe("tRPC: tags.delete", () => {
  beforeEach(() => {
    asMock(deleteTag).mockReset();
    asMock(deleteTag).mockImplementation(() =>
      Promise.resolve({ id: TAG_ID, name: "Removed" }),
    );
  });

  test("deletes tag by id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: TAG_ID });

    expect(result).toEqual({ id: TAG_ID, name: "Removed" });
  });

  test("passes teamId to DB query", async () => {
    const caller = createCaller(createTestContext());
    await caller.delete({ id: TAG_ID });

    expect(deleteTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: TAG_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("returns undefined when tag was not found", async () => {
    asMock(deleteTag).mockImplementation(() => Promise.resolve(undefined));

    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: TAG_ID });

    expect(result).toBeUndefined();
  });
});
