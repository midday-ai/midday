import readline from "node:readline";
import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable } from "../../output/table.js";
import { createSpinner, withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  source: string;
  templateId?: string | null;
  scheduleCron?: string | null;
  enabled: boolean;
  createdAt: string;
}

interface CatalogAgent {
  templateId: string;
  name: string;
  slug: string;
  description: string;
  scheduleCron: string;
}

interface Run {
  id: string;
  status: string;
  summary: string | null;
  error: string | null;
  toolCallCount: number;
  llmCallCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface GeneratedAgent {
  name: string;
  slug: string;
  description: string;
  scheduleCron: string | null;
  plan: string[];
  toolsUsed: string[];
  code: string;
}

interface MemoryEntry {
  id: string;
  key: string;
  content: string;
  type: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

export function createComputerCommand(): Command {
  const cmd = new Command("computer").description(
    "Midday Computer — create and manage autonomous agents",
  );

  // Default action: list agents
  cmd.action(async () => {
    const globals = cmd.parent?.opts() as GlobalFlags;
    const format = resolveFormat(globals);

    try {
      const data = await withSpinner(
        "Fetching agents...",
        () =>
          get<{ data: Agent[] }>(
            "/computer/agents",
            {},
            {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            },
          ),
        globals.quiet,
      );

      if (format === "json") {
        printJsonList(data.data);
        return;
      }

      if (data.data.length === 0) {
        console.log(
          chalk.dim(
            "\n  No agents enabled yet. Try:\n\n" +
              '    midday computer create "your workflow description"\n' +
              "    midday computer catalog\n",
          ),
        );
        return;
      }

      printTable({
        title: "Midday Computer",
        head: ["ID", "Name", "Slug", "Source", "Schedule", "Enabled"],
        rows: data.data.map((a) => [
          chalk.dim(a.id.slice(0, 8)),
          a.name,
          a.slug,
          a.source,
          a.scheduleCron || "manual",
          a.enabled ? chalk.green("●") : chalk.dim("○"),
        ]),
      });
    } catch (error) {
      handleError(error, format);
    }
  });

  // midday computer create "..."
  cmd
    .command("create <description>")
    .description("Create an agent from a natural language description")
    .addHelpText(
      "after",
      `
Examples:
  midday computer create "Every Friday check unbilled hours and draft invoices"
  midday computer create "Alert me when any single expense exceeds 5000"
  midday computer create "Weekly summary of revenue, expenses, and outstanding invoices"`,
    )
    .action(async (description: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        console.log(chalk.dim("\n  Creating workflow...\n"));

        const result = await withSpinner(
          "Generating agent...",
          () =>
            post<{ data: GeneratedAgent }>(
              "/computer/generate",
              { description },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const agent = result.data;

        if (format === "json") {
          printJson(agent);
          return;
        }

        console.log(chalk.bold(`  ━━━ ${agent.name} ━━━`));
        console.log(
          chalk.dim("  Schedule: ") +
            (agent.scheduleCron || "manual trigger only"),
        );
        console.log(chalk.dim("  Tools: ") + agent.toolsUsed.join(", "));
        console.log();
        console.log(chalk.dim("  Plan:"));
        for (let i = 0; i < agent.plan.length; i++) {
          console.log(`  ${i + 1}. ${agent.plan[i]}`);
        }
        console.log();

        // Auto-confirm in agent mode or --yes flag
        if (globals.yes || globals.agent) {
          await withSpinner(
            "Enabling agent...",
            () =>
              post<{ data: Agent }>(
                "/computer/agents/confirm",
                {
                  name: agent.name,
                  slug: agent.slug,
                  description: agent.description,
                  code: agent.code,
                  scheduleCron: agent.scheduleCron,
                },
                { apiUrl: globals.apiUrl, debug: globals.debug },
              ),
            globals.quiet,
          );

          console.log(
            chalk.green("  ✓ Enabled.") +
              (agent.scheduleCron
                ? chalk.dim(` Scheduled: ${agent.scheduleCron}`)
                : ""),
          );
          return;
        }

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question(
            chalk.bold("  Enable this agent? ") + chalk.dim("(y/n) "),
            resolve,
          );
        });
        rl.close();

        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          await withSpinner(
            "Enabling agent...",
            () =>
              post<{ data: Agent }>(
                "/computer/agents/confirm",
                {
                  name: agent.name,
                  slug: agent.slug,
                  description: agent.description,
                  code: agent.code,
                  scheduleCron: agent.scheduleCron,
                },
                { apiUrl: globals.apiUrl, debug: globals.debug },
              ),
            globals.quiet,
          );

          console.log(
            chalk.green("\n  ✓ Enabled.") +
              (agent.scheduleCron
                ? chalk.dim(` Scheduled: ${agent.scheduleCron}`)
                : ""),
          );
        } else {
          console.log(chalk.dim("\n  Cancelled."));
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer catalog
  cmd
    .command("catalog")
    .description("List available pre-built agents")
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching catalog...",
          () =>
            get<{ data: CatalogAgent[] }>(
              "/computer/catalog",
              {},
              {
                apiUrl: globals.apiUrl,
                debug: globals.debug,
              },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJsonList(data.data);
          return;
        }

        console.log(chalk.bold("\n  Available Agents\n"));
        for (const agent of data.data) {
          console.log(
            `  ${chalk.cyan(agent.slug.padEnd(25))} ${agent.description}`,
          );
          console.log(
            chalk.dim(`  ${"".padEnd(25)} Schedule: ${agent.scheduleCron}`),
          );
          console.log();
        }
        console.log(
          chalk.dim("  Enable with: midday computer enable <slug>\n"),
        );
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer enable <slug>
  cmd
    .command("enable <templateId>")
    .description("Enable a catalog agent")
    .action(async (templateId: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          `Enabling ${templateId}...`,
          () =>
            post<{ data: Agent }>(
              "/computer/agents",
              { templateId },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data.data);
          return;
        }

        console.log(
          chalk.green(`\n  ✓ ${data.data.name} enabled.`) +
            (data.data.scheduleCron
              ? chalk.dim(` Schedule: ${data.data.scheduleCron}`)
              : ""),
        );
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer disable <slug>
  cmd
    .command("disable <id>")
    .description("Disable an agent")
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Disabling agent...",
          () =>
            put<{ data: Agent }>(
              `/computer/agents/${id}`,
              { enabled: false },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data.data);
          return;
        }

        console.log(chalk.yellow(`\n  ○ ${data.data.name} disabled.`));
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer run <id>
  cmd
    .command("run <id>")
    .description("Manually trigger an agent run")
    .option("--wait", "Wait for the run to complete and show results")
    .action(async (id: string, opts: { wait?: boolean }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Triggering run...",
          () =>
            post<{ data: { runId: string } }>(
              `/computer/agents/${id}/run`,
              {},
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const { runId } = data.data;

        if (!opts.wait) {
          if (format === "json") {
            printJson(data.data);
            return;
          }
          console.log(
            chalk.green("\n  ✓ Run triggered.") +
              chalk.dim(` Run ID: ${runId}`),
          );
          return;
        }

        const spinner = createSpinner("Running agent...", globals.quiet);
        spinner.start();
        const startTime = Date.now();
        const POLL_INTERVAL = 2000;
        const TIMEOUT = 120_000;
        let run: Run | null = null;

        while (Date.now() - startTime < TIMEOUT) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          spinner.text = `Running agent... ${elapsed}s`;

          try {
            const result = await get<{ data: Run }>(
              `/computer/agents/${id}/runs/${runId}`,
              {},
              { apiUrl: globals.apiUrl, debug: globals.debug },
            );
            run = result.data;
            if (
              run.status === "completed" ||
              run.status === "failed" ||
              run.status === "waiting_approval"
            ) {
              break;
            }
          } catch {
            // transient error, keep polling
          }
        }

        if (!run || (run.status !== "completed" && run.status !== "failed" && run.status !== "waiting_approval")) {
          spinner.warn("Run still in progress (timed out waiting)");
          console.log(chalk.dim(`\n  Check status: midday computer logs ${id}\n`));
          return;
        }

        if (run.status === "completed") {
          spinner.succeed("Run completed");
          if (format === "json") {
            printJson(run);
            return;
          }
          if (run.summary) {
            console.log(chalk.dim("\n  Summary:\n"));
            for (const line of run.summary.split("\n")) {
              console.log(`  ${line}`);
            }
            console.log();
          }
        } else if (run.status === "waiting_approval") {
          spinner.info("Agent is waiting for approval");
          if (format === "json") {
            printJson(run);
            return;
          }
          console.log(
            chalk.dim(`\n  Review: `) +
              `midday computer proposals ${id} ${runId}\n`,
          );
        } else {
          spinner.fail("Run failed");
          if (format === "json") {
            printJson(run);
            return;
          }
          if (run.error) {
            console.log(chalk.red(`\n  Error: ${run.error}\n`));
          }
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer logs <id>
  cmd
    .command("logs <id>")
    .description("View recent run history for an agent")
    .option("--limit <n>", "Number of runs to show", "10")
    .action(async (id: string, opts: { limit: string }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching runs...",
          () =>
            get<{ data: Run[] }>(
              `/computer/agents/${id}/runs`,
              { limit: opts.limit },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJsonList(data.data);
          return;
        }

        if (data.data.length === 0) {
          console.log(chalk.dim("\n  No runs yet.\n"));
          return;
        }

        printTable({
          head: ["ID", "Status", "Tools", "LLM", "Summary", "Completed"],
          rows: data.data.map((r) => [
            r.id.slice(0, 8),
            r.status === "completed"
              ? chalk.green(r.status)
              : r.status === "failed"
                ? chalk.red(r.status)
                : r.status === "running"
                  ? chalk.yellow(r.status)
                  : r.status === "waiting_approval"
                    ? chalk.magenta(r.status)
                    : chalk.dim(r.status),
            String(r.toolCallCount),
            String(r.llmCallCount),
            r.summary
              ? r.summary.slice(0, 60)
              : r.error
                ? chalk.red(r.error.slice(0, 60))
                : chalk.dim("—"),
            r.completedAt
              ? new Date(r.completedAt).toLocaleString()
              : chalk.dim("—"),
          ]),
        });
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer memory <id>
  cmd
    .command("memory <id>")
    .description("View an agent's persistent memory")
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching memory...",
          () =>
            get<{ data: MemoryEntry[] }>(
              `/computer/agents/${id}/memory`,
              {},
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJsonList(data.data);
          return;
        }

        if (data.data.length === 0) {
          console.log(chalk.dim("\n  No memories stored yet.\n"));
          return;
        }

        console.log(chalk.bold("\n  Agent Memory\n"));
        for (const entry of data.data) {
          console.log(
            `  ${chalk.cyan(entry.key)} ${chalk.dim(`(${entry.type || "general"})`)}`,
          );
          const preview =
            entry.content.length > 120
              ? `${entry.content.slice(0, 120)}...`
              : entry.content;
          console.log(chalk.dim(`  ${preview}`));
          console.log(
            chalk.dim(
              `  Updated: ${new Date(entry.updatedAt).toLocaleString()}`,
            ),
          );
          console.log();
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer proposals <agentId> <runId>
  cmd
    .command("proposals <agentId> <runId>")
    .description("View proposed actions awaiting approval")
    .action(async (agentId: string, runId: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching proposals...",
          () =>
            get<{
              data: {
                runId: string;
                status: string;
                actions: Array<{
                  tool: string;
                  args: Record<string, unknown>;
                  description?: string;
                }>;
              };
            }>(
              `/computer/agents/${agentId}/runs/${runId}/proposals`,
              {},
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data.data);
          return;
        }

        const { actions } = data.data;
        if (actions.length === 0) {
          console.log(chalk.dim("\n  No proposed actions.\n"));
          return;
        }

        console.log(chalk.bold("\n  Proposed Actions\n"));
        console.log(chalk.dim(`  Run: ${runId}\n`));

        for (let i = 0; i < actions.length; i++) {
          const action = actions[i]!;
          console.log(
            `  ${chalk.cyan(`[${i}]`)} ${chalk.bold(action.tool)}`,
          );
          if (action.description) {
            console.log(`      ${chalk.dim(action.description)}`);
          }
          console.log(
            `      ${chalk.dim(JSON.stringify(action.args, null, 2).split("\n").join("\n      "))}`,
          );
          console.log();
        }

        console.log(
          chalk.dim(
            `  Approve: midday computer approve ${agentId} ${runId}\n` +
              `  Reject:  midday computer reject ${agentId} ${runId}\n`,
          ),
        );
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer approve <agentId> <runId>
  cmd
    .command("approve <agentId> <runId>")
    .description("Approve proposed actions for execution")
    .option("--pick <indices>", "Comma-separated indices to approve (e.g. 0,2)")
    .action(async (agentId: string, runId: string, opts: { pick?: string }) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const body: { actions?: number[] } = {};
        if (opts.pick) {
          body.actions = opts.pick.split(",").map((s) => Number.parseInt(s.trim(), 10));
        }

        const data = await withSpinner(
          "Approving proposals...",
          () =>
            post<{
              data: { runId: string; status: string; actionsQueued: number };
            }>(
              `/computer/agents/${agentId}/runs/${runId}/approve`,
              body,
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data.data);
          return;
        }

        console.log(
          chalk.green(`\n  ✓ Approved.`) +
            chalk.dim(` ${data.data.actionsQueued} action(s) queued for execution.\n`),
        );
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer reject <agentId> <runId>
  cmd
    .command("reject <agentId> <runId>")
    .description("Reject proposed actions")
    .action(async (agentId: string, runId: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Rejecting proposals...",
          () =>
            post<{ data: { runId: string; status: string } }>(
              `/computer/agents/${agentId}/runs/${runId}/reject`,
              {},
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data.data);
          return;
        }

        console.log(chalk.yellow(`\n  ○ Proposals rejected.\n`));
      } catch (error) {
        handleError(error, format);
      }
    });

  // midday computer remove <id>
  cmd
    .command("remove <id>")
    .description("Remove an agent")
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Removing agent...",
          () =>
            del<{ success: boolean }>(`/computer/agents/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ success: true });
          return;
        }

        console.log(chalk.green("\n  ✓ Agent removed.\n"));
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
