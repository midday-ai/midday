import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { documentsRouter } from "../../trpc/routers/documents";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(documentsRouter);

const DOC_ID = "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f";

describe("tRPC: documents.get", () => {
  beforeEach(() => {
    mocks.getDocuments.mockReset();
    mocks.getDocuments.mockImplementation(() => ({
      data: [],
      meta: {
        hasPreviousPage: false,
        hasNextPage: false,
        cursor: undefined,
      },
    }));
  });

  test("returns empty list with pagination meta", async () => {
    mocks.getDocuments.mockImplementation(() => ({
      data: [],
      meta: {
        hasPreviousPage: false,
        hasNextPage: false,
        cursor: undefined,
      },
    }));

    const caller = createCaller(createTestContext());
    const result = await caller.get({});

    expect(result).toEqual({
      data: [],
      meta: {
        hasPreviousPage: false,
        hasNextPage: false,
        cursor: undefined,
      },
    });
  });

  test("passes teamId to DB query", async () => {
    mocks.getDocuments.mockImplementation(() => ({
      data: [],
      meta: {
        hasPreviousPage: false,
        hasNextPage: false,
        cursor: undefined,
      },
    }));

    const caller = createCaller(createTestContext());
    await caller.get({ pageSize: 25, q: "invoice" });

    expect(mocks.getDocuments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        pageSize: 25,
        q: "invoice",
      }),
    );
  });

  test("forwards cursor for pagination", async () => {
    mocks.getDocuments.mockImplementation(() => ({
      data: [],
      meta: {
        hasPreviousPage: false,
        hasNextPage: false,
        cursor: undefined,
      },
    }));

    const caller = createCaller(createTestContext());
    await caller.get({ cursor: "40" });

    expect(mocks.getDocuments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        teamId: "test-team-id",
        cursor: "40",
      }),
    );
  });
});

describe("tRPC: documents.getById", () => {
  beforeEach(() => {
    mocks.getDocumentById.mockReset();
    mocks.getDocumentById.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        title: "Statement",
        pathTokens: ["test-team-id", "vault", "statement.pdf"],
      }),
    );
  });

  test("returns document by id", async () => {
    mocks.getDocumentById.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        title: "Statement",
        pathTokens: ["test-team-id", "vault", "statement.pdf"],
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: DOC_ID });

    expect(result).toMatchObject({
      id: DOC_ID,
      title: "Statement",
    });
  });

  test("passes teamId to DB query", async () => {
    mocks.getDocumentById.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        title: "Statement",
        pathTokens: ["test-team-id", "vault", "statement.pdf"],
      }),
    );

    const caller = createCaller(createTestContext());
    await caller.getById({ id: DOC_ID });

    expect(mocks.getDocumentById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: DOC_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("returns null when document is missing", async () => {
    mocks.getDocumentById.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    const result = await caller.getById({ id: DOC_ID });

    expect(result).toBeNull();
  });
});

describe("tRPC: documents.delete", () => {
  beforeEach(() => {
    mocks.deleteDocument.mockReset();
    mocks.deleteDocument.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        pathTokens: ["test-team-id", "vault", "file.pdf"],
      }),
    );
  });

  test("deletes document and returns id", async () => {
    mocks.deleteDocument.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        pathTokens: ["test-team-id", "vault", "file.pdf"],
      }),
    );

    const caller = createCaller(createTestContext());
    const result = await caller.delete({ id: DOC_ID });

    expect(result).toMatchObject({ id: DOC_ID });
    expect(result).toHaveProperty("pathTokens");
  });

  test("passes teamId to DB query", async () => {
    mocks.deleteDocument.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        pathTokens: ["test-team-id", "b"],
      }),
    );

    const caller = createCaller(createTestContext());
    await caller.delete({ id: DOC_ID });

    expect(mocks.deleteDocument).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: DOC_ID,
        teamId: "test-team-id",
      }),
    );
  });

  test("throws when document is not found", async () => {
    mocks.deleteDocument.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());

    await expect(caller.delete({ id: DOC_ID })).rejects.toThrow(
      "Document not found",
    );
  });
});

describe("tRPC: documents.getRelatedDocuments", () => {
  beforeEach(() => {
    mocks.getRelatedDocuments.mockReset();
    mocks.getRelatedDocuments.mockImplementation(() => Promise.resolve([]));
  });

  test("returns related documents for a vault item", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.getRelatedDocuments({
      id: DOC_ID,
      pageSize: 5,
    });

    expect(result).toEqual([]);
    expect(mocks.getRelatedDocuments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: DOC_ID,
        pageSize: 5,
        teamId: "test-team-id",
      }),
    );
  });
});

describe("tRPC: documents.checkAttachments", () => {
  beforeEach(() => {
    mocks.checkDocumentAttachments.mockReset();
    mocks.checkDocumentAttachments.mockImplementation(() =>
      Promise.resolve({ hasAttachments: false, attachments: [] }),
    );
  });

  test("returns attachment check rows for document id", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.checkAttachments({ id: DOC_ID });

    expect(result).toEqual({ hasAttachments: false, attachments: [] });
    expect(mocks.checkDocumentAttachments).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: DOC_ID, teamId: "test-team-id" }),
    );
  });
});

describe("tRPC: documents signed URLs enforce team namespaces", () => {
  beforeEach(() => {
    mocks.signedUrl.mockReset();
    mocks.signedUrl.mockImplementation(() =>
      Promise.resolve("https://example.com/signed-doc"),
    );
  });
  test("returns an own-team signed URL", async () => {
    const caller = createCaller(createTestContext());
    expect(
      await caller.signedUrl({
        filePath: "test-team-id/doc.pdf",
        expireIn: 3600,
      }),
    ).toEqual({ signedUrl: "https://example.com/signed-doc" });
    expect(mocks.signedUrl).toHaveBeenCalledWith(
      "vault",
      "test-team-id/doc.pdf",
      { expiresIn: 3600 },
    );
  });
  test("rejects cross-team paths before signing", async () => {
    const caller = createCaller(createTestContext());
    for (const filePath of [
      "other-team/doc.pdf",
      "test-team-id-evil/doc.pdf",
      "test-team-id/../other/doc.pdf",
      "test-team-id%2Fother/doc.pdf",
    ]) {
      await expect(
        caller.signedUrl({ filePath, expireIn: 60 }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });
  test("rejects the entire mixed-team batch before signing any file", async () => {
    const caller = createCaller(createTestContext());
    await expect(
      caller.signedUrls(["test-team-id/good.pdf", "other-team/bad.pdf"]),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });
  test("signs own-team batches with canonical percent-preserving keys", async () => {
    const caller = createCaller(createTestContext());
    expect(
      await caller.signedUrls(["/vault/test-team-id/literal%2F.pdf"]),
    ).toEqual(["https://example.com/signed-doc"]);
    expect(mocks.signedUrl).toHaveBeenCalledWith(
      "vault",
      "test-team-id/literal%2F.pdf",
      { expiresIn: 60 },
    );
  });
});
