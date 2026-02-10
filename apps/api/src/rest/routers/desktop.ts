import type { Context } from "@api/rest/types";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const app = new OpenAPIHono<Context>();

const GITHUB_REPO = "midday-ai/midday";
const GITHUB_API_LATEST_RELEASE = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const errorResponseSchema = z.object({
  error: z.string(),
});

const platformEntrySchema = z.object({
  signature: z.string(),
  url: z.string().url(),
});

const updateManifestSchema = z.object({
  version: z.string(),
  notes: z.string().optional(),
  pub_date: z.string().optional(),
  platforms: z.record(z.string(), platformEntrySchema),
});

const downloadQuerySchema = z.object({
  url: z
    .string()
    .url()
    .openapi({
      description: "The artifact download URL to proxy",
      example:
        "https://github.com/midday-ai/midday/releases/download/midday-v1.0.0/Midday.app.tar.gz",
      param: {
        in: "query",
        name: "url",
        required: true,
      },
    }),
});

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "Midday-Desktop-Updater",
  };

  if (process.env.GITHUB_RELEASE_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_RELEASE_TOKEN}`;
  }

  return headers;
}

// GET /update — Tauri updater endpoint
// Returns latest.json with download URLs rewritten to proxy through this API
app.openapi(
  createRoute({
    method: "get",
    path: "/update",
    summary: "Check for desktop app updates",
    operationId: "checkDesktopUpdate",
    "x-speakeasy-name-override": "checkUpdate",
    description:
      "Returns the latest desktop app version info in Tauri updater format. Download URLs are rewritten to proxy through this API.",
    tags: ["Desktop"],
    responses: {
      200: {
        description: "Update manifest in Tauri updater format",
        content: {
          "application/json": {
            schema: updateManifestSchema,
          },
        },
      },
      502: {
        description: "Failed to fetch update info from upstream",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    // Fetch the latest release metadata via GitHub API (works for private repos)
    const releaseRes = await fetch(GITHUB_API_LATEST_RELEASE, {
      headers: {
        ...getGitHubHeaders(),
        Accept: "application/vnd.github+json",
      },
    });

    if (!releaseRes.ok) {
      return c.json({ error: "Failed to fetch update info" }, 502);
    }

    const release = (await releaseRes.json()) as {
      assets?: { name: string; url: string }[];
    };

    // Find the latest.json asset in the release
    const latestJsonAsset = release.assets?.find(
      (a) => a.name === "latest.json",
    );

    if (!latestJsonAsset) {
      return c.json({ error: "No latest.json asset found in release" }, 502);
    }

    // Download the asset content via its API URL
    const assetRes = await fetch(latestJsonAsset.url, {
      headers: {
        ...getGitHubHeaders(),
        Accept: "application/octet-stream",
      },
    });

    if (!assetRes.ok) {
      return c.json({ error: "Failed to fetch update info" }, 502);
    }

    const data = await assetRes.json();
    const parsed = updateManifestSchema.safeParse(data);

    if (!parsed.success) {
      return c.json({ error: "Invalid update manifest format" }, 502);
    }

    const manifest = parsed.data;

    // Build the proxy base URL from the incoming request
    const requestUrl = new URL(c.req.url);
    const protocol =
      c.req.header("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
    const proxyBase = `${protocol}://${requestUrl.host}/desktop/update/download`;

    // Rewrite each platform's download URL to go through our proxy
    for (const [platform, entry] of Object.entries(manifest.platforms)) {
      manifest.platforms[platform] = {
        ...entry,
        url: `${proxyBase}?url=${encodeURIComponent(entry.url)}`,
      };
    }

    return c.json(manifest, 200, {
      "Cache-Control": "public, max-age=300",
    });
  },
);

// GET /update/download — Proxy artifact download from GitHub
app.openapi(
  createRoute({
    method: "get",
    path: "/update/download",
    summary: "Download desktop app update artifact",
    operationId: "downloadDesktopUpdate",
    "x-speakeasy-name-override": "downloadUpdate",
    description:
      "Proxies the download of a desktop app update artifact from GitHub releases. Only URLs pointing to the midday-ai/midday repository are accepted.",
    tags: ["Desktop"],
    request: {
      query: downloadQuerySchema,
    },
    responses: {
      200: {
        description: "Update artifact binary",
        content: {
          "application/octet-stream": {
            schema: {
              type: "string",
              format: "binary",
            },
          },
        },
      },
      400: {
        description: "Invalid download URL",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      502: {
        description: "Failed to download artifact from upstream",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { url } = c.req.valid("query");

    // Parse and normalize the URL to prevent path-traversal bypasses
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return c.json({ error: "Invalid download URL" }, 400);
    }

    // Allow both github.com release URLs and api.github.com asset URLs
    const isGitHubRelease =
      parsed.origin === "https://github.com" &&
      parsed.pathname.startsWith(`/${GITHUB_REPO}/releases/download/`);

    const isGitHubApiAsset =
      parsed.origin === "https://api.github.com" &&
      parsed.pathname.startsWith(`/repos/${GITHUB_REPO}/releases/assets/`);

    if (!isGitHubRelease && !isGitHubApiAsset) {
      return c.json({ error: "Invalid download URL" }, 400);
    }

    const response = await fetch(url, {
      headers: {
        ...getGitHubHeaders(),
        Accept: "application/octet-stream",
      },
    });

    if (!response.ok || !response.body) {
      return c.json({ error: "Failed to download artifact" }, 502);
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/octet-stream",
        ...(response.headers.get("content-length") && {
          "Content-Length": response.headers.get("content-length")!,
        }),
      },
    });
  },
);

export { app as desktopRouter };
