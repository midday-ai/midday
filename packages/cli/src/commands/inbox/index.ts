import chalk from "chalk";
import { Command } from "commander";
import { del, get, post } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface InboxItem {
  id: string;
  displayName?: string | null;
  fileName?: string | null;
  amount?: number | null;
  currency?: string | null;
  date?: string | null;
  status?: string | null;
  contentType?: string | null;
  description?: string | null;
  website?: string | null;
  transaction?: {
    id: string;
    amount?: number;
    currency?: string;
    name?: string;
    date?: string;
  } | null;
}

interface ListResponse {
  data: InboxItem[];
  meta?: {
    cursor?: string | null;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
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
            get<ListResponse>(
              "/inbox",
              {
                cursor: opts.cursor,
                pageSize: opts.pageSize,
                status: opts.status,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const items = data.data || [];

        if (format === "json") {
          printJsonList(items, {
            hasMore: data.meta?.hasNextPage ?? false,
            cursor: data.meta?.cursor ?? undefined,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = items.map((item) => [
            item.displayName || item.fileName || null,
            item.amount != null
              ? formatAmount(item.amount, item.currency || "USD")
              : null,
            item.date?.split("T")[0] || null,
            item.status || null,
            item.transaction ? chalk.green("matched") : chalk.dim("unmatched"),
          ]);

          printTable({
            title: "Inbox",
            head: ["Name", "Amount", "Date", "Status", "Match"],
            rows,
            pageInfo:
              data.meta?.hasNextPage && data.meta?.cursor
                ? `Next page: midday inbox list --cursor ${data.meta.cursor}`
                : undefined,
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
          printDetail(item.displayName || item.fileName || id, [
            ["ID", item.id],
            [
              "Amount",
              item.amount != null
                ? formatAmount(item.amount, item.currency || "USD")
                : null,
            ],
            ["Date", item.date?.split("T")[0]],
            ["Status", item.status],
            ["Type", item.contentType],
            [
              "Transaction",
              item.transaction
                ? `${item.transaction.id} (${item.transaction.name})`
                : "unmatched",
            ],
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
              { transactionId: opts.transaction },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson({
            matched: true,
            inboxId,
            transactionId: opts.transaction,
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
