import { z } from "zod";

export type Bucket = "vault" | "avatars" | "apps";
const schema = z.object({
  STORAGE_ENDPOINT: z.url(),
  STORAGE_PUBLIC_ENDPOINT: z.url().optional(),
  STORAGE_REGION: z.string().min(1).default("us-east-1"),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_FORCE_PATH_STYLE: z.enum(["true", "false"]).default("false"),
  STORAGE_BUCKET_VAULT: z.string().min(1).default("vault"),
  STORAGE_BUCKET_AVATARS: z.string().min(1).default("avatars"),
  STORAGE_BUCKET_APPS: z.string().min(1).default("apps"),
});

/** Read credentials only when server operations begin, never at module import. */
export function getStorageConfig() {
  return schema.parse(process.env);
}

/** Resolve the portable logical bucket to an installation's physical bucket. */
export function getBucketName(bucket: Bucket): string {
  const config = getStorageConfig();
  return {
    vault: config.STORAGE_BUCKET_VAULT,
    avatars: config.STORAGE_BUCKET_AVATARS,
    apps: config.STORAGE_BUCKET_APPS,
  }[bucket];
}

/** Public URL lookup needs no credentials and is safe for lazy server rendering. */
export function getPublicBaseUrl(bucket: "avatars" | "apps"): string {
  const value =
    bucket === "avatars"
      ? process.env.STORAGE_PUBLIC_URL_AVATARS
      : process.env.STORAGE_PUBLIC_URL_APPS;
  if (!value)
    throw new Error(`Public storage URL is not configured for ${bucket}`);
  return z.url().parse(value).replace(/\/+$/, "");
}
