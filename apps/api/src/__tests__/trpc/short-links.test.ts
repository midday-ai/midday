import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createCallerFactory } from "../../trpc/init";
import { shortLinksRouter } from "../../trpc/routers/short-links";
import { createTestContext } from "../helpers/test-context";
import { mocks } from "../setup";

const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
beforeEach(() => {
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "local";
});
afterAll(() => {
  if (originalProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
});

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
      Promise.resolve("https://signed.example/file"),
    );
    mocks.createShortLink.mockImplementation(() =>
      Promise.resolve({
        id: "sl-doc",
        shortId: "sh2",
        url: "https://signed.example/file",
      }),
    );
  });

  test("stores object reference without a bearer URL for document shares", async () => {
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
    expect(mocks.createShortLink).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        url: "storage://vault/test-team-id/doc.pdf",
        bucket: "vault",
        objectKey: "test-team-id/doc.pdf",
      }),
    );
    expect(mocks.signedUrl).toHaveBeenCalledWith(
      "vault",
      "test-team-id/doc.pdf",
      { expiresIn: 60, download: true },
    );
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

describe("storage short-link resolution", () => {
  beforeEach(() => {
    mocks.signedUrl.mockReset();
    mocks.signedUrl.mockImplementation(() =>
      Promise.resolve("http://localhost:9000/fresh-signed"),
    );
    mocks.getShortLinkByShortId.mockReset();
  });
  const link = {
    id: "storage-link",
    shortId: "share",
    teamId: "test-team-id",
    bucket: "vault",
    objectKey: "test-team-id/receipt.pdf",
    url: "storage://vault/test-team-id/receipt.pdf",
    expiresAt: null,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  };
  test("eight-day-old unexpired link gets a fresh 60-second signature on each access", async () => {
    mocks.getShortLinkByShortId.mockImplementation(() => Promise.resolve(link));
    const caller = createCaller(createTestContext());
    expect((await caller.get({ shortId: "share" }))?.url).toBe(
      "http://localhost:9000/fresh-signed",
    );
    await caller.get({ shortId: "share" });
    expect(mocks.signedUrl).toHaveBeenCalledTimes(2);
    expect(mocks.signedUrl).toHaveBeenCalledWith("vault", link.objectKey, {
      expiresIn: 60,
      download: true,
    });
  });
  test("expired share link is rejected at the public API before signing", async () => {
    mocks.getShortLinkByShortId.mockImplementation(() =>
      Promise.resolve({
        ...link,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    expect(
      await createCaller(createTestContext()).get({ shortId: "share" }),
    ).toBeNull();
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });
  test("stored foreign tenant object cannot be signed", async () => {
    mocks.getShortLinkByShortId.mockImplementation(() =>
      Promise.resolve({ ...link, objectKey: "other-team/receipt.pdf" }),
    );
    await expect(
      createCaller(createTestContext()).get({ shortId: "share" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.signedUrl).not.toHaveBeenCalled();
  });
});

test("Supabase document shares keep signed URLs and omit local-only object-reference columns", async () => {
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER = "supabase";
  mocks.getDocumentById.mockImplementation(() =>
    Promise.resolve({
      id: DOC_ID,
      name: "doc.pdf",
      pathTokens: ["test-team-id", "doc.pdf"],
      metadata: { contentType: "application/pdf", size: 123 },
    }),
  );
  mocks.signedUrl.mockReset();
  mocks.signedUrl.mockImplementation(() =>
    Promise.resolve("https://storage.example.test/legacy-signed"),
  );
  mocks.createShortLink.mockReset();
  mocks.createShortLink.mockImplementation(() =>
    Promise.resolve({
      id: "legacy",
      shortId: "share",
      url: "https://storage.example.test/legacy-signed",
    }),
  );
  await createCaller(createTestContext()).createForDocument({
    documentId: DOC_ID,
    expireIn: 2592000,
  });
  expect(mocks.signedUrl).toHaveBeenCalledWith(
    "vault",
    "test-team-id/doc.pdf",
    { expiresIn: 2592000, download: true },
  );
  const data = mocks.createShortLink.mock.calls[0]![1];
  expect(data.url).toBe("https://storage.example.test/legacy-signed");
  expect(data).not.toHaveProperty("bucket");
  expect(data).not.toHaveProperty("objectKey");
});
