import chalk from "chalk";
import { Command } from "commander";
import { del, get, post } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface Tag {
  id: string;
  name: string;
}

export function createTagsCommand(): Command {
  const cmd = new Command("tags").description("Manage tags");

  cmd
    .command("list")
    .description("List tags")
    .addHelpText(
      "after",
      `
Examples:
  midday tags list
  midday tags list --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching tags...",
          () =>
            get<{ data: Tag[] }>("/tags", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const tags = data.data || [];

        if (format === "json") {
          printJsonList(tags);
        } else {
          const rows = tags.map((t) => [t.name, t.id]);
          printTable({
            title: `Tags (${tags.length})`,
            head: ["Name", "ID"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("create")
    .description("Create a new tag")
    .requiredOption("--name <name>", "Tag name")
    .addHelpText(
      "after",
      `
Examples:
  midday tags create --name "Q1-2026"
  midday tags create --name "priority"`,
    )
    .action(async (opts) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const tag = await withSpinner(
          "Creating tag...",
          () =>
            post<Tag>(
              "/tags",
              { name: opts.name },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(tag);
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Created tag ${chalk.bold(tag.name)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("delete")
    .description("Delete a tag")
    .argument("<id>", "Tag ID")
    .option("--yes, -y", "Skip confirmation")
    .addHelpText(
      "after",
      `
Examples:
  midday tags delete tag_abc123`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        await withSpinner(
          "Deleting tag...",
          () =>
            del(`/tags/${id}`, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ deleted: true, id });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Deleted tag ${chalk.bold(id)}\n`,
          );
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
