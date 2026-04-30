import type { Context } from "@api/rest/types";
import { enqueueReplay, enqueueRun } from "@midday/job-client";
import {
  approveComputerRun,
  createComputerAgent,
  createComputerRun,
  deleteComputerAgent,
  getComputerAgentBySlug,
  getComputerAgentForRun,
  getComputerAgentMemoryEntries,
  getComputerAgents,
  getComputerRunProposals,
  getComputerRunWithSteps,
  getComputerRuns,
  rejectComputerRun,
  updateComputerAgent,
} from "@midday/db/queries";
import { OpenAPIHono } from "@hono/zod-openapi";
import { generateAgentFromDescription } from "./computer/orchestrator";
import { CATALOG_AGENTS } from "./computer/catalog";

const app = new OpenAPIHono<Context>();

app.get("/catalog", async (c) => {
  return c.json({
    data: CATALOG_AGENTS.map(({ code, ...rest }) => rest),
  });
});

app.get("/agents", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");

  const agents = await getComputerAgents(db, { teamId });

  return c.json({ data: agents });
});

app.post("/agents", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const body = await c.req.json();

  const { templateId } = body as { templateId?: string };

  if (!templateId) {
    return c.json({ error: "templateId is required" }, 400);
  }

  const template = CATALOG_AGENTS.find((a) => a.templateId === templateId);
  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  const existing = await getComputerAgentBySlug(db, {
    teamId,
    slug: template.slug,
  });

  if (existing) {
    return c.json({ error: "Agent already enabled", id: existing.id }, 409);
  }

  const agent = await createComputerAgent(db, {
    teamId,
    name: template.name,
    slug: template.slug,
    description: template.description,
    source: "catalog",
    code: template.code,
    templateId: template.templateId,
    scheduleCron: template.scheduleCron,
    enabled: true,
    createdBy: session.user.id,
  });

  return c.json({ data: agent }, 201);
});

app.post("/generate", async (c) => {
  const body = await c.req.json();
  const { description } = body as { description?: string };

  if (!description || description.trim().length < 10) {
    return c.json(
      { error: "Description must be at least 10 characters" },
      400,
    );
  }

  try {
    const result = await generateAgentFromDescription(description);
    return c.json({ data: result });
  } catch (error) {
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate agent",
      },
      500,
    );
  }
});

app.post("/agents/confirm", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const session = c.get("session");
  const body = await c.req.json();

  const { name, slug, description, code, scheduleCron } = body as {
    name: string;
    slug: string;
    description: string;
    code: string;
    scheduleCron?: string;
  };

  if (!name || !slug || !code) {
    return c.json({ error: "name, slug, and code are required" }, 400);
  }

  const existing = await getComputerAgentBySlug(db, { teamId, slug });

  if (existing) {
    return c.json({ error: "An agent with this slug already exists" }, 409);
  }

  const agent = await createComputerAgent(db, {
    teamId,
    name,
    slug,
    description,
    source: "generated",
    code,
    scheduleCron: scheduleCron ?? null,
    enabled: true,
    createdBy: session.user.id,
  });

  return c.json({ data: agent }, 201);
});

app.put("/agents/:id", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id } = c.req.param();
  const body = await c.req.json();

  const { enabled, scheduleCron, config } = body as {
    enabled?: boolean;
    scheduleCron?: string;
    config?: Record<string, unknown>;
  };

  const updated = await updateComputerAgent(db, {
    id,
    teamId,
    enabled,
    scheduleCron,
    config,
  });

  if (!updated) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({ data: updated });
});

app.delete("/agents/:id", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id } = c.req.param();

  const deleted = await deleteComputerAgent(db, { id, teamId });

  if (!deleted) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({ success: true });
});

app.post("/agents/:id/run", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id } = c.req.param();

  const agent = await getComputerAgentForRun(db, { id, teamId });

  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  if (!agent.enabled) {
    return c.json({ error: "Agent is disabled. Enable it before triggering a run." }, 400);
  }

  const runId = crypto.randomUUID();

  await createComputerRun(db, {
    id: runId,
    agentId: agent.id,
    teamId,
  });

  await enqueueRun({
    agentId: agent.id,
    teamId,
    runId,
  });

  return c.json({ data: { runId } }, 202);
});

app.get("/agents/:id/runs", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id } = c.req.param();
  const limit = Number(c.req.query("limit") || "20");

  const runs = await getComputerRuns(db, { agentId: id, teamId, limit });

  return c.json({ data: runs });
});

app.get("/agents/:id/runs/:runId", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id, runId } = c.req.param();

  const run = await getComputerRunWithSteps(db, {
    runId,
    agentId: id,
    teamId,
  });

  if (!run) {
    return c.json({ error: "Run not found" }, 404);
  }

  return c.json({ data: run });
});

app.get("/agents/:id/runs/:runId/proposals", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id, runId } = c.req.param();

  const run = await getComputerRunProposals(db, {
    runId,
    agentId: id,
    teamId,
  });

  if (!run) {
    return c.json({ error: "No pending proposals found for this run" }, 404);
  }

  return c.json({
    data: {
      runId: run.id,
      status: run.status,
      actions: run.proposedActions ?? [],
    },
  });
});

app.post("/agents/:id/runs/:runId/approve", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id, runId } = c.req.param();
  const body = await c.req.json().catch(() => ({}));
  const { actions: approvedIndices } = body as { actions?: number[] };

  const proposal = await getComputerRunProposals(db, {
    runId,
    agentId: id,
    teamId,
  });

  if (!proposal) {
    return c.json({ error: "No pending proposals found for this run" }, 404);
  }

  const updated = await approveComputerRun(db, {
    runId,
    approvedIndices: approvedIndices ?? undefined,
  });

  if (!updated) {
    return c.json({ error: "Failed to approve run" }, 500);
  }

  const approvedActions = updated.proposedActions as Array<{
    tool: string;
    args: Record<string, unknown>;
    description?: string;
  }>;

  await enqueueReplay({
    runId,
    agentId: id,
    teamId,
    actions: approvedActions,
  });

  return c.json({
    data: {
      runId,
      status: "approved",
      actionsQueued: approvedActions.length,
    },
  });
});

app.post("/agents/:id/runs/:runId/reject", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id, runId } = c.req.param();

  const proposal = await getComputerRunProposals(db, {
    runId,
    agentId: id,
    teamId,
  });

  if (!proposal) {
    return c.json({ error: "No pending proposals found for this run" }, 404);
  }

  const result = await rejectComputerRun(db, { runId });

  if (!result) {
    return c.json({ error: "Failed to reject run" }, 500);
  }

  return c.json({ data: { runId, status: "rejected" } });
});

app.get("/agents/:id/memory", async (c) => {
  const db = c.get("db");
  const teamId = c.get("teamId");
  const { id } = c.req.param();

  const memory = await getComputerAgentMemoryEntries(db, {
    agentId: id,
    teamId,
  });

  return c.json({ data: memory });
});

export const computerRouter = app;
