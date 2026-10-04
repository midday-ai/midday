import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";

const uploadObject = mock(() =>
  Promise.resolve({ data: { path: "team/file.pdf" }, error: null }),
);
const downloadObject = mock(() =>
  Promise.resolve({
    data: new Blob(["abc"], { type: "application/pdf" }),
    error: null as unknown,
  }),
);
const infoObject = mock(() =>
  Promise.resolve({
    data: { size: 3, contentType: "application/pdf" },
    error: null,
  }),
);
const removeObjects = mock(() => Promise.resolve({ data: [], error: null }));
const listObjects = mock((path: string) =>
  Promise.resolve({
    data:
      path === "team"
        ? [{ name: "folder", id: null, metadata: null }]
        : [
            {
              name: "file.pdf",
              id: "object-id",
              metadata: { size: 3, mimetype: "application/pdf" },
              updated_at: null,
            },
          ],
    error: null,
  }),
);
const signObject = mock(() =>
  Promise.resolve({
    data: { signedUrl: "http://localhost/signed-supabase" },
    error: null as unknown,
  }),
);
const getBucket = mock(() =>
  Promise.resolve({ data: { name: "vault" }, error: null }),
);
const from = mock(() => ({
  upload: uploadObject,
  download: downloadObject,
  info: infoObject,
  remove: removeObjects,
  list: listObjects,
  createSignedUrl: signObject,
}));
mock.module("@midday/supabase/job", () => ({
  createClient: () => ({ storage: { from, getBucket } }),
}));
const upsertDocumentForObject = mock(() => Promise.resolve({ id: "doc" }));
mock.module("@midday/db/queries", () => ({ upsertDocumentForObject }));
const {
  upload,
  download,
  head,
  getStream,
  remove,
  removePrefix,
  createSignedUrl,
  createSignedUploadUrl,
  getPublicUrl,
  checkStorageHealth,
} = await import("../index");
const { uploadVaultObject } = await import("../vault");
const originalFetch = globalThis.fetch;
const fetchObject = mock(
  async () =>
    new Response("abc", {
      headers: { "content-type": "application/pdf", "content-length": "3" },
    }),
);
const originalProvider = process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
beforeEach(() => {
  globalThis.fetch = fetchObject as unknown as typeof fetch;
  delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER; // Existing deployments default to Supabase.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  for (const fn of [
    uploadObject,
    downloadObject,
    infoObject,
    removeObjects,
    listObjects,
    signObject,
    getBucket,
    from,
    upsertDocumentForObject,
    fetchObject,
  ])
    fn.mockClear();
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});
afterAll(() => {
  if (originalProvider === undefined)
    delete process.env.NEXT_PUBLIC_BACKEND_PROVIDER;
  else process.env.NEXT_PUBLIC_BACKEND_PROVIDER = originalProvider;
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
});

describe("Supabase storage compatibility", () => {
  test("default provider uploads without any S3 configuration", async () => {
    const result = await upload("vault", "team/file.pdf", "abc", {
      contentType: "application/pdf",
    });
    expect(result).toMatchObject({
      key: "team/file.pdf",
      path: "team/file.pdf",
      size: 3,
    });
    expect(from).toHaveBeenCalledWith("vault");
    expect(uploadObject).toHaveBeenCalledWith("team/file.pdf", "abc", {
      contentType: "application/pdf",
      upsert: true,
    });
  });
  test("download, stream, head, health, delete and public URL preserve provider contracts", async () => {
    expect(await (await download("vault", "team/file.pdf"))?.text()).toBe(
      "abc",
    );
    expect(
      await new Response(
        (await getStream("vault", "team/file.pdf"))?.body,
      ).text(),
    ).toBe("abc");
    expect(await head("vault", "team/file.pdf")).toMatchObject({
      size: 3,
      contentType: "application/pdf",
    });
    await checkStorageHealth();
    expect(getBucket).toHaveBeenCalledWith("vault");
    await remove("vault", ["team/file.pdf"]);
    expect(removeObjects).toHaveBeenCalledWith(["team/file.pdf"]);
    expect(getPublicUrl("avatars", "user/a #.png")).toBe(
      "http://localhost:54321/storage/v1/object/public/avatars/user/a%20%23.png",
    );
  });
  test("stream signs through SDK and returns the upstream body without downloading or reading it", async () => {
    const pull = mock(() => {});
    const body = new ReadableStream<Uint8Array>({ pull }, { highWaterMark: 0 });
    const response = new Response(body, {
      headers: {
        "content-type": "application/pdf",
        "content-length": "104857600",
      },
    });
    const readBlob = mock(() => {
      throw new Error("Must not buffer Blob");
    });
    const readBytes = mock(() => {
      throw new Error("Must not buffer bytes");
    });
    response.blob = readBlob;
    response.arrayBuffer = readBytes;
    fetchObject.mockImplementationOnce(async () => response);
    const result = await getStream("vault", "team/large.pdf");
    expect(signObject).toHaveBeenCalledWith("team/large.pdf", 60, {
      download: undefined,
    });
    expect(fetchObject).toHaveBeenCalledWith(
      "http://localhost/signed-supabase",
    );
    expect(downloadObject).not.toHaveBeenCalled();
    expect(result?.body).toBe(response.body!);
    expect(result?.contentType).toBe("application/pdf");
    expect(result?.size).toBe(104857600);
    expect(response.bodyUsed).toBe(false);
    expect(pull).not.toHaveBeenCalled();
    expect(readBlob).not.toHaveBeenCalled();
    expect(readBytes).not.toHaveBeenCalled();
    await result?.body.cancel();
  });
  test("stream missing-object responses return null and release failed HTTP bodies", async () => {
    signObject.mockImplementationOnce(async () => ({
      data: null as never,
      error: { statusCode: "404", message: "Object not found" },
    }));
    expect(await getStream("vault", "team/missing.pdf")).toBeNull();
    expect(fetchObject).not.toHaveBeenCalled();
    const cancel = mock(() => {});
    const body = new ReadableStream<Uint8Array>(
      { cancel },
      { highWaterMark: 0 },
    );
    fetchObject.mockImplementationOnce(
      async () => new Response(body, { status: 404 }),
    );
    expect(await getStream("vault", "team/deleted.pdf")).toBeNull();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(downloadObject).not.toHaveBeenCalled();
  });
  test("stream propagates signing, network and non-404 HTTP failures", async () => {
    signObject.mockImplementationOnce(async () => ({
      data: null as never,
      error: { statusCode: "403", message: "Forbidden" },
    }));
    await expect(getStream("vault", "team/private.pdf")).rejects.toMatchObject({
      statusCode: "403",
    });
    expect(fetchObject).not.toHaveBeenCalled();
    const failure = new Error("Network unavailable");
    fetchObject.mockImplementationOnce(async () => {
      throw failure;
    });
    await expect(getStream("vault", "team/file.pdf")).rejects.toBe(failure);
    const cancel = mock(() => {});
    fetchObject.mockImplementationOnce(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({ cancel }, { highWaterMark: 0 }),
          { status: 503 },
        ),
    );
    await expect(getStream("vault", "team/file.pdf")).rejects.toThrow(
      "Supabase storage stream failed (503)",
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(downloadObject).not.toHaveBeenCalled();
  });
  test("stream metadata leaves absent/invalid lengths unknown and preserves zero", async () => {
    for (const length of [undefined, "invalid", "9007199254740992", "0"]) {
      fetchObject.mockImplementationOnce(
        async () =>
          new Response(new Uint8Array(), {
            headers: length === undefined ? {} : { "content-length": length },
          }),
      );
      const result = await getStream("vault", "team/empty.pdf");
      expect(result?.size).toBe(length === "0" ? 0 : undefined);
      expect(result?.contentType).toBeUndefined();
      await result?.body.cancel();
    }
    fetchObject.mockImplementationOnce(
      async () => new Response(null, { status: 204 }),
    );
    await expect(getStream("vault", "team/no-body.pdf")).rejects.toThrow(
      "Supabase storage response has no body",
    );
  });
  test("signed URLs use Supabase expiry/download options; local PUT endpoint is unavailable", async () => {
    expect(
      await createSignedUrl("vault", "team/file.pdf", {
        expiresIn: 3600,
        download: true,
      }),
    ).toBe("http://localhost/signed-supabase");
    expect(signObject).toHaveBeenCalledWith("team/file.pdf", 3600, {
      download: true,
    });
    await expect(
      createSignedUploadUrl("vault", "team/file.pdf", {
        contentType: "application/pdf",
      }),
    ).rejects.toThrow("local storage provider");
  });
  test("vault relies on the existing Supabase registration trigger, with no local ON CONFLICT", async () => {
    await uploadVaultObject({} as never, {
      teamId: "team",
      key: "team/file.pdf",
      body: "abc",
      contentType: "application/pdf",
    });
    expect(uploadObject).toHaveBeenCalledTimes(1);
    expect(upsertDocumentForObject).not.toHaveBeenCalled();
    await expect(
      uploadVaultObject({} as never, {
        teamId: "team",
        key: "foreign/file.pdf",
        body: "abc",
        contentType: "application/pdf",
      }),
    ).rejects.toThrow();
    expect(uploadObject).toHaveBeenCalledTimes(1);
  });
  test("folder deletion traverses Supabase folders within exact prefix", async () => {
    expect(await removePrefix("vault", "team/")).toBe(1);
    expect(listObjects).toHaveBeenCalledWith(
      "team",
      expect.objectContaining({ limit: 100, offset: 0 }),
    );
    expect(listObjects).toHaveBeenCalledWith("team/folder", expect.anything());
    expect(removeObjects).toHaveBeenCalledWith(["team/folder/file.pdf"]);
  });
  test("missing Supabase objects return null but provider errors propagate", async () => {
    downloadObject.mockImplementationOnce(() =>
      Promise.resolve({
        data: null as never,
        error: { statusCode: "404", message: "Object not found" },
      }),
    );
    expect(await download("vault", "team/missing.pdf")).toBeNull();
    downloadObject.mockImplementationOnce(() =>
      Promise.resolve({
        data: null as never,
        error: { statusCode: "403", message: "Forbidden" },
      }),
    );
    await expect(download("vault", "team/private.pdf")).rejects.toMatchObject({
      statusCode: "403",
    });
  });
});
