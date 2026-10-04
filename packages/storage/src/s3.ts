import { S3Client } from "@aws-sdk/client-s3";
import { getStorageConfig } from "./config";

let internal: S3Client | undefined;
let presign: S3Client | undefined;

/** Operations use an internal endpoint; signed URLs use the browser-reachable host. */
export function getS3Client(
  kind: "internal" | "presign" = "internal",
): S3Client {
  const existing = kind === "internal" ? internal : presign;
  if (existing) return existing;
  const config = getStorageConfig();
  const client = new S3Client({
    endpoint:
      kind === "presign"
        ? (config.STORAGE_PUBLIC_ENDPOINT ?? config.STORAGE_ENDPOINT)
        : config.STORAGE_ENDPOINT,
    region: config.STORAGE_REGION,
    forcePathStyle: config.STORAGE_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: config.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: config.STORAGE_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  if (kind === "internal") internal = client;
  else presign = client;
  return client;
}
