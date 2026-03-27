import { Command } from "commander";
import chalk from "chalk";
import { get, post, put, del } from "../../client/api.js";
import { resolveFormat, type GlobalFlags } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable, printDetail } from "../../output/table.js";
import { handleError } from "../../utils/errors.js";
import { withSpinner } from "../../ui/spinner.js";

interface Project {
  id: string;
  name: string;
  status?: string;
  rate?: number;
  currency?: string;
  total_duration?: number;
  description?: string;
}

interface Entry {
  id: string;
  project_id?: string;
  project_name?: string;
  description?: string;
  start: string;
  stop?: string;
  duration?: number;
  date?: string;
}

interface TimerStatus {
  running: boolean;
  entry?: Entry;
  elapsed?: number;
}

export function createTrackerCommand(): Command {
  const cmd = new Command("tracker").description("Track time on projects");

  const projects = cmd.command("projects").description("Manage tracker projects");

  projects
    .command("list")
    .description("List projects")
    .option("--status <status>", "Filter by status (in_progress, completed)")
    .addHelpText(
      "after",
      `
Examples:
  midday tracker projects list
  midday tracker projects list --status in_progress --json`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching projects...",
          () => get<{ data: Project[] }>("/tracker-projects", { status: opts.status }, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        const items = data.data || [];

        if (format === "json") {
          printJsonList(items);
        } else {
          const rows = items.map((p) => [
            p.name,
            p.status || null,
            p.rate != null ? `${p.rate}/${p.currency || "USD"}` : null,
            p.total_duration != null ? formatDuration(p.total_duration) : null,
          ]);

          printTable({
            title: `Projects (${items.length})`,
            head: ["Name", "Status", "Rate", "Total Time"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  projects
    .command("create")
    .description("Create a new project")
    .requiredOption("--name <name>", "Project name")
    .option("--rate <rate>", "Hourly rate")
    .option("--currency <code>", "Currency code", "USD")
    .option("--description <text>", "Project description")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday tracker projects create --name "Website Redesign" --rate 150
  midday tracker projects create --name "Consulting" --rate 200 --currency EUR`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        let body: Record<string, unknown>;

        if (opts.stdin) {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) {
            chunks.push(chunk as Buffer);
          }
          body = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        } else {
          body = { name: opts.name };
          if (opts.rate) body.rate = Number(opts.rate);
          if (opts.currency) body.currency = opts.currency;
          if (opts.description) body.description = opts.description;
        }

        const project = await withSpinner(
          "Creating project...",
          () => post<Project>("/tracker-projects", body, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(project);
        } else {
          console.log(`\n  ${chalk.green("✓")} Created project ${chalk.bold(project.name)}`);
          console.log(`  ${chalk.dim("ID:")} ${project.id}\n`);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  // Timer commands at tracker level
  cmd
    .command("start")
    .description("Start the timer")
    .option("--project <id>", "Project ID")
    .option("--description <text>", "Entry description")
    .addHelpText(
      "after",
      `
Examples:
  midday tracker start --project proj_abc123
  midday tracker start --project proj_abc123 --description "API development"`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const body: Record<string, unknown> = {};
        if (opts.project) body.project_id = opts.project;
        if (opts.description) body.description = opts.description;

        const entry = await withSpinner(
          "Starting timer...",
          () => post<Entry>("/tracker-entries/start", body, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(entry);
        } else {
          console.log(`\n  ${chalk.green("✓")} Timer started`);
          if (entry.project_name) console.log(`  ${chalk.dim("Project:")} ${entry.project_name}`);
          if (entry.description) console.log(`  ${chalk.dim("Task:")} ${entry.description}`);
          console.log();
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("stop")
    .description("Stop the running timer")
    .addHelpText(
      "after",
      `
Examples:
  midday tracker stop`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const entry = await withSpinner(
          "Stopping timer...",
          () => post<Entry>("/tracker-entries/stop", undefined, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(entry);
        } else {
          console.log(`\n  ${chalk.green("✓")} Timer stopped`);
          if (entry.duration) console.log(`  ${chalk.dim("Duration:")} ${formatDuration(entry.duration)}`);
          console.log();
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("status")
    .description("Show current timer status")
    .addHelpText(
      "after",
      `
Examples:
  midday tracker status
  midday tracker status --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const status = await withSpinner(
          "Checking timer...",
          () => get<TimerStatus>("/tracker-entries/status", undefined, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(status);
        } else if (status.running && status.entry) {
          printDetail("Timer Running", [
            ["Project", status.entry.project_name],
            ["Description", status.entry.description],
            ["Started", status.entry.start],
            ["Elapsed", status.elapsed ? formatDuration(status.elapsed) : null],
          ]);
        } else {
          console.log(`\n  ${chalk.dim("No timer running")}. Use ${chalk.cyan("midday tracker start")} to begin.\n`);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
