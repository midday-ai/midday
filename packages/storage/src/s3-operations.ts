import { Readable } from "node:stream";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { type Bucket, getBucketName, getPublicBaseUrl } from "./config";
import { normalizeKey, StorageKeyError } from "./keys";
import { getS3Client } from "./s3";

export type { Bucket } from "./config";
export type Body =
  | Uint8Array
  | Buffer
  | Blob
  | ReadableStream<Uint8Array>
  | string;
export interface ObjectInfo {
  key: string;
  size: number;
  contentType?: string;
  etag?: string;
  lastModified?: Date;
}

function isMissing(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "NoSuchKey" || error.name === "NotFound";
}
function expiresIn(value: number): number {
  if (!Number.isFinite(value))
    throw new RangeError("Storage URL expiry must be finite");
  return Math.max(1, Math.min(604800, Math.floor(value)));
}
function disposition(download: boolean | string, key: string): string {
  const filename =
    typeof download === "string" ? download : key.split("/").at(-1)!;
  // biome-ignore lint/suspicious/noControlCharactersInRegex: strip control bytes to prevent response header injection
  const safe = filename.replace(/[\u0000-\u001f\u007f\\"/]/g, "_");
  const ascii = safe.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(safe).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

/** Store/overwrite a canonical object key. Stream uploads use bounded multipart buffering. */
export async function upload(
  bucket: Bucket,
  input: string,
  body: Body,
  options: { contentType?: string; cacheControl?: string } = {},
): Promise<ObjectInfo & { path: string }> {
  const key = normalizeKey(input);
  let size = 0;
  let data: Uint8Array | string | Readable;
  if (typeof body === "string") {
    data = body;
    size = Buffer.byteLength(body);
  } else if (body instanceof Blob) {
    data = new Uint8Array(await body.arrayBuffer());
    size = body.size;
  } else if (body instanceof ReadableStream) {
    data = Readable.from(
      (async function* () {
        const reader = body.getReader();
        try {
          while (true) {
            const result = await reader.read();
            if (result.done) break;
            size += result.value.byteLength;
            yield result.value;
          }
        } finally {
          reader.releaseLock();
        }
      })(),
    );
  } else {
    data = body;
    size = body.byteLength;
  }
  const params = {
    Bucket: getBucketName(bucket),
    Key: key,
    Body: data,
    ContentType: options.contentType,
    CacheControl: options.cacheControl,
  };
  const result =
    data instanceof Readable
      ? await new Upload({
          client: getS3Client(),
          params,
          queueSize: 2,
          leavePartsOnError: false,
        }).done()
      : await getS3Client().send(new PutObjectCommand(params));
  return {
    key,
    path: key,
    size,
    contentType: options.contentType,
    etag: result.ETag,
  };
}

/** Read a small object as a Blob, preserving its Content-Type; missing keys return null. */
export async function download(
  bucket: Bucket,
  key: string,
): Promise<Blob | null> {
  const result = await getStream(bucket, key);
  if (!result) return null;
  return new Blob([await new Response(result.body).arrayBuffer()], {
    type: result.contentType ?? "application/octet-stream",
  });
}

/** Stream an object without buffering the complete body in application memory. */
export async function getStream(
  bucket: Bucket,
  input: string,
): Promise<{
  body: ReadableStream<Uint8Array>;
  contentType?: string;
  size?: number;
} | null> {
  const key = normalizeKey(input);
  try {
    const result = await getS3Client().send(
      new GetObjectCommand({ Bucket: getBucketName(bucket), Key: key }),
    );
    if (!result.Body) return null;
    return {
      body: result.Body.transformToWebStream(),
      contentType: result.ContentType,
      size: result.ContentLength,
    };
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/** Read object metadata without downloading content. */
export async function head(
  bucket: Bucket,
  input: string,
): Promise<ObjectInfo | null> {
  const key = normalizeKey(input);
  try {
    const result = await getS3Client().send(
      new HeadObjectCommand({ Bucket: getBucketName(bucket), Key: key }),
    );
    return {
      key,
      size: result.ContentLength ?? 0,
      contentType: result.ContentType,
      etag: result.ETag,
      lastModified: result.LastModified,
    };
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/** Delete exact authorized keys, in S3 batches; report partial failures instead of losing them. */
export async function remove(bucket: Bucket, inputs: string[]): Promise<void> {
  const keys = inputs.map(normalizeKey);
  for (let offset = 0; offset < keys.length; offset += 1000) {
    const result = await getS3Client().send(
      new DeleteObjectsCommand({
        Bucket: getBucketName(bucket),
        Delete: {
          Objects: keys.slice(offset, offset + 1000).map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    if (result.Errors?.length)
      throw new Error(
        `Storage deletion failed: ${result.Errors.map((error) => `${error.Key}: ${error.Code}`).join(", ")}`,
      );
  }
}

/** Iterate a nonempty canonical prefix across all S3 listing pages. */
export async function* list(
  bucket: Bucket,
  input: string,
): AsyncIterable<ObjectInfo> {
  const prefix = input.endsWith("/")
    ? `${normalizeKey(input.slice(0, -1))}/`
    : normalizeKey(input);
  let continuation: string | undefined;
  do {
    const result = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: getBucketName(bucket),
        Prefix: prefix,
        ContinuationToken: continuation,
      }),
    );
    for (const object of result.Contents ?? []) {
      if (object.Key)
        yield {
          key: object.Key,
          size: object.Size ?? 0,
          etag: object.ETag,
          lastModified: object.LastModified,
        };
    }
    continuation = result.IsTruncated
      ? result.NextContinuationToken
      : undefined;
    if (result.IsTruncated && !continuation)
      throw new Error("Storage listing did not return a continuation token");
  } while (continuation);
}

/** Delete a folder namespace only; requiring '/' avoids team-prefix collisions. */
export async function removePrefix(
  bucket: Bucket,
  prefix: string,
): Promise<number> {
  if (!prefix.endsWith("/"))
    throw new StorageKeyError("Deletion prefix must end with /");
  const keys: string[] = [];
  for await (const object of list(bucket, prefix)) keys.push(object.key);
  await remove(bucket, keys);
  return keys.length;
}

/** Sign a browser-reachable GET for at most seven days. */
export async function createSignedUrl(
  bucket: Bucket,
  input: string,
  options: { expiresIn: number; download?: boolean | string },
): Promise<string> {
  const key = normalizeKey(input);
  return getSignedUrl(
    getS3Client("presign"),
    new GetObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      ResponseContentDisposition: options.download
        ? disposition(options.download, key)
        : undefined,
    }),
    { expiresIn: expiresIn(options.expiresIn) },
  );
}

/** Sign Content-Type as well as the key; callers must forward the returned headers exactly. */
export async function createSignedUploadUrl(
  bucket: Bucket,
  input: string,
  options: { expiresIn?: number; contentType: string },
): Promise<{ url: string; method: "PUT"; headers: Record<string, string> }> {
  const key = normalizeKey(input);
  const url = await getSignedUrl(
    getS3Client("presign"),
    new PutObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      ContentType: options.contentType,
    }),
    {
      expiresIn: expiresIn(options.expiresIn ?? 600),
      signableHeaders: new Set(["content-type"]),
    },
  );
  return {
    url,
    method: "PUT",
    headers: { "Content-Type": options.contentType },
  };
}

/** Build a public asset URL without changing the interpretation of reserved filename characters. */
export function getPublicUrl(
  bucket: "avatars" | "apps",
  input: string,
): string {
  return `${getPublicBaseUrl(bucket)}/${normalizeKey(input).split("/").map(encodeURIComponent).join("/")}`;
}

/** Cheap storage health check using the configured private bucket. */
export async function checkStorageHealth(): Promise<void> {
  await getS3Client().send(
    new HeadBucketCommand({ Bucket: getBucketName("vault") }),
  );
}
