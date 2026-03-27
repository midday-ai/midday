import { Command } from "commander";
import { get } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson } from "../../output/json.js";
import { printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
}

export function createSearchCommand(): Command {
  const cmd = new Command("search")
    .description("Search across everything")
    .argument("<query>", "Search query")
    .addHelpText(
      "after",
      `
Examples:
  midday search "Acme"
  midday search "office supplies" --json
  midday search "INV-001"`,
    )
    .action(async (query: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          `Searching "${query}"...`,
          () =>
            get<{ data: SearchResult[] }>(
              "/search",
              { q: query },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        const results = data.data || [];

        if (format === "json") {
          printJson(results);
        } else if (results.length === 0) {
          console.log(`\n  No results found for "${query}"\n`);
        } else {
          const rows = results.map((r) => [
            r.type,
            r.title,
            r.subtitle || null,
            r.id,
          ]);

          printTable({
            title: `Search Results (${results.length})`,
            head: ["Type", "Title", "Detail", "ID"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}
