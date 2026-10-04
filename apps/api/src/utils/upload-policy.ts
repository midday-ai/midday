import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { normalizeKey, sanitizeFilename } from "@midday/storage/keys";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

export type UploadBucket = "vault" | "avatars" | "apps";
export type UploadContext = { teamId: string | null; userId: string };

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};
const extraVaultTypes = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/zip",
  "application/x-zip-compressed",
]);
const transactionId =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function forbidden(): never {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Upload path is not allowed",
  });
}

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

/** Content-Type used both for the signed PUT and subsequent HEAD checks. */
export function canonicalContentType(value: string): string {
  const type = value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(type)) {
    badRequest("A supported content type is required");
  }
  return type;
}

export function maxUploadBytes(bucket: UploadBucket): number {
  if (bucket !== "vault") return 5 * 1024 * 1024;
  const configured = process.env.STORAGE_MAX_UPLOAD_BYTES_VAULT;
  if (!configured) return 100 * 1024 * 1024;
  const value = Number(configured);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(
      "STORAGE_MAX_UPLOAD_BYTES_VAULT must be a positive integer",
    );
  }
  return value;
}

export function enforceMimeAndSize(
  bucket: UploadBucket,
  contentType: string,
  size: number,
): string {
  const type = canonicalContentType(contentType);
  if (
    !Number.isSafeInteger(size) ||
    size <= 0 ||
    size > maxUploadBytes(bucket)
  ) {
    badRequest("File exceeds the upload size limit or is empty");
  }
  const allowed =
    bucket === "vault"
      ? extraVaultTypes.has(type) || isMimeTypeSupportedForProcessing(type)
      : type.startsWith("image/");
  if (!allowed || (bucket === "apps" && !imageExtensions[type])) {
    badRequest("File type is not supported for this bucket");
  }
  return type;
}

/** Reject path aliases before joining: authorization always uses canonical raw keys. */
function validateSegments(path: string[]): void {
  if (path.length < 1 || path.length > 3) forbidden();
  for (const part of path) {
    try {
      if (part.includes("/") || normalizeKey(part) !== part) forbidden();
    } catch {
      forbidden();
    }
  }
}

/** Returns transaction ID when a caller must additionally check team-scoped DB ownership. */
export function authorizeUploadFolder(
  bucket: UploadBucket,
  path: string[],
  ctx: UploadContext,
): string | undefined {
  validateSegments(path);
  if (bucket === "vault") {
    if (!ctx.teamId || path[0] !== ctx.teamId) forbidden();
    if (path.length === 1) return;
    if (path.length === 2 && (path[1] === "inbox" || path[1] === "imports"))
      return;
    if (
      path.length === 3 &&
      path[1] === "transactions" &&
      transactionId.test(path[2]!)
    ) {
      return path[2];
    }
    forbidden();
  }
  if (bucket === "avatars") {
    if (
      path.length === 1 &&
      (path[0] === ctx.userId || (ctx.teamId && path[0] === ctx.teamId))
    )
      return;
    if (
      path.length === 2 &&
      ctx.teamId &&
      path[0] === ctx.teamId &&
      path[1] === "invoice"
    )
      return;
    forbidden();
  }
  if (path.length !== 1 || (path[0] !== "logos" && path[0] !== "screenshots"))
    forbidden();
}

/** The apps basename is always generated server-side from an allowed MIME extension. */
export function authorizeUploadKey(
  bucket: UploadBucket,
  path: string[],
  filename: string,
  ctx: UploadContext,
  contentType: string,
): string {
  authorizeUploadFolder(bucket, path, ctx);
  if (!filename || filename.length > 255 || /[/\\]/.test(filename)) {
    badRequest("Invalid filename");
  }
  const extension = imageExtensions[canonicalContentType(contentType)];
  if (bucket === "apps" && !extension) badRequest("Unsupported image type");
  const basename =
    bucket === "apps" ? `${nanoid()}.${extension}` : sanitizeFilename(filename);
  if (!basename || basename === "." || basename === "..")
    badRequest("Invalid filename");
  try {
    return normalizeKey([...path, basename]);
  } catch {
    return badRequest("Invalid filename");
  }
}

/** Completion repeats path checks; never authorize by a startsWith(teamId) comparison. */
export function authorizeCompletedKey(
  bucket: UploadBucket,
  key: string,
  ctx: UploadContext,
): string | undefined {
  try {
    if (normalizeKey(key) !== key) forbidden();
  } catch {
    forbidden();
  }
  const path = key.split("/");
  const filename = path.pop();
  if (!filename) forbidden();
  return authorizeUploadFolder(bucket, path, ctx);
}
