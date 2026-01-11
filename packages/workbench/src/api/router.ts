import { Hono } from "hono";
import type {
  CreateFlowRequest,
  JobStatus,
  SortOptions,
  TestJobRequest,
} from "../core/types";
import type { WorkbenchCore } from "../core/workbench";

/**
 * Parse sort query param in format "field:direction" (e.g., "timestamp:desc")
 * Defaults to desc if direction not specified
 */
function parseSort(sort?: string): SortOptions | undefined {
  if (!sort) return undefined;
  const [field, dir] = sort.split(":");
  if (!field) return undefined;
  return {
    field,
    direction: dir === "asc" ? "asc" : "desc",
  };
}

/**
 * Create API routes for Workbench
 */
export function createApiRoutes(core: WorkbenchCore): Hono {
  const app = new Hono();
  const qm = core.queueManager;

  // POST /api/refresh - Clear all caches (for user-initiated refresh)
  app.post("/refresh", async (c) => {
    qm.clearCache();
    return c.json({ success: true });
  });

  // GET /api/overview - Dashboard stats
  app.get("/overview", async (c) => {
    const stats = await qm.getOverview();
    return c.json(stats);
  });

  // GET /api/counts - Lightweight job counts for smart polling
  // Returns just total counts per status, very fast (cached)
  app.get("/counts", async (c) => {
    const counts = await qm.getQuickCounts();
    return c.json(counts);
  });

  // GET /api/runs - All jobs across all queues
  // Note: Sorting on non-timestamp fields requires in-memory sort (limited to ~1000 jobs)
  // For timestamp sorting, Redis's natural order is used efficiently
  app.get("/runs", async (c) => {
    const limit = Number(c.req.query("limit")) || 50;
    const cursor = c.req.query("cursor");
    const start = cursor ? Number(cursor) : 0;
    const sort = parseSort(c.req.query("sort"));

    // Parse filter parameters
    const status = c.req.query("status") as JobStatus | undefined;
    const q = c.req.query("q"); // Text search
    const from = c.req.query("from"); // Time range start
    const to = c.req.query("to"); // Time range end
    const tagsParam = c.req.query("tags"); // Tags as JSON string or key:value pairs

    // Parse tags filter
    let tags: Record<string, string> | undefined;
    if (tagsParam) {
      try {
        // Try parsing as JSON first
        tags = JSON.parse(tagsParam);
      } catch {
        // If not JSON, try parsing as key:value pairs
        const tagPairs = tagsParam.split(",");
        tags = {};
        for (const pair of tagPairs) {
          const [key, value] = pair.split(":");
          if (key && value) {
            tags[key.trim()] = value.trim();
          }
        }
      }
    }

    // Parse time range
    let timeRange: { start: number; end: number } | undefined;
    if (from && to) {
      timeRange = {
        start: Number(from),
        end: Number(to),
      };
    }

    // Parse text search from q parameter
    // The q parameter might contain both text and tags, so we extract text
    let text: string | undefined;
    if (q) {
      // Simple extraction - if q doesn't contain colons, it's text search
      // Otherwise, tags are already parsed above
      if (!q.includes(":")) {
        text = q;
      } else {
        // If q contains colons, try to extract text part
        // This is a simplified approach - could be enhanced
        const parts = q.split(" ");
        const textParts = parts.filter((p) => !p.includes(":"));
        if (textParts.length > 0) {
          text = textParts.join(" ");
        }
      }
    }

    const filters =
      status || tags || text || timeRange
        ? {
            status,
            tags,
            text,
            timeRange,
          }
        : undefined;

    const result = await qm.getAllRuns(limit, start, sort, filters);
    return c.json(result);
  });

  // GET /api/schedulers - Repeatable and delayed jobs
  // Supports separate sort for each table: repeatableSort=name:asc, delayedSort=processAt:desc
  app.get("/schedulers", async (c) => {
    const repeatableSort = parseSort(c.req.query("repeatableSort"));
    const delayedSort = parseSort(c.req.query("delayedSort"));

    const result = await qm.getSchedulers(repeatableSort, delayedSort);
    return c.json(result);
  });

  // POST /api/test - Enqueue a test job
  app.post("/test", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const body = await c.req.json<TestJobRequest>();

    if (!body.queueName || !body.jobName) {
      return c.json({ error: "queueName and jobName are required" }, 400);
    }

    try {
      const result = await qm.enqueueJob(body);
      return c.json(result);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  });

  // GET /api/queue-names - List just queue names (fast, no counts)
  app.get("/queue-names", (c) => {
    const names = qm.getQueueNames();
    return c.json(names);
  });

  // GET /api/queues - List all queues with counts
  app.get("/queues", async (c) => {
    const queues = await qm.getQueues();
    return c.json(queues);
  });

  // GET /api/metrics - Get 24-hour metrics
  app.get("/metrics", async (c) => {
    const metrics = await qm.getMetrics();
    return c.json(metrics);
  });

  // GET /api/activity - Get 7-day activity stats for timeline
  app.get("/activity", async (c) => {
    const stats = await qm.getActivityStats();
    return c.json(stats);
  });

  // GET /api/queues/:name/jobs - List jobs for a queue
  // Note: Sorting on non-timestamp fields requires in-memory sort
  app.get("/queues/:name/jobs", async (c) => {
    const { name } = c.req.param();
    const status = c.req.query("status") as JobStatus | undefined;
    const limit = Number(c.req.query("limit")) || 50;
    const cursor = c.req.query("cursor");
    const start = cursor ? Number(cursor) : 0;
    const sort = parseSort(c.req.query("sort"));

    const result = await qm.getJobs(name, status, limit, start, sort);
    return c.json(result);
  });

  // GET /api/jobs/:queue/:id - Get single job
  app.get("/jobs/:queue/:id", async (c) => {
    const { queue, id } = c.req.param();
    const job = await qm.getJob(queue, id);

    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    return c.json(job);
  });

  // POST /api/jobs/:queue/:id/retry - Retry a job
  app.post("/jobs/:queue/:id/retry", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { queue, id } = c.req.param();
    const success = await qm.retryJob(queue, id);

    if (!success) {
      return c.json({ error: "Failed to retry job" }, 400);
    }

    return c.json({ success: true });
  });

  // POST /api/jobs/:queue/:id/remove - Remove a job
  app.post("/jobs/:queue/:id/remove", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { queue, id } = c.req.param();
    const success = await qm.removeJob(queue, id);

    if (!success) {
      return c.json({ error: "Failed to remove job" }, 400);
    }

    return c.json({ success: true });
  });

  // POST /api/jobs/:queue/:id/promote - Promote a delayed job
  app.post("/jobs/:queue/:id/promote", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { queue, id } = c.req.param();
    const success = await qm.promoteJob(queue, id);

    if (!success) {
      return c.json({ error: "Failed to promote job" }, 400);
    }

    return c.json({ success: true });
  });

  // GET /api/search - Search jobs
  app.get("/search", async (c) => {
    const query = c.req.query("q") || "";
    const limit = Number(c.req.query("limit")) || 20;

    if (!query) {
      return c.json({ results: [] });
    }

    const results = await qm.search(query, limit);
    return c.json({ results });
  });

  // GET /api/tags/:field/values - Get unique values for a tag field
  app.get("/tags/:field/values", async (c) => {
    const { field } = c.req.param();
    const limit = Number(c.req.query("limit")) || 50;

    // Check if this is a configured tag field
    const tagFields = qm.getTagFields();
    if (tagFields.length > 0 && !tagFields.includes(field)) {
      return c.json(
        { error: `Field "${field}" is not a configured tag field` },
        400,
      );
    }

    const values = await qm.getTagValues(field, limit);
    return c.json({ field, values });
  });

  // POST /api/queues/:name/clean - Clean jobs
  app.post("/queues/:name/clean", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { name } = c.req.param();
    const body = await c.req.json<{
      status: "completed" | "failed";
      grace?: number;
    }>();

    const count = await qm.cleanJobs(name, body.status, body.grace || 0);
    return c.json({ removed: count });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Bulk Operations
  // ─────────────────────────────────────────────────────────────────────────────

  // POST /api/bulk/retry - Retry multiple jobs
  app.post("/bulk/retry", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const body = await c.req.json<{
      jobs: { queueName: string; jobId: string }[];
    }>();

    const result = await qm.bulkRetry(body.jobs);
    return c.json(result);
  });

  // POST /api/bulk/delete - Delete multiple jobs
  app.post("/bulk/delete", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const body = await c.req.json<{
      jobs: { queueName: string; jobId: string }[];
    }>();

    const result = await qm.bulkDelete(body.jobs);
    return c.json(result);
  });

  // POST /api/bulk/promote - Promote multiple delayed jobs
  app.post("/bulk/promote", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const body = await c.req.json<{
      jobs: { queueName: string; jobId: string }[];
    }>();

    const result = await qm.bulkPromote(body.jobs);
    return c.json(result);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Queue Control (Pause/Resume)
  // ─────────────────────────────────────────────────────────────────────────────

  // POST /api/queues/:name/pause - Pause a queue
  app.post("/queues/:name/pause", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { name } = c.req.param();
    try {
      await qm.pauseQueue(name);
      return c.json({ success: true, paused: true });
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to pause queue",
        },
        404,
      );
    }
  });

  // POST /api/queues/:name/resume - Resume a queue
  app.post("/queues/:name/resume", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const { name } = c.req.param();
    try {
      await qm.resumeQueue(name);
      return c.json({ success: true, paused: false });
    } catch (error) {
      return c.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to resume queue",
        },
        404,
      );
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Flow Operations
  // ─────────────────────────────────────────────────────────────────────────────

  // GET /api/flows - List all flows
  app.get("/flows", async (c) => {
    const limit = Number(c.req.query("limit")) || 50;
    const flows = await qm.getFlows(limit);
    return c.json({ flows });
  });

  // GET /api/flows/:queueName/:jobId - Get a single flow tree
  app.get("/flows/:queueName/:jobId", async (c) => {
    const { queueName, jobId } = c.req.param();
    const flow = await qm.getFlow(queueName, jobId);

    if (!flow) {
      return c.json({ error: "Flow not found" }, 404);
    }

    return c.json(flow);
  });

  // POST /api/flows - Create a new flow
  app.post("/flows", async (c) => {
    if (core.options.readonly) {
      return c.json({ error: "Dashboard is in readonly mode" }, 403);
    }

    const body = await c.req.json<CreateFlowRequest>();

    if (!body.name || !body.queueName || !body.children?.length) {
      return c.json(
        { error: "name, queueName, and children are required" },
        400,
      );
    }

    try {
      const result = await qm.createFlow(body);
      return c.json(result);
    } catch (e) {
      return c.json({ error: (e as Error).message }, 400);
    }
  });

  return app;
}
