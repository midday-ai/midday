import { teamCache } from "@midday/cache/team-cache";
import type { Database } from "@midday/db/client";
import { hasTeamAccess } from "@midday/db/queries";
import { HTTPException } from "hono/http-exception";

/**
 * Normalize and validate file path
 * Extracts teamId from path and validates format
 */
export function normalizeAndValidatePath(filePath: string): {
  normalizedPath: string;
  pathTeamId: string;
  pathArray: string[];
} {
  // Normalize path
  const normalizedPath = filePath.startsWith("vault/")
    ? filePath.substring("vault/".length)
    : filePath;

  // Extract teamId from path and validate
  const pathParts = normalizedPath.split("/");
  const pathTeamId = pathParts[0];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!pathTeamId || !uuidRegex.test(pathTeamId)) {
    throw new HTTPException(400, {
      message:
        "Invalid file path format. Path must start with a valid teamId UUID.",
    });
  }

  return {
    normalizedPath,
    pathTeamId,
    pathArray: pathParts,
  };
}

/**
 * Validate user has access to team using cache
 * Uses team cache for fast lookups, falls back to efficient DB query on cache miss
 */
export async function validateTeamAccess(
  db: Database,
  userId: string,
  teamId: string,
): Promise<void> {
  const cacheKey = `user:${userId}:team:${teamId}`;
  let hasAccess = await teamCache.get(cacheKey);

  if (hasAccess === undefined) {
    // Cache miss - use efficient hasTeamAccess query (direct join, no user lookup)
    hasAccess = await hasTeamAccess(db, teamId, userId);
    await teamCache.set(cacheKey, hasAccess);
  }

  if (!hasAccess) {
    throw new HTTPException(403, {
      message: "Access denied. File does not belong to your team.",
    });
  }
}

/**
 * Get content type from filename extension
 */
export function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return contentTypes[ext || ""] || "application/octet-stream";
}
