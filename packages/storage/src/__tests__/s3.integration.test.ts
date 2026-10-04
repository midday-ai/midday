import { afterAll, describe, expect, test } from "bun:test";
import {
  checkStorageHealth,
  createSignedUploadUrl,
  createSignedUrl,
  download,
  getPublicUrl,
  getStream,
  head,
  list,
  remove,
  removePrefix,
  upload,
} from "../index";
import { assertTeamKey } from "../keys";

const enabled =
  process.env.NEXT_PUBLIC_BACKEND_PROVIDER === "local" &&
  Boolean(process.env.STORAGE_ENDPOINT);
const prefix = `storage-test-${crypto.randomUUID()}/`;
// Integration runs are intentionally confined to local infrastructure.
if (
  enabled &&
  !["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(process.env.STORAGE_ENDPOINT!).hostname,
  )
) {
  throw new Error("Storage integration tests require a localhost endpoint");
}

describe.skipIf(!enabled)("S3 storage against local MinIO", () => {
  afterAll(async () => {
    await removePrefix("vault", prefix);
  });
  test("upload, head, download, signed GET, attachment, stream, delete", async () => {
    await checkStorageHealth();
    const key = `${prefix}été-100%#?.pdf`;
    const info = await upload(
      "vault",
      key,
      new Blob(["hello pdf"], { type: "application/pdf" }),
      { contentType: "application/pdf" },
    );
    expect(info).toMatchObject({
      key,
      path: key,
      size: 9,
      contentType: "application/pdf",
    });
    expect(await head("vault", key)).toMatchObject({
      size: 9,
      contentType: "application/pdf",
    });
    const blob = await download("vault", key);
    expect(blob?.type).toBe("application/pdf");
    expect(await blob?.text()).toBe("hello pdf");
    const url = await createSignedUrl("vault", key, { expiresIn: 60 });
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("hello pdf");
    const attachment = await fetch(
      await createSignedUrl("vault", key, { expiresIn: 60, download: true }),
    );
    expect(attachment.headers.get("content-disposition")).toStartWith(
      "attachment;",
    );
    expect(attachment.headers.get("content-disposition")).toContain(
      "filename*=UTF-8''",
    );
    await attachment.body?.cancel();
    const streamed = await getStream("vault", key);
    expect(streamed?.contentType).toBe("application/pdf");
    expect(await new Response(streamed!.body).text()).toBe("hello pdf");
    await remove("vault", [key]);
    expect(await download("vault", key)).toBeNull();
    expect(await head("vault", key)).toBeNull();
  });
  test("presigned PUT binds MIME and uses browser endpoint", async () => {
    const key = `${prefix}presigned.txt`;
    const signed = await createSignedUploadUrl("vault", key, {
      contentType: "text/plain",
    });
    expect(new URL(signed.url).origin).toBe(
      process.env.STORAGE_PUBLIC_ENDPOINT ?? process.env.STORAGE_ENDPOINT!,
    );
    const rejected = await fetch(signed.url, {
      method: signed.method,
      headers: { "Content-Type": "application/pdf" },
      body: "bad",
    });
    expect(rejected.status).toBe(403);
    await rejected.body?.cancel();
    const result = await fetch(signed.url, {
      method: signed.method,
      headers: signed.headers,
      body: "accepted",
    });
    expect(result.status).toBe(200);
    expect(await head("vault", key)).toMatchObject({
      size: 8,
      contentType: "text/plain",
    });
  });
  test("percent-encoded lookalikes remain distinct exact deletion targets", async () => {
    const team = prefix.slice(0, -1);
    const raw = `${prefix}literal%2Ffile.txt`;
    const decoded = `${prefix}literal/file.txt`;
    await upload("vault", raw, "literal", { contentType: "text/plain" });
    await upload("vault", decoded, "decoded", { contentType: "text/plain" });
    await remove("vault", [assertTeamKey(team, raw)]);
    expect(await head("vault", raw)).toBeNull();
    expect(await (await download("vault", decoded))?.text()).toBe("decoded");
  });
  test("stream input counts bytes and supports listing/prefix cleanup", async () => {
    const folder = `${prefix}stream/`;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("streamed"));
        controller.close();
      },
    });
    expect(
      await upload("vault", `${folder}a.txt`, stream, {
        contentType: "text/plain",
      }),
    ).toMatchObject({ size: 8 });
    await upload("vault", `${folder}b.txt`, new Uint8Array([1, 2, 3]));
    const objects = [];
    for await (const object of list("vault", folder)) objects.push(object.key);
    expect(objects.sort()).toEqual([`${folder}a.txt`, `${folder}b.txt`]);
    expect(await removePrefix("vault", folder)).toBe(2);
    expect(await head("vault", `${folder}a.txt`)).toBeNull();
  });
  test("expires bounded, dangerous prefixes blocked, entire delete validated first", async () => {
    const key = `${prefix}keep.txt`;
    await upload("vault", key, "keep");
    const signed = await createSignedUrl("vault", key, { expiresIn: 99999999 });
    expect(new URL(signed).searchParams.get("X-Amz-Expires")).toBe("604800");
    await expect(removePrefix("vault", "")).rejects.toThrow();
    await expect(removePrefix("vault", prefix.slice(0, -1))).rejects.toThrow();
    await expect(
      remove("vault", [key, "team/../other/file"]),
    ).rejects.toThrow();
    expect(await head("vault", key)).not.toBeNull();
  });
  test("public URL escapes reserved path characters without credentials", () => {
    const old = process.env.STORAGE_PUBLIC_URL_AVATARS;
    try {
      process.env.STORAGE_PUBLIC_URL_AVATARS = "http://localhost:9000/avatars";
      expect(getPublicUrl("avatars", "team/a#?%.png")).toBe(
        "http://localhost:9000/avatars/team/a%23%3F%25.png",
      );
    } finally {
      if (old === undefined) delete process.env.STORAGE_PUBLIC_URL_AVATARS;
      else process.env.STORAGE_PUBLIC_URL_AVATARS = old;
    }
  });
});
