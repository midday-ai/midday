import type { InstitutionRecord } from "./institutions";
import { logoExists, uploadLogo } from "./utils/storage";

const CDN_PREFIX = "https://cdn-engine.midday.ai/";

type SyncLogosResult = {
  uploaded: number;
  skipped: number;
  failed: number;
};

type SyncLogosOptions = {
  concurrency?: number;
  delayMs?: number;
};

/**
 * Extract the R2 object key from a CDN URL.
 * e.g. "https://cdn-engine.midday.ai/SEB.png" -> "SEB.png"
 */
function extractR2Key(cdnUrl: string): string | null {
  if (!cdnUrl.startsWith(CDN_PREFIX)) {
    return null;
  }
  return cdnUrl.slice(CDN_PREFIX.length);
}

/**
 * Infer content type from file extension.
 */
function inferContentType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

/**
 * Download logo data from source.
 * Handles URLs, data URIs, and raw base64 strings (Plaid returns raw base64).
 */
async function downloadLogo(
  sourceUrl: string,
): Promise<{ buffer: Uint8Array; contentType: string } | null> {
  // Handle base64 data URIs
  if (sourceUrl.startsWith("data:")) {
    const match = sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const contentType = match[1]!;
    const buffer = Buffer.from(match[2]!, "base64");
    return { buffer, contentType };
  }

  // Handle raw base64 (Plaid returns base64-encoded PNGs without prefix)
  if (sourceUrl.startsWith("iVBOR")) {
    // PNG base64 header
    const buffer = Buffer.from(sourceUrl, "base64");
    return { buffer, contentType: "image/png" };
  }

  if (sourceUrl.startsWith("/9j/")) {
    // JPEG base64 header
    const buffer = Buffer.from(sourceUrl, "base64");
    return { buffer, contentType: "image/jpeg" };
  }

  // Download from URL
  if (sourceUrl.startsWith("http")) {
    const response = await fetch(sourceUrl);
    if (!response.ok) return null;

    const buffer = new Uint8Array(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { buffer, contentType };
  }

  return null;
}

/**
 * Sync institution logos to R2. Downloads from provider source URLs
 * and uploads to R2 if the logo doesn't already exist.
 *
 * Processes in batches with configurable concurrency and delay
 * between batches to avoid overwhelming providers or R2.
 */
export async function syncInstitutionLogos(
  institutions: InstitutionRecord[],
  options: SyncLogosOptions = {},
): Promise<SyncLogosResult> {
  const { concurrency = 10, delayMs = 200 } = options;

  // Deduplicate by logo CDN URL (e.g. EnableBanking personal/business share a logo)
  const uniqueLogos = new Map<string, { key: string; sourceLogo: string }>();

  for (const inst of institutions) {
    if (!inst.logo || !inst.sourceLogo) continue;

    const key = extractR2Key(inst.logo);
    if (!key) continue;

    if (!uniqueLogos.has(key)) {
      uniqueLogos.set(key, { key, sourceLogo: inst.sourceLogo });
    }
  }

  const entries = Array.from(uniqueLogos.values());
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);

    const results = await Promise.allSettled(
      batch.map(async ({ key, sourceLogo }) => {
        // Check if logo already exists in R2
        const exists = await logoExists(key);
        if (exists) {
          return "skipped" as const;
        }

        // Download from provider
        const data = await downloadLogo(sourceLogo);
        if (!data) {
          return "failed" as const;
        }

        // Upload to R2
        const contentType = inferContentType(key);
        await uploadLogo(key, data.buffer, contentType);
        return "uploaded" as const;
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        switch (result.value) {
          case "uploaded":
            uploaded++;
            break;
          case "skipped":
            skipped++;
            break;
          case "failed":
            failed++;
            break;
        }
      } else {
        failed++;
      }
    }

    // Delay between batches (skip after last batch)
    if (i + concurrency < entries.length && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { uploaded, skipped, failed };
}
