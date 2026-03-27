import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Transaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  currency: string;
  category?: { id: string; name: string; slug: string } | null;
  status?: string;
  note?: string | null;
  counterpartyName?: string | null;
  account?: { id: string; name: string; currency: string } | null;
}

interface ListResponse {
  data: Transaction[];
  meta?: {
    cursor?: string | null;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function createTransactionsCommand(): Command {
  const cmd = new Command("transactions").description(
    "List, search, and manage transactions",
  );

  cmd
    .command("list")
    .description("List transactions with optional filters")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .option("--search <query>", "Search by name or description")
    .option("--category <slug>", "Filter by category slug")
    .option("--account <id>", "Filter by bank account ID")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--status <status>", "Filter by status")
    .addHelpText(
      "after",
      `
Examples:
  midday transactions list
  midday transactions list --from 2026-01-01 --to 2026-03-31
  midday transactions list --search "Spotify" --json
  midday transactions list --category software --page-size 50
  midday transactions list --cursor abc123`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching transactions...",
          () =>
            get<ListResponse>(
              "/transactions",
              {
                cursor: opts.cursor,
                pageSize: opts.pageSize,
                q: opts.search,
                categories: opts.category ? [opts.category] : undefined,
                accounts: opts.account ? [opts.account] : undefined,
                start: opts.from,
                end: opts.to,
                statuses: opts.status ? [opts.status] : undefined,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const txns = data.data || [];

        if (format === "json") {
          printJsonList(txns, {
            hasMore: data.meta?.hasNextPage ?? false,
            cursor: data.meta?.cursor ?? undefined,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = txns.map((t) => [
            t.date?.split("T")[0] ?? null,
            t.name,
            formatAmount(t.amount, t.currency),
            t.category?.name || null,
            t.status || null,
          ]);

          printTable({
            title: "Transactions",
            head: ["Date", "Description", "Amount", "Category", "Status"],
            rows,
            pageInfo:
              data.meta?.hasNextPage && data.meta?.cursor
                ? `Next page: midday transactions list --cursor ${data.meta.cursor}`
                : undefined,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get a single transaction by ID")
    .argument("<id>", "Transaction ID")
    .addHelpText(
      "after",
      `
Examples:
  midday transactions get txn_abc123
  midday transactions get txn_abc123 --json`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const txn = await withSpinner(
          "Fetching transaction...",
          () =>
            get<Transaction>(`/transactions/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(txn);
        } else {
          printDetail(`Transaction ${id}`, [
            ["Date", txn.date?.split("T")[0]],
            ["Description", txn.name],
            ["Amount", formatAmount(txn.amount, txn.currency)],
            ["Currency", txn.currency],
            ["Category", txn.category?.name],
            ["Status", txn.status],
            ["Account", txn.account?.name],
            ["Note", txn.note],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a manual transaction")
    .requiredOption("--name <name>", "Transaction description")
    .requiredOption("--amount <amount>", "Amount (negative for expense)")
    .requiredOption("--currency <code>", "Currency code (e.g. USD)")
    .requiredOption("--account <id>", "Bank account ID")
    .option("--date <date>", "Transaction date (YYYY-MM-DD)")
    .option("--category <slug>", "Category slug")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday transactions create --name "Office Supplies" --amount -49.99 --currency USD --account acc_123
  midday transactions create --name "Client Payment" --amount 5000 --currency USD --account acc_123 --date 2026-03-01
  cat txn.json | midday transactions create --stdin`,
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
          body = {
            name: opts.name,
            amount: Number(opts.amount),
            currency: opts.currency,
            bankAccountId: opts.account,
            date: opts.date || new Date().toISOString().split("T")[0],
            categorySlug: opts.category,
          };
        }

        const txn = await withSpinner(
          "Creating transaction...",
          () =>
            post<Transaction>("/transactions", body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(txn);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created transaction ${chalk.bold(txn.id)}`,
          );
          console.log(`  ${chalk.dim("Name:")} ${txn.name}`);
          console.log(
            `  ${chalk.dim("Amount:")} ${formatAmount(txn.amount, txn.currency)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("update")
    .description("Update an existing transaction")
    .argument("<id>", "Transaction ID")
    .option("--name <name>", "New description")
    .option("--category <slug>", "New category slug")
    .option("--status <status>", "New status")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday transactions update txn_abc123 --category software
  midday transactions update txn_abc123 --name "Updated Name" --category travel
  cat update.json | midday transactions update txn_abc123 --stdin`,
    )
    .action(async (id: string, opts) => {
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
          body = {};
          if (opts.name) body.name = opts.name;
          if (opts.category) body.categorySlug = opts.category;
          if (opts.status) body.status = opts.status;
        }

        const txn = await withSpinner(
          "Updating transaction...",
          () =>
            put<Transaction>(`/transactions/${id}`, body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(txn);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Updated transaction ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a transaction")
    .argument("<id>", "Transaction ID")
    .option("--yes, -y", "Skip confirmation")
    .option("--dry-run, -n", "Preview without deleting")
    .addHelpText(
      "after",
      `
Examples:
  midday transactions delete txn_abc123
  midday transactions delete txn_abc123 --yes
  midday transactions delete txn_abc123 --dry-run`,
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
              `\n  ${chalk.yellow("dry-run")} Would delete transaction ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        await withSpinner(
          "Deleting transaction...",
          () =>
            del(`/transactions/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted transaction ${chalk.bold(id)}\n`,
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
