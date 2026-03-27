import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Invoice {
  id: string;
  invoiceNumber?: string;
  status?: string;
  customerName?: string;
  customer?: { id: string; name: string; email?: string | null } | null;
  amount?: number | null;
  currency?: string | null;
  dueDate?: string;
  issueDate?: string;
}

interface ListResponse {
  data: Invoice[];
  meta?: {
    cursor?: string | null;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function createInvoicesCommand(): Command {
  const cmd = new Command("invoices").description(
    "Create, send, and track invoices",
  );

  cmd
    .command("list")
    .description("List invoices with optional filters")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .option(
      "--status <status>",
      "Filter by status (draft, unpaid, paid, overdue, canceled)",
    )
    .option("--search <query>", "Search by invoice number or customer")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices list
  midday invoices list --status unpaid
  midday invoices list --search "Acme" --json
  midday invoices list --from 2026-01-01 --to 2026-03-31`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching invoices...",
          () =>
            get<ListResponse>(
              "/invoices",
              {
                cursor: opts.cursor,
                pageSize: opts.pageSize,
                statuses: opts.status ? [opts.status] : undefined,
                q: opts.search,
                start: opts.from,
                end: opts.to,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const invoices = data.data || [];

        if (format === "json") {
          printJsonList(invoices, {
            hasMore: data.meta?.hasNextPage ?? false,
            cursor: data.meta?.cursor ?? undefined,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = invoices.map((inv) => [
            inv.invoiceNumber || null,
            inv.customer?.name || inv.customerName || null,
            inv.amount != null
              ? formatAmount(inv.amount, inv.currency || "USD")
              : null,
            inv.status || null,
            inv.dueDate ? inv.dueDate.split("T")[0] : null,
          ]);

          printTable({
            title: "Invoices",
            head: ["Number", "Customer", "Amount", "Status", "Due Date"],
            rows,
            pageInfo:
              data.meta?.hasNextPage && data.meta?.cursor
                ? `Next page: midday invoices list --cursor ${data.meta.cursor}`
                : undefined,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get a single invoice by ID")
    .argument("<id>", "Invoice ID")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices get inv_abc123
  midday invoices get inv_abc123 --json`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const inv = await withSpinner(
          "Fetching invoice...",
          () =>
            get<Invoice>(`/invoices/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(inv);
        } else {
          printDetail(`Invoice ${inv.invoiceNumber || id}`, [
            ["ID", inv.id],
            ["Number", inv.invoiceNumber],
            ["Customer", inv.customer?.name || inv.customerName],
            [
              "Amount",
              inv.amount != null
                ? formatAmount(inv.amount, inv.currency || "USD")
                : null,
            ],
            ["Status", inv.status],
            ["Issue Date", inv.issueDate?.split("T")[0]],
            ["Due Date", inv.dueDate?.split("T")[0]],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a new invoice")
    .requiredOption("--customer <id>", "Customer ID")
    .option("--number <number>", "Invoice number")
    .option("--due-date <date>", "Due date (YYYY-MM-DD)")
    .option("--issue-date <date>", "Issue date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code", "USD")
    .option("--note <text>", "Invoice note")
    .option("--stdin", "Read full JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices create --customer cust_123 --due-date 2026-04-30
  cat invoice.json | midday invoices create --stdin`,
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
            customerId: opts.customer,
            invoiceNumber: opts.number,
            dueDate: opts.dueDate,
            issueDate: opts.issueDate || new Date().toISOString().split("T")[0],
            currency: opts.currency,
            noteDetails: opts.note,
          };
        }

        const inv = await withSpinner(
          "Creating invoice...",
          () =>
            post<Invoice>("/invoices", body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(inv);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created invoice ${chalk.bold(inv.invoiceNumber || inv.id)}`,
          );
          if (inv.customer?.name || inv.customerName)
            console.log(
              `  ${chalk.dim("Customer:")} ${inv.customer?.name || inv.customerName}`,
            );
          console.log();
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("send")
    .description("Send an invoice to the customer")
    .argument("<id>", "Invoice ID")
    .option("--dry-run, -n", "Preview without sending")
    .option("--yes, -y", "Skip confirmation")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices send inv_abc123
  midday invoices send inv_abc123 --dry-run
  midday invoices send inv_abc123 --yes`,
    )
    .action(async (id: string, opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        if (opts.dryRun) {
          if (format === "json") {
            printJson({ dry_run: true, action: "send", id });
          } else {
            console.log(
              `\n  ${chalk.yellow("dry-run")} Would send invoice ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        const inv = await withSpinner(
          "Sending invoice...",
          () =>
            post<Invoice>(`/invoices/${id}/send`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(inv);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Sent invoice ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("update")
    .description("Update an existing invoice")
    .argument("<id>", "Invoice ID")
    .option("--status <status>", "New status")
    .option("--due-date <date>", "New due date")
    .option("--note <text>", "New note")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices update inv_abc123 --due-date 2026-05-15
  cat update.json | midday invoices update inv_abc123 --stdin`,
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
          if (opts.status) body.status = opts.status;
          if (opts.dueDate) body.dueDate = opts.dueDate;
          if (opts.note) body.internalNote = opts.note;
        }

        const inv = await withSpinner(
          "Updating invoice...",
          () =>
            put<Invoice>(`/invoices/${id}`, body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(inv);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Updated invoice ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete an invoice")
    .argument("<id>", "Invoice ID")
    .option("--yes, -y", "Skip confirmation")
    .option("--dry-run, -n", "Preview without deleting")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices delete inv_abc123
  midday invoices delete inv_abc123 --yes
  midday invoices delete inv_abc123 --dry-run`,
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
              `\n  ${chalk.yellow("dry-run")} Would delete invoice ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        await withSpinner(
          "Deleting invoice...",
          () =>
            del(`/invoices/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted invoice ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("mark-paid")
    .description("Mark an invoice as paid")
    .argument("<id>", "Invoice ID")
    .option("--dry-run, -n", "Preview without marking")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices mark-paid inv_abc123
  midday invoices mark-paid inv_abc123 --dry-run`,
    )
    .action(async (id: string, opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        if (opts.dryRun) {
          if (format === "json") {
            printJson({ dry_run: true, action: "mark_paid", id });
          } else {
            console.log(
              `\n  ${chalk.yellow("dry-run")} Would mark invoice ${chalk.bold(id)} as paid\n`,
            );
          }
          return;
        }

        const inv = await withSpinner(
          "Marking as paid...",
          () =>
            post<Invoice>(`/invoices/${id}/mark-paid`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(inv);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Marked invoice ${chalk.bold(id)} as paid\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("remind")
    .description("Send a payment reminder for an overdue invoice")
    .argument("<id>", "Invoice ID")
    .option("--dry-run, -n", "Preview without sending")
    .addHelpText(
      "after",
      `
Examples:
  midday invoices remind inv_abc123
  midday invoices remind inv_abc123 --dry-run`,
    )
    .action(async (id: string, opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        if (opts.dryRun) {
          if (format === "json") {
            printJson({ dry_run: true, action: "remind", id });
          } else {
            console.log(
              `\n  ${chalk.yellow("dry-run")} Would send reminder for invoice ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        await withSpinner(
          "Sending reminder...",
          () =>
            post(`/invoices/${id}/remind`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ reminded: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Sent reminder for invoice ${chalk.bold(id)}\n`,
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
