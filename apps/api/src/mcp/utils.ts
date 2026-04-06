import { createAdminClient } from "@api/services/supabase";
import { TZDate } from "@date-fns/tz";
import { download, signedUrl } from "@midday/supabase/storage";
import {
  format,
  getQuarter,
  isValid,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { z } from "zod";

export interface DateContext {
  date: string;
  year: number;
  quarter: number;
  monthStart: string;
  quarterStart: string;
  yearStart: string;
  timezone: string;
}

/**
 * Resolve the current date in the user's timezone (falls back to UTC)
 * and return pre-computed date strings for common ranges.
 */
export function getDateContext(timezone: string | null): DateContext {
  const tz = timezone ?? "UTC";
  const now = new TZDate(new Date(), tz);
  const fmt = "yyyy-MM-dd";

  return {
    date: format(now, fmt),
    year: now.getFullYear(),
    quarter: getQuarter(now),
    monthStart: format(startOfMonth(now), fmt),
    quarterStart: format(startOfQuarter(now), fmt),
    yearStart: format(startOfYear(now), fmt),
    timezone: tz,
  };
}

export const DASHBOARD_URL =
  process.env.MIDDAY_DASHBOARD_URL || "https://app.midday.ai";

export const MCP_TEXT_LIMIT = 25_000;

interface PaginatedResponse<T> {
  [key: string]: unknown;
  meta: {
    cursor?: string | null;
    hasNextPage: boolean;
    [key: string]: unknown;
  };
  data: T[];
}

/**
 * Shrink a paginated list response until its JSON serialization fits
 * within MCP_TEXT_LIMIT.  Drops items from the end and appends a
 * truncation hint so the agent knows to paginate.
 */
export function truncateListResponse<T>(response: PaginatedResponse<T>): {
  text: string;
  structuredContent: PaginatedResponse<T>;
} {
  let text = JSON.stringify(response);

  if (text.length <= MCP_TEXT_LIMIT) {
    return { text, structuredContent: response };
  }

  const data = [...response.data];
  while (data.length > 1 && text.length > MCP_TEXT_LIMIT) {
    data.pop();
    text = JSON.stringify({
      ...response,
      meta: {
        ...response.meta,
        hasNextPage: true,
        truncated: true,
        returnedItems: data.length,
      },
      data,
    });
  }

  const result: PaginatedResponse<T> = {
    ...response,
    meta: {
      ...response.meta,
      hasNextPage: true,
      truncated: true,
      returnedItems: data.length,
      hint: "Response truncated to fit context limits. Use cursor or narrow your filters to see more results.",
    },
    data: [...data],
  };
  text = JSON.stringify(result);

  return { text, structuredContent: result };
}

/**
 * Convert plain text into TipTap EditorDoc JSON structure.
 * Each line becomes a paragraph node; empty lines produce empty paragraphs.
 */
export function textToEditorDoc(text: string) {
  return {
    type: "doc" as const,
    content: text.split("\n").map((line) => ({
      type: "paragraph" as const,
      content: line ? [{ type: "text" as const, text: line }] : [],
    })),
  };
}

/**
 * Wrap a tool handler with try/catch to return graceful `isError` responses
 * instead of propagating unhandled exceptions through the transport.
 */
export function withErrorHandling<Args extends unknown[], R>(
  handler: (...args: Args) => Promise<R>,
  fallbackMessage: string,
): (...args: Args) => Promise<R> {
  return (async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: error instanceof Error ? error.message : fallbackMessage,
          },
        ],
        isError: true,
      } as R;
    }
  }) as (...args: Args) => Promise<R>;
}

export type TextContent = { type: "text"; text: string };
export type ResourceContent = {
  type: "resource";
  resource: { uri: string; mimeType: string; blob: string };
};
export type McpContent = TextContent | ResourceContent;

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  return MIME_TYPES[ext || ""] || "application/octet-stream";
}

/**
 * Generate a presigned Supabase storage URL for a vault file.
 * Expires after 1 hour.
 */
export async function getVaultSignedUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = await createAdminClient();
  const { data, error } = await signedUrl(supabase, {
    bucket: "vault",
    path: storagePath,
    expireIn: SIGNED_URL_EXPIRY,
  });

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * Download a file from Supabase vault storage and return it as
 * a base64-encoded MCP EmbeddedResource content item.
 */
export async function downloadVaultFile(
  storagePath: string,
  uri: string,
  mimeType: string,
): Promise<ResourceContent | null> {
  const supabase = await createAdminClient();
  const { data } = await download(supabase, {
    bucket: "vault",
    path: storagePath,
  });

  if (!data) return null;

  const buffer = await data.arrayBuffer();
  const blob = Buffer.from(buffer).toString("base64");

  return {
    type: "resource",
    resource: { uri, mimeType, blob },
  };
}

/**
 * Render a stream (e.g. from PDF generation) to a base64-encoded
 * MCP EmbeddedResource content item.
 */
export async function streamToResource(
  stream: ReadableStream | NodeJS.ReadableStream,
  uri: string,
  mimeType: string,
): Promise<ResourceContent> {
  const response = new Response(stream as any);
  const buffer = await response.arrayBuffer();
  const blob = Buffer.from(buffer).toString("base64");

  return {
    type: "resource",
    resource: { uri, mimeType, blob },
  };
}

const HAS_TZ = /(?:Z|[+-]\d{2}:?\d{2})$/;

/**
 * Accept any ISO 8601-ish datetime string and return a canonical
 * UTC ISO string (always ending in Z).  Strings without timezone
 * info are assumed to be UTC — we append `Z` *before* parsing so
 * `date-fns/parseISO` doesn't interpret them as local time.
 */
export function normalizeDateTime(value: string): string {
  let trimmed = value.trim();
  if (!HAS_TZ.test(trimmed)) {
    trimmed = `${trimmed}Z`;
  }
  const parsed = parseISO(trimmed);
  if (!isValid(parsed)) {
    throw new Error(
      `Invalid datetime: "${value}". Use ISO 8601 format, e.g. 2024-04-15T09:00:00Z`,
    );
  }
  return parsed.toISOString();
}

/**
 * Lenient Zod schema for MCP tool datetime inputs.
 * Accepts any ISO 8601 string; the handler should run
 * `normalizeDateTime()` before passing to the DB layer.
 */
export const lenientDateTimeSchema = z
  .string()
  .describe(
    "ISO 8601 datetime (e.g. 2024-04-15T09:00:00Z). Timezone-naive strings are treated as UTC.",
  );
