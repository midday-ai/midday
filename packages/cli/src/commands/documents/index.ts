import chalk from "chalk";
import { Command } from "commander";
import { del, get } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Document {
  id: string;
  title?: string | null;
  pathTokens?: string[];
  metadata?: { size?: number | null; mimetype?: string | null } | null;
  processingStatus?: string;
  summary?: string | null;
  date?: string | null;
}

interface ListResponse {
  data: Document[];
  meta?: {
    cursor?: string | null;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function createDocumentsCommand(): Command {
  const cmd = new Command("documents").description(
    "Browse and manage your vault",
  );

  cmd
    .command("list")
    .description("List documents")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .addHelpText(
      "after",
      `
Examples:
  midday documents list
  midday documents list --json`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching documents...",
          () =>
            get<ListResponse>(
              "/documents",
              {
                cursor: opts.cursor,
                pageSize: opts.pageSize,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const docs = data.data || [];

        if (format === "json") {
          printJsonList(docs, {
            hasMore: data.meta?.hasNextPage ?? false,
            cursor: data.meta?.cursor ?? undefined,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = docs.map((d) => [
            d.title || d.pathTokens?.at(-1) || null,
            d.metadata?.mimetype || null,
            d.metadata?.size ? formatSize(d.metadata.size) : null,
            d.date || null,
          ]);

          printTable({
            title: "Documents",
            head: ["Title", "Type", "Size", "Date"],
            rows,
            pageInfo:
              data.meta?.hasNextPage && data.meta?.cursor
                ? `Next page: midday documents list --cursor ${data.meta.cursor}`
                : undefined,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get document details")
    .argument("<id>", "Document ID")
    .addHelpText(
      "after",
      `
Examples:
  midday documents get doc_abc123`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const doc = await withSpinner(
          "Fetching document...",
          () =>
            get<Document>(`/documents/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(doc);
        } else {
          printDetail(doc.title || doc.pathTokens?.at(-1) || id, [
            ["ID", doc.id],
            ["Type", doc.metadata?.mimetype],
            ["Size", doc.metadata?.size ? formatSize(doc.metadata.size) : null],
            ["Status", doc.processingStatus],
            ["Date", doc.date],
            ["Summary", doc.summary],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a document")
    .argument("<id>", "Document ID")
    .option("--yes, -y", "Skip confirmation")
    .option("--dry-run, -n", "Preview without deleting")
    .addHelpText(
      "after",
      `
Examples:
  midday documents delete doc_abc123
  midday documents delete doc_abc123 --yes`,
    )
    .action(async (id: string, opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        if (opts.dryRun) {
          if (format === "json") {
            printJson({ dry_run: true, action: "delete", id });
          } else {
            console.log(
              `\n  ${chalk.yellow("dry-run")} Would delete document ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        await withSpinner(
          "Deleting document...",
          () =>
            del(`/documents/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted document ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}

function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit++;
  }
  return `${size.toFixed(unit > 0 ? 1 : 0)} ${units[unit]}`;
}
