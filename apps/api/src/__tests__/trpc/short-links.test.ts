import { beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { shortLinksRouter } from "../../trpc/routers/short-links";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const createCaller = createCallerFactory(shortLinksRouter);

describe("tRPC: shortLinks.get (public)", () => {
  beforeEach(() => {
    mocks.getShortLinkByShortId.mockReset();
    mocks.getShortLinkByShortId.mockImplementation(() =>
      Promise.resolve({
        id: "sl-row-id",
        url: "https://example.com/target",
        shortId: "abc123",
      }),
    );
  });

  test("resolves short link by shortId", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.get({ shortId: "abc123" });

    expect(result).toMatchObject({
      id: "sl-row-id",
      url: "https://example.com/target",
      shortId: "abc123",
    });
    expect(mocks.getShortLinkByShortId).toHaveBeenCalledWith(
      expect.anything(),
      "abc123",
    );
  });

  test("returns null when short link is missing", async () => {
    mocks.getShortLinkByShortId.mockImplementation(() => Promise.resolve(null));

    const caller = createCaller(createTestContext());
    expect(await caller.get({ shortId: "abc123" })).toBeNull();
  });
});

describe("tRPC: shortLinks.createForUrl", () => {
  beforeEach(() => {
    mocks.createShortLink.mockReset();
    mocks.createShortLink.mockImplementation(() =>
      Promise.resolve({
        id: "sl-row",
        shortId: "sh1",
        url: "https://example.com",
      }),
    );
  });

  test("creates redirect short link for URL", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.createForUrl({ url: "https://example.com" });

    expect(result).toMatchObject({
      id: "sl-row",
      shortId: "sh1",
      url: "https://example.com",
      shortUrl: `${process.env.MIDDAY_DASHBOARD_URL}/s/sh1`,
    });
    expect(mocks.createShortLink).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        url: "https://example.com",
        teamId: "test-team-id",
        userId: "test-user-id",
        type: "redirect",
      }),
    );
  });
});

const DOC_ID = "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f";

describe("tRPC: shortLinks.createForDocument", () => {
  beforeEach(() => {
    mocks.getDocumentById.mockReset();
    mocks.createShortLink.mockReset();
    mocks.signedUrl.mockReset();
    mocks.getDocumentById.mockImplementation(() =>
      Promise.resolve({
        id: DOC_ID,
        name: "doc.pdf",
        pathTokens: ["test-team-id", "doc.pdf"],
        metadata: { contentType: "application/pdf", size: 1024 },
      }),
    );
    mocks.signedUrl.mockImplementation(() =>
      Promise.resolve({
        data: { signedUrl: "https://signed.example/file" },
        error: null,
      }),
    );
    mocks.createShortLink.mockImplementation(() =>
      Promise.resolve({
        id: "sl-doc",
        shortId: "sh2",
        url: "https://signed.example/file",
      }),
    );
  });

  test("creates download short link from document signed URL", async () => {
    const caller = createCaller(createTestContext());
    const result = await caller.createForDocument({
      documentId: DOC_ID,
      filePath: "test/doc.pdf",
      expireIn: 3600,
    });

    expect(result).toMatchObject({
      id: "sl-doc",
      shortId: "sh2",
      originalUrl: "https://signed.example/file",
    });
    expect(mocks.getDocumentById).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        id: DOC_ID,
        filePath: "test/doc.pdf",
        teamId: "test-team-id",
      }),
    );
  });
});
