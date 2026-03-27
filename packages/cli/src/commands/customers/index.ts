import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  contact?: string | null;
  country?: string | null;
  invoiceCount?: number;
  totalRevenue?: number;
  invoiceCurrency?: string | null;
}

interface ListResponse {
  data: Customer[];
  meta?: {
    cursor?: string | null;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
}

export function createCustomersCommand(): Command {
  const cmd = new Command("customers").description("Manage your customers");

  cmd
    .command("list")
    .description("List customers")
    .option("--cursor <cursor>", "Pagination cursor")
    .option("--page-size <n>", "Results per page", "25")
    .option("--search <query>", "Search by name or email")
    .addHelpText(
      "after",
      `
Examples:
  midday customers list
  midday customers list --search "Acme"
  midday customers list --json`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching customers...",
          () =>
            get<ListResponse>(
              "/customers",
              {
                cursor: opts.cursor,
                pageSize: opts.pageSize,
                q: opts.search,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const customers = data.data || [];

        if (format === "json") {
          printJsonList(customers, {
            hasMore: data.meta?.hasNextPage ?? false,
            cursor: data.meta?.cursor ?? undefined,
            pageSize: Number(opts.pageSize),
          });
        } else {
          const rows = customers.map((c) => [
            c.name,
            c.email || null,
            c.contact || null,
            c.phone || null,
          ]);

          printTable({
            title: "Customers",
            head: ["Name", "Email", "Contact", "Phone"],
            rows,
            pageInfo:
              data.meta?.hasNextPage && data.meta?.cursor
                ? `Next page: midday customers list --cursor ${data.meta.cursor}`
                : undefined,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get a single customer by ID")
    .argument("<id>", "Customer ID")
    .addHelpText(
      "after",
      `
Examples:
  midday customers get cust_abc123
  midday customers get cust_abc123 --json`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const customer = await withSpinner(
          "Fetching customer...",
          () =>
            get<Customer>(`/customers/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(customer);
        } else {
          printDetail(customer.name, [
            ["ID", customer.id],
            ["Email", customer.email],
            ["Contact", customer.contact],
            ["Phone", customer.phone],
            ["Website", customer.website],
            ["Country", customer.country],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a new customer")
    .requiredOption("--name <name>", "Customer name")
    .option("--email <email>", "Customer email")
    .option("--phone <phone>", "Phone number")
    .option("--website <url>", "Website URL")
    .option("--contact <name>", "Contact person name")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday customers create --name "Acme Corp" --email billing@acme.com
  midday customers create --name "Startup Inc" --contact "Jane Doe" --phone "+1-555-0123"
  cat customer.json | midday customers create --stdin`,
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
          if (opts.email) body.email = opts.email;
          if (opts.phone) body.phone = opts.phone;
          if (opts.website) body.website = opts.website;
          if (opts.contact) body.contact = opts.contact;
        }

        const customer = await withSpinner(
          "Creating customer...",
          () =>
            post<Customer>("/customers", body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(customer);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created customer ${chalk.bold(customer.name)}`,
          );
          console.log(`  ${chalk.dim("ID:")} ${customer.id}\n`);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("update")
    .description("Update an existing customer")
    .argument("<id>", "Customer ID")
    .option("--name <name>", "New name")
    .option("--email <email>", "New email")
    .option("--phone <phone>", "New phone")
    .option("--website <url>", "New website")
    .option("--contact <name>", "New contact person")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday customers update cust_abc123 --email new@acme.com
  cat update.json | midday customers update cust_abc123 --stdin`,
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
          if (opts.email) body.email = opts.email;
          if (opts.phone) body.phone = opts.phone;
          if (opts.website) body.website = opts.website;
          if (opts.contact) body.contact = opts.contact;
        }

        const customer = await withSpinner(
          "Updating customer...",
          () =>
            put<Customer>(`/customers/${id}`, body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(customer);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Updated customer ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a customer")
    .argument("<id>", "Customer ID")
    .option("--yes, -y", "Skip confirmation")
    .option("--dry-run, -n", "Preview without deleting")
    .addHelpText(
      "after",
      `
Examples:
  midday customers delete cust_abc123
  midday customers delete cust_abc123 --yes
  midday customers delete cust_abc123 --dry-run`,
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
              `\n  ${chalk.yellow("dry-run")} Would delete customer ${chalk.bold(id)}\n`,
            );
          }
          return;
        }

        await withSpinner(
          "Deleting customer...",
          () =>
            del(`/customers/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted customer ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
