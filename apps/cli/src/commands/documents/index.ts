import { Command } from "commander";
import chalk from "chalk";
import { get, del } from "../../client/api.js";
import { resolveFormat, type GlobalFlags } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable, printDetail } from "../../output/table.js";
import { handleError } from "../../utils/errors.js";
import { withSpinner } from "../../ui/spinner.js";

interface Document {
  id: string;
  name: string;
  size?: number;
  content_type?: string;
  created_at?: string;
  tag?: string;
}

export function createDocumentsCommand(): Command {
  const cmd = new Command("documents").description("Browse and manage your vault");

  cmd
    .command("list")
    .description("List documents")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .option("--tag <tag>", "Filter by tag")
    .addHelpText(
      "after",
      `
Examples:
  midday documents list
  midday documents list --tag receipts --json`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching documents...",
          () =>
            get<{ data: Document[]; meta?: { cursor?: string; hasMore?: boolean; count?: number } }>("/documents", {
              cursor: opts.cursor,
              page_size: opts.pageSize,
              tag: opts.tag,
            }, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        const docs = data.data || [];

        if (format === "json") {
          printJsonList(docs, {
            hasMore: data.meta?.hasMore ?? false,
            cursor: data.meta?.cursor,
            total: data.meta?.count,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = docs.map((d) => [
            d.name,
            d.content_type || null,
            d.size ? formatSize(d.size) : null,
            d.tag || null,
            d.created_at || null,
          ]);

          printTable({
            title: `Documents${data.meta?.count ? ` (${data.meta.count} total)` : ""}`,
            head: ["Name", "Type", "Size", "Tag", "Created"],
            rows,
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
          () => get<Document>(`/documents/${id}`, undefined, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(doc);
        } else {
          printDetail(doc.name, [
            ["ID", doc.id],
            ["Type", doc.content_type],
            ["Size", doc.size ? formatSize(doc.size) : null],
            ["Tag", doc.tag],
            ["Created", doc.created_at],
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
            console.log(`\n  ${chalk.yellow("dry-run")} Would delete document ${chalk.bold(id)}\n`);
          }
          return;
        }

        await withSpinner(
          "Deleting document...",
          () => del(`/documents/${id}`, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(`\n  ${chalk.green("✓")} Deleted document ${chalk.bold(id)}\n`);
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
