import type { Bucket } from "./config";
import type { Body, ObjectInfo } from "./s3-operations";

async function client() {
  const { createClient } = await import("@midday/supabase/job");
  return createClient();
}
function isMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    statusCode?: string | number;
    status?: number;
    message?: string;
  };
  return (
    Number(value.statusCode ?? value.status) === 404 ||
    /not found|does not exist/i.test(value.message ?? "")
  );
}
export async function upload(
  bucket: Bucket,
  key: string,
  body: Body,
  options: { contentType?: string; cacheControl?: string } = {},
): Promise<ObjectInfo & { path: string }> {
  // Legacy Supabase writes accepted Blob/bytes; materialize streams for that API.
  const value =
    body instanceof ReadableStream
      ? new Uint8Array(await new Response(body).arrayBuffer())
      : body;
  const size =
    typeof value === "string"
      ? Buffer.byteLength(value)
      : value instanceof Blob
        ? value.size
        : value.byteLength;
  const { error } = await (await client()).storage
    .from(bucket)
    .upload(key, value, { ...options, upsert: true });
  if (error) throw error;
  return { key, path: key, size, contentType: options.contentType };
}
export async function download(
  bucket: Bucket,
  key: string,
): Promise<Blob | null> {
  const { data, error } = await (await client()).storage
    .from(bucket)
    .download(key);
  if (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  return data;
}
export async function getStream(bucket: Bucket, key: string) {
  let url: string;
  try {
    url = await createSignedUrl(bucket, key, { expiresIn: 60 });
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  // SDK download() materializes a Blob. Fetch the signed URL directly so large
  // hosted files retain streaming/backpressure without forwarding service keys.
  const response = await fetch(url);
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    if (response.status === 404) return null;
    throw new Error(`Supabase storage stream failed (${response.status})`);
  }
  if (!response.body) throw new Error("Supabase storage response has no body");
  const length = response.headers.get("content-length");
  const size = length && /^\d+$/.test(length) ? Number(length) : undefined;
  return {
    body: response.body,
    contentType: response.headers.get("content-type") ?? undefined,
    size: size !== undefined && Number.isSafeInteger(size) ? size : undefined,
  };
}
export async function head(
  bucket: Bucket,
  key: string,
): Promise<ObjectInfo | null> {
  const { data, error } = await (await client()).storage.from(bucket).info(key);
  if (error) {
    if (isMissing(error)) return null;
    throw error;
  }
  return {
    key,
    size: data.size ?? 0,
    contentType: data.contentType,
    etag: data.etag,
    lastModified: data.lastModified ? new Date(data.lastModified) : undefined,
  };
}
export async function remove(bucket: Bucket, keys: string[]): Promise<void> {
  for (let offset = 0; offset < keys.length; offset += 1000) {
    const { error } = await (await client()).storage
      .from(bucket)
      .remove(keys.slice(offset, offset + 1000));
    if (error) throw error;
  }
}
/** Supabase V1 lists immediate children, so recurse folders and page each level. */
export async function* list(
  bucket: Bucket,
  prefix: string,
): AsyncIterable<ObjectInfo> {
  const storage = (await client()).storage.from(bucket);
  const folder = prefix.endsWith("/")
    ? prefix.slice(0, -1)
    : prefix.split("/").slice(0, -1).join("/");
  async function* walk(path: string): AsyncIterable<ObjectInfo> {
    let offset = 0;
    while (true) {
      const { data, error } = await storage.list(path, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw error;
      for (const item of data) {
        const key = path ? `${path}/${item.name}` : item.name;
        if (item.id === null) {
          if (prefix.startsWith(`${key}/`) || `${key}/`.startsWith(prefix))
            yield* walk(key);
        } else if (key.startsWith(prefix)) {
          yield {
            key,
            size: Number(item.metadata?.size ?? 0),
            contentType: item.metadata?.mimetype,
            etag: item.metadata?.eTag,
            lastModified: item.updated_at
              ? new Date(item.updated_at)
              : undefined,
          };
        }
      }
      if (data.length < 100) break;
      offset += data.length;
    }
  }
  yield* walk(folder);
}
export async function createSignedUrl(
  bucket: Bucket,
  key: string,
  options: { expiresIn: number; download?: boolean | string },
): Promise<string> {
  if (!Number.isFinite(options.expiresIn))
    throw new RangeError("Storage URL expiry must be finite");
  const { data, error } = await (await client()).storage
    .from(bucket)
    .createSignedUrl(key, Math.max(1, Math.floor(options.expiresIn)), {
      download: options.download,
    });
  if (error) throw error;
  return data.signedUrl;
}
export async function checkStorageHealth(): Promise<void> {
  const { error } = await (await client()).storage.getBucket("vault");
  if (error) throw error;
}
