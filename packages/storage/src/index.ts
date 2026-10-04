import { isLocalBackend } from "@midday/utils/backend";
import type { Bucket } from "./config";
import { normalizeKey, StorageKeyError } from "./keys";
import type { Body, ObjectInfo } from "./s3-operations";

export type { Bucket } from "./config";
export type { Body, ObjectInfo } from "./s3-operations";

/** Load only the selected provider; Supabase deployments do not need S3 credentials. */
async function backend() {
  return isLocalBackend()
    ? import("./s3-operations.js")
    : import("./supabase-operations.js");
}
export async function upload(
  bucket: Bucket,
  key: string,
  body: Body,
  options: { contentType?: string; cacheControl?: string } = {},
): Promise<ObjectInfo & { path: string }> {
  return (await backend()).upload(bucket, normalizeKey(key), body, options);
}
export async function download(
  bucket: Bucket,
  key: string,
): Promise<Blob | null> {
  return (await backend()).download(bucket, normalizeKey(key));
}
export async function getStream(
  bucket: Bucket,
  key: string,
): Promise<{
  body: ReadableStream<Uint8Array>;
  contentType?: string;
  size?: number;
} | null> {
  return (await backend()).getStream(bucket, normalizeKey(key));
}
export async function head(
  bucket: Bucket,
  key: string,
): Promise<ObjectInfo | null> {
  return (await backend()).head(bucket, normalizeKey(key));
}
export async function remove(bucket: Bucket, keys: string[]): Promise<void> {
  return (await backend()).remove(bucket, keys.map(normalizeKey));
}
export async function* list(
  bucket: Bucket,
  prefix: string,
): AsyncIterable<ObjectInfo> {
  const canonical = prefix.endsWith("/")
    ? `${normalizeKey(prefix.slice(0, -1))}/`
    : normalizeKey(prefix);
  yield* (await backend()).list(bucket, canonical);
}
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
export async function createSignedUrl(
  bucket: Bucket,
  key: string,
  options: { expiresIn: number; download?: boolean | string },
): Promise<string> {
  return (await backend()).createSignedUrl(bucket, normalizeKey(key), options);
}
/** Local browsers use presigned PUT; Supabase browsers keep the existing TUS flow. */
export async function createSignedUploadUrl(
  bucket: Bucket,
  key: string,
  options: { expiresIn?: number; contentType: string },
): Promise<{ url: string; method: "PUT"; headers: Record<string, string> }> {
  if (!isLocalBackend())
    throw new Error("Presigned PUT uploads require the local storage provider");
  return (await import("./s3-operations.js")).createSignedUploadUrl(
    bucket,
    normalizeKey(key),
    options,
  );
}
export function getPublicUrl(bucket: "avatars" | "apps", key: string): string {
  const encoded = normalizeKey(key)
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  if (!isLocalBackend()) {
    const base =
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (!base) throw new Error("Supabase storage URL is not configured");
    return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
  }
  const base =
    bucket === "avatars"
      ? process.env.STORAGE_PUBLIC_URL_AVATARS
      : process.env.STORAGE_PUBLIC_URL_APPS;
  if (!base)
    throw new Error(`Public storage URL is not configured for ${bucket}`);
  return `${new URL(base).toString().replace(/\/+$/, "")}/${encoded}`;
}
export async function checkStorageHealth(): Promise<void> {
  return (await backend()).checkStorageHealth();
}
