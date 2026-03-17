import { createAdminClient } from "@api/services/supabase";
import { download, signedUrl } from "@midday/supabase/storage";

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
