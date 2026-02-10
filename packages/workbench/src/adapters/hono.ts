import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Queue } from "bullmq";
import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";
import { cors } from "hono/cors";
import { createApiRoutes } from "../api/router";
import type { WorkbenchOptions } from "../core/types";
import { WorkbenchCore } from "../core/workbench";

// Get the directory where this module is located
const __dirname = dirname(fileURLToPath(import.meta.url));
const UI_DIST_PATH = join(__dirname, "..", "ui");

/**
 * Create a Workbench Hono app
 *
 * @example
 * ```typescript
 * // Minimal - just pass queues
 * app.route("/jobs", workbench([inboxQueue, transactionsQueue]));
 *
 * // With options
 * app.route("/jobs", workbench({
 *   queues: [inboxQueue, transactionsQueue],
 *   auth: { username: "admin", password: "secret" },
 *   title: "My Jobs",
 * }));
 * ```
 */
export function workbench(options: WorkbenchOptions | Queue[]): Hono {
  const core = new WorkbenchCore(options);
  const app = new Hono();

  // Enable CORS for API requests
  app.use("/api/*", cors());

  // Add basic auth if configured
  if (core.requiresAuth()) {
    app.use(
      "*",
      basicAuth({
        username: core.options.auth!.username,
        password: core.options.auth!.password,
      }),
    );
  }

  // Mount API routes
  const apiRoutes = createApiRoutes(core);
  app.route("/api", apiRoutes);

  // Serve UI config
  app.get("/config", (c) => {
    return c.json(core.getConfig());
  });

  // Serve static assets from built UI
  app.get("/assets/:file", async (c) => {
    const fileName = c.req.param("file");
    const filePath = join(UI_DIST_PATH, "assets", fileName);

    if (!existsSync(filePath)) {
      return c.text("Not found", 404);
    }

    const content = readFileSync(filePath);
    const contentType = fileName.endsWith(".js")
      ? "application/javascript"
      : fileName.endsWith(".css")
        ? "text/css"
        : "application/octet-stream";

    return c.body(content, 200, { "Content-Type": contentType });
  });

  // Serve index.html for all other routes (SPA)
  app.get("*", async (c) => {
    const indexPath = join(UI_DIST_PATH, "index.html");

    // Calculate the base path by removing known client-side routes
    const url = new URL(c.req.url);
    let basePath = url.pathname;

    // Strip known client-side routes to get the mount path
    // Routes: /, /metrics, /schedulers, /flows, /flows/:queueName/:jobId, /test, /queues/:name, /queues/:name/jobs/:id
    const clientRoutes = [
      /\/queues\/[^/]+\/jobs\/[^/]+\/?$/,
      /\/queues\/[^/]+\/?$/,
      /\/flows\/[^/]+\/[^/]+\/?$/,
      /\/schedulers\/?$/,
      /\/flows\/?$/,
      /\/metrics\/?$/,
      /\/test\/?$/,
    ];

    for (const route of clientRoutes) {
      basePath = basePath.replace(route, "");
    }

    // Ensure basePath ends with / for proper relative resolution
    if (!basePath.endsWith("/")) {
      basePath = `${basePath}/`;
    }

    if (existsSync(indexPath)) {
      let html = readFileSync(indexPath, "utf-8");
      // Inject base tag for proper relative URL resolution
      html = html.replace("<head>", `<head>\n    <base href="${basePath}">`);
      return c.html(html);
    }

    // Fallback to inline HTML if UI not built
    const html = getIndexHtml(core.options.title || "Workbench", basePath);
    return c.html(html);
  });

  return app;
}

/**
 * Generate fallback index.html when UI is not built
 */
function getIndexHtml(title: string, basePath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <base href="${basePath}">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: #0a0a0a;
        color: #fafafa;
      }
      .message {
        text-align: center;
        padding: 2rem;
      }
      code {
        background: #1a1a1a;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        display: block;
        margin-top: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="message">
      <h1>${title}</h1>
      <p>UI assets not found. Build the UI first:</p>
      <code>cd packages/workbench &amp;&amp; bun run build:ui</code>
    </div>
  </body>
</html>`;
}

export type { WorkbenchOptions };
