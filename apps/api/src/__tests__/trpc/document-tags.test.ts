import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { documentTagsRouter } from "../../trpc/routers/document-tags";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const TAG_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const createCaller = createCallerFactory(documentTagsRouter);

describe("tRPC: documentTags.get", () => {
  beforeEach(() => {
    mocks.getDocumentTags.mockReset();
    mocks.getDocumentTags.mockImplementation(() => Promise.resolve([]));
  });

  test("returns tag list for team", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get();

    expect(result).toEqual([]);
    expect(mocks.getDocumentTags).toHaveBeenCalledWith(
      expect.anything(),
      "test-team-id",
    );
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(caller.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("tRPC: documentTags.create", () => {
  beforeEach(() => {
    mocks.createDocumentTag.mockReset();
    mocks.createDocumentTagEmbedding.mockReset();
    mocks.createDocumentTag.mockImplementation(() =>
      Promise.resolve({
        id: TAG_ID,
        name: "Important",
        slug: "important",
      }),
    );
    mocks.createDocumentTagEmbedding.mockImplementation(() =>
      Promise.resolve({}),
    );
  });

  test("creates tag, embeds name, and returns row", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({ name: "Important" });

    expect(result).toEqual({
      id: TAG_ID,
      name: "Important",
      slug: "important",
    });
    expect(mocks.createDocumentTag).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        name: "Important",
        slug: "important",
      }),
    );
    expect(mocks.createDocumentTagEmbedding).toHaveBeenCalled();
  });

  test("skips embedding when insert returns no row", async () => {
    mocks.createDocumentTag.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    expect(await caller.create({ name: "Important" })).toBeNull();
    expect(mocks.createDocumentTagEmbedding).not.toHaveBeenCalled();
  });
});

describe("tRPC: documentTags.delete", () => {
  beforeEach(() => {
    mocks.deleteDocumentTag.mockReset();
    mocks.deleteDocumentTag.mockImplementation(() =>
      Promise.resolve({ id: TAG_ID }),
    );
  });

  test("deletes tag and returns id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: TAG_ID });

    expect(result).toEqual({ id: TAG_ID });
    expect(mocks.deleteDocumentTag).toHaveBeenCalledWith(expect.anything(), {
      id: TAG_ID,
      teamId: "test-team-id",
    });
  });

  test("returns undefined when no row matched", async () => {
    mocks.deleteDocumentTag.mockImplementation(() =>
      Promise.resolve(undefined),
    );

    const caller = createCaller(createTestContext());
    expect(await caller.delete({ id: TAG_ID })).toBeUndefined();
  });
});
