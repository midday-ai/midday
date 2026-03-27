import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface InboxItem {
  id: string;
  display_name?: string;
  amount?: number;
  currency?: string;
  date?: string;
  status?: string;
  content_type?: string;
  transaction_id?: string;
}

export function createInboxCommand(): Command {
  const cmd = new Command("inbox").description(
    "Process receipts and match to transactions",
  );

  cmd
    .command("list")
    .description("List inbox items")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .option("--status <status>", "Filter by status (pending, processing, done)")
    .addHelpText(
      "after",
      `
Examples:
  midday inbox list
  midday inbox list --status pending --json`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching inbox...",
          () =>
            get<{
              data: InboxItem[];
              meta?: { cursor?: string; hasMore?: boolean; count?: number };
            }>(
              "/inbox",
              {
                cursor: opts.cursor,
                page_size: opts.pageSize,
                status: opts.status,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const items = data.data || [];

        if (format === "json") {
          printJsonList(items, {
            hasMore: data.meta?.hasMore ?? false,
            cursor: data.meta?.cursor,
            total: data.meta?.count,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = items.map((item) => [
            item.display_name || null,
            item.amount != null
              ? formatAmount(item.amount, item.currency || "USD")
              : null,
            item.date || null,
            item.status || null,
            item.transaction_id
              ? chalk.green("matched")
              : chalk.dim("unmatched"),
          ]);

          printTable({
            title: `Inbox${data.meta?.count ? ` (${data.meta.count} total)` : ""}`,
            head: ["Name", "Amount", "Date", "Status", "Match"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get inbox item details")
    .argument("<id>", "Inbox item ID")
    .addHelpText(
      "after",
      `
Examples:
  midday inbox get inb_abc123`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const item = await withSpinner(
          "Fetching inbox item...",
          () =>
            get<InboxItem>(`/inbox/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(item);
        } else {
          printDetail(item.display_name || id, [
            ["ID", item.id],
            [
              "Amount",
              item.amount != null
                ? formatAmount(item.amount, item.currency || "USD")
                : null,
            ],
            ["Date", item.date],
            ["Status", item.status],
            ["Type", item.content_type],
            ["Transaction", item.transaction_id || "unmatched"],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("match")
    .description("Match an inbox item to a transaction")
    .argument("<inbox-id>", "Inbox item ID")
    .requiredOption("--transaction <id>", "Transaction ID to match with")
    .addHelpText(
      "after",
      `
Examples:
  midday inbox match inb_abc123 --transaction txn_def456`,
    )
    .action(async (inboxId: string, opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Matching...",
          () =>
            post(
              `/inbox/${inboxId}/match`,
              { transaction_id: opts.transaction },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson({
            matched: true,
            inbox_id: inboxId,
            transaction_id: opts.transaction,
          });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Matched inbox item to transaction ${chalk.bold(opts.transaction)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete an inbox item")
    .argument("<id>", "Inbox item ID")
    .option("--yes, -y", "Skip confirmation")
    .addHelpText(
      "after",
      `
Examples:
  midday inbox delete inb_abc123 --yes`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Deleting inbox item...",
          () =>
            del(`/inbox/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted inbox item ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
