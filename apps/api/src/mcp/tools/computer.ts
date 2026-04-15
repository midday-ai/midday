import { enqueueRun } from "@midday/job-client";
import {
  createComputerAgent,
  createComputerRun,
  getComputerAgentBySlug,
  getComputerAgentForRun,
  getComputerAgents,
  getComputerRuns,
} from "@midday/db/queries";
import { z } from "zod";
import { CATALOG_AGENTS } from "../../rest/routers/computer/catalog";
import { generateAgentFromDescription } from "../../rest/routers/computer/orchestrator";
import {
  hasScope,
  READ_ONLY_ANNOTATIONS,
  WRITE_ANNOTATIONS,
  type RegisterTools,
} from "../types";
import { withErrorHandling } from "../utils";

export const registerComputerTools: RegisterTools = (server, ctx) => {
  const { db, teamId, userId } = ctx;

  const hasReadScope = hasScope(ctx, "teams.read");
  const hasWriteScope = hasScope(ctx, "teams.write");

  if (!hasReadScope) {
    return;
  }

  server.registerTool(
    "computer_catalog_list",
    {
      title: "List Agent Catalog",
      description:
        "List available pre-built AI agents that can be enabled to automate financial workflows (e.g. invoice chasing, expense monitoring, financial briefings). Returns name, description, and schedule for each.",
      inputSchema: {},
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const catalog = CATALOG_AGENTS.map(
        ({ code, ...rest }) => rest,
      );

      return {
        content: [{ type: "text" as const, text: JSON.stringify(catalog) }],
        structuredContent: { data: catalog },
      };
    }, "Failed to list agent catalog"),
  );

  server.registerTool(
    "computer_agents_list",
    {
      title: "List Team Agents",
      description:
        "List all AI agents enabled for the current team, including their ID, name, schedule, and enabled status. Use this to find an agent before running it or checking its history.",
      inputSchema: {},
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async () => {
      const agents = await getComputerAgents(db, { teamId });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(agents) }],
        structuredContent: { data: agents },
      };
    }, "Failed to list agents"),
  );

  if (!hasWriteScope) {
    return;
  }

  server.registerTool(
    "computer_agent_enable",
    {
      title: "Enable Catalog Agent",
      description:
        "Install and enable a pre-built agent from the catalog. Pass the templateId from computer_catalog_list. The agent starts running on its defined schedule immediately.",
      inputSchema: {
        templateId: z
          .string()
          .describe("The templateId of the catalog agent to enable"),
      },
      annotations: WRITE_ANNOTATIONS,
    },
    withErrorHandling(async ({ templateId }) => {
      const template = CATALOG_AGENTS.find(
        (a) => a.templateId === templateId,
      );

      if (!template) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Template "${templateId}" not found. Use computer_catalog_list to see available agents.`,
            },
          ],
          isError: true,
        };
      }

      const existing = await getComputerAgentBySlug(db, {
        teamId,
        slug: template.slug,
      });

      if (existing) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Agent "${template.name}" is already enabled (id: ${existing.id}).`,
            },
          ],
          isError: true,
        };
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
        createdBy: userId,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(agent) }],
        structuredContent: { data: agent },
      };
    }, "Failed to enable agent"),
  );

  server.registerTool(
    "computer_agent_generate",
    {
      title: "Generate Custom Agent",
      description:
        "Generate a custom AI agent from a natural language description. Returns a plan with the agent's name, schedule, code, and tools it will use. The user must review and confirm before deployment via computer_agent_confirm.",
      inputSchema: {
        description: z
          .string()
          .min(10)
          .describe(
            "Natural language description of what the agent should do, e.g. 'Every Monday, check for overdue invoices and send me a summary'",
          ),
      },
      annotations: WRITE_ANNOTATIONS,
    },
    withErrorHandling(async ({ description }) => {
      const result = await generateAgentFromDescription(description);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
        structuredContent: { data: result },
      };
    }, "Failed to generate agent"),
  );

  server.registerTool(
    "computer_agent_confirm",
    {
      title: "Deploy Generated Agent",
      description:
        "Deploy a previously generated agent after the user has reviewed and approved the plan. Pass the exact name, slug, code, and description returned by computer_agent_generate.",
      inputSchema: {
        name: z.string().describe("Agent display name"),
        slug: z.string().describe("URL-safe unique slug"),
        description: z.string().describe("What the agent does"),
        code: z.string().describe("Compiled JavaScript code from generation"),
        scheduleCron: z
          .string()
          .optional()
          .describe("Cron expression for scheduled runs"),
      },
      annotations: WRITE_ANNOTATIONS,
    },
    withErrorHandling(async ({ name, slug, description, code, scheduleCron }) => {
      const existing = await getComputerAgentBySlug(db, { teamId, slug });

      if (existing) {
        return {
          content: [
            {
              type: "text" as const,
              text: `An agent with slug "${slug}" already exists.`,
            },
          ],
          isError: true,
        };
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
        createdBy: userId,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(agent) }],
        structuredContent: { data: agent },
      };
    }, "Failed to deploy agent"),
  );

  server.registerTool(
    "computer_agent_run",
    {
      title: "Run Agent Now",
      description:
        "Trigger an immediate manual run of an agent. Returns the run ID which can be used to check status via computer_agent_runs.",
      inputSchema: {
        agentId: z.string().uuid().describe("The agent ID to run"),
      },
      annotations: WRITE_ANNOTATIONS,
    },
    withErrorHandling(async ({ agentId }) => {
      const agent = await getComputerAgentForRun(db, { id: agentId, teamId });

      if (!agent) {
        return {
          content: [{ type: "text" as const, text: "Agent not found." }],
          isError: true,
        };
      }

      if (!agent.enabled) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Agent is disabled. Enable it before triggering a run.",
            },
          ],
          isError: true,
        };
      }

      const runId = crypto.randomUUID();

      await createComputerRun(db, {
        id: runId,
        agentId,
        teamId,
      });

      await enqueueRun({
        agentId,
        teamId,
        runId,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ runId, status: "pending" }),
          },
        ],
        structuredContent: { data: { runId, status: "pending" } },
      };
    }, "Failed to run agent"),
  );

  server.registerTool(
    "computer_agent_runs",
    {
      title: "List Agent Runs",
      description:
        "List recent runs for a specific agent, including status, summary, errors, and timing. Use this to check what an agent found or whether a run completed successfully.",
      inputSchema: {
        agentId: z.string().uuid().describe("The agent ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(10)
          .describe("Number of runs to return (default 10)"),
      },
      annotations: READ_ONLY_ANNOTATIONS,
    },
    withErrorHandling(async ({ agentId, limit }) => {
      const runs = await getComputerRuns(db, {
        agentId,
        teamId,
        limit: limit ?? 10,
      });

      return {
        content: [{ type: "text" as const, text: JSON.stringify(runs) }],
        structuredContent: { data: runs },
      };
    }, "Failed to list agent runs"),
  );
};
