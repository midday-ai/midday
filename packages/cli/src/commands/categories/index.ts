import chalk from "chalk";
import { Command } from "commander";
import { del, get, post, put } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Category {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
}

export function createCategoriesCommand(): Command {
  const cmd = new Command("categories").description(
    "Manage transaction categories",
  );

  cmd
    .command("list")
    .description("List categories")
    .addHelpText(
      "after",
      `
Examples:
  midday categories list
  midday categories list --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching categories...",
          () =>
            get<{ data: Category[] }>("/categories", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const categories = data.data || [];

        if (format === "json") {
          printJsonList(categories);
        } else {
          const rows = categories.map((c) => [
            c.name,
            c.slug,
            c.description || null,
          ]);

          printTable({
            title: `Categories (${categories.length})`,
            head: ["Name", "Slug", "Description"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a new category")
    .requiredOption("--name <name>", "Category name")
    .option("--description <text>", "Category description")
    .option("--color <hex>", "Color hex code")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday categories create --name "Software" --color "#4F46E5"
  midday categories create --name "Travel" --description "Business travel expenses"`,
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
          if (opts.description) body.description = opts.description;
          if (opts.color) body.color = opts.color;
        }

        const cat = await withSpinner(
          "Creating category...",
          () =>
            post<Category>("/categories", body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(cat);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created category ${chalk.bold(cat.name)} (${cat.slug})\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("update")
    .description("Update a category")
    .argument("<id>", "Category ID")
    .option("--name <name>", "New name")
    .option("--description <text>", "New description")
    .option("--color <hex>", "New color")
    .option("--stdin", "Read JSON body from stdin")
    .addHelpText(
      "after",
      `
Examples:
  midday categories update cat_abc123 --name "Office Supplies"
  midday categories update cat_abc123 --color "#10B981"`,
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
          if (opts.description) body.description = opts.description;
          if (opts.color) body.color = opts.color;
        }

        const cat = await withSpinner(
          "Updating category...",
          () =>
            put<Category>(`/categories/${id}`, body, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(cat);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Updated category ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a category")
    .argument("<id>", "Category ID")
    .option("--yes, -y", "Skip confirmation")
    .addHelpText(
      "after",
      `
Examples:
  midday categories delete cat_abc123
  midday categories delete cat_abc123 --yes`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Deleting category...",
          () =>
            del(`/categories/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted category ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
