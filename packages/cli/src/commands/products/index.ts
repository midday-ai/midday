import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Product {
  id: string;
  name: string;
  price?: number;
  currency?: string;
  unit?: string;
  quantity?: number;
}

export function createProductsCommand(): Command {
  const cmd = new Command("products").description("Manage invoice products");

  cmd
    .command("list")
    .description("List invoice products")
    .addHelpText(
      "after",
      `
Examples:
  midday products list
  midday products list --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching products...",
          () =>
            get<{ data: Product[] }>("/invoice-products", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const products = data.data || [];

        if (format === "json") {
          printJsonList(products);
        } else {
          const rows = products.map((p) => [
            p.name,
            p.price != null ? formatAmount(p.price, p.currency || "USD") : null,
            p.unit || null,
          ]);

          printTable({
            title: `Products (${products.length})`,
            head: ["Name", "Price", "Unit"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a new product")
    .requiredOption("--name <name>", "Product name")
    .option("--price <price>", "Unit price")
    .option("--currency <code>", "Currency code", "USD")
    .option("--unit <unit>", "Unit of measure (e.g. hours, units)")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday products create --name "Consulting" --price 150 --unit hours
  midday products create --name "License Fee" --price 99 --currency EUR`,
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
          if (opts.price) body.price = Number(opts.price);
          if (opts.currency) body.currency = opts.currency;
          if (opts.unit) body.unit = opts.unit;
        }

        const product = await withSpinner(
          "Creating product...",
          () =>
            post<Product>("/invoice-products", body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(product);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created product ${chalk.bold(product.name)}`,
          );
          console.log(`  ${chalk.dim("ID:")} ${product.id}\n`);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("update")
    .description("Update a product")
    .argument("<id>", "Product ID")
    .option("--name <name>", "New name")
    .option("--price <price>", "New price")
    .option("--unit <unit>", "New unit")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday products update prod_abc123 --price 175
  midday products update prod_abc123 --name "Senior Consulting" --price 200`,
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
          if (opts.price) body.price = Number(opts.price);
          if (opts.unit) body.unit = opts.unit;
        }

        const product = await withSpinner(
          "Updating product...",
          () =>
            put<Product>(`/invoice-products/${id}`, body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(product);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Updated product ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a product")
    .argument("<id>", "Product ID")
    .option("--yes, -y", "Skip confirmation")
    .addHelpText(
      "after",
      `
Examples:
  midday products delete prod_abc123`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Deleting product...",
          () =>
            del(`/invoice-products/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted product ${chalk.bold(id)}\n`,
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
