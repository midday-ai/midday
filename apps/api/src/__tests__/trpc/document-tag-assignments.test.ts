import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { documentTagAssignmentsRouter } from "../../trpc/routers/document-tag-assignments";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const DOCUMENT_ID = "b2c3d4e5-f6a7-8901-bcde-f12345678901";
const TAG_ID = "c3d4e5f6-a7b8-9012-cdef-123456789012";

const createCaller = createCallerFactory(documentTagAssignmentsRouter);

describe("tRPC: documentTagAssignments.create", () => {
  beforeEach(() => {
    mocks.createDocumentTagAssignment.mockReset();
    mocks.createDocumentTagAssignment.mockImplementation(() =>
      Promise.resolve({
        documentId: DOCUMENT_ID,
        tagId: TAG_ID,
      }),
    );
  });

  test("creates assignment for document and tag", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.create({
      documentId: DOCUMENT_ID,
      tagId: TAG_ID,
    });

    expect(result).toMatchObject({ documentId: DOCUMENT_ID, tagId: TAG_ID });
    expect(mocks.createDocumentTagAssignment).toHaveBeenCalledWith(
      expect.anything(),
      {
        documentId: DOCUMENT_ID,
        tagId: TAG_ID,
        teamId: "test-team-id",
      },
    );
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(
      caller.create({ documentId: DOCUMENT_ID, tagId: TAG_ID }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("tRPC: documentTagAssignments.delete", () => {
  beforeEach(() => {
    mocks.deleteDocumentTagAssignment.mockReset();
    mocks.deleteDocumentTagAssignment.mockImplementation(() =>
      Promise.resolve({}),
    );
  });

  test("deletes assignment", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.delete({
      documentId: DOCUMENT_ID,
      tagId: TAG_ID,
    });

    expect(result).toMatchObject({});
    expect(mocks.deleteDocumentTagAssignment).toHaveBeenCalledWith(
      expect.anything(),
      {
        documentId: DOCUMENT_ID,
        tagId: TAG_ID,
        teamId: "test-team-id",
      },
    );
  });

  test("rejects without session", async () => {
    const ctx = createTestContext();
    const caller = createCaller({ ...ctx, session: null });

    await expect(
      caller.delete({ documentId: DOCUMENT_ID, tagId: TAG_ID }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
