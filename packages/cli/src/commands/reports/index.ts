import { Command } from "commander";
import { get } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

export function createReportsCommand(): Command {
  const cmd = new Command("reports").description(
    "Revenue, profit, burn rate, and more",
  );

  cmd
    .command("revenue")
    .description("Revenue report")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports revenue --from 2026-01-01 --to 2026-03-31
  midday reports revenue --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Generating revenue report...",
          () =>
            get<{
              summary: {
                currentTotal: number;
                prevTotal: number;
                currency: string;
              };
            }>(
              "/reports/revenue",
              {
                from: opts.from,
                to: opts.to,
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          printDetail("Revenue Report", [
            [
              "Current Total",
              formatCurrency(
                data.summary?.currentTotal,
                data.summary?.currency,
              ),
            ],
            [
              "Previous Total",
              formatCurrency(data.summary?.prevTotal, data.summary?.currency),
            ],
            ["Currency", data.summary?.currency],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("profit")
    .description("Profit report")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports profit --from 2026-01-01 --to 2026-03-31
  midday reports profit --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Generating profit report...",
          () =>
            get<{
              summary: {
                currentTotal: number;
                prevTotal: number;
                currency: string;
              };
            }>(
              "/reports/profit",
              {
                from: opts.from,
                to: opts.to,
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          printDetail("Profit Report", [
            [
              "Current Total",
              formatCurrency(
                data.summary?.currentTotal,
                data.summary?.currency,
              ),
            ],
            [
              "Previous Total",
              formatCurrency(data.summary?.prevTotal, data.summary?.currency),
            ],
            ["Currency", data.summary?.currency],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("burn-rate")
    .description("Monthly burn rate")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports burn-rate --from 2026-01-01 --to 2026-03-31
  midday reports burn-rate --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Generating burn rate report...",
          () =>
            get<{ date: string; value: number; currency: string }[]>(
              "/reports/burn-rate",
              {
                from: opts.from,
                to: opts.to,
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          const items = Array.isArray(data) ? data : [];
          if (items.length > 0) {
            const rows = items.map((r) => [
              r.date,
              formatCurrency(r.value, r.currency),
              r.currency,
            ]);
            printTable({
              title: "Burn Rate",
              head: ["Month", "Amount", "Currency"],
              rows,
            });
          } else {
            printDetail("Burn Rate", [["Data", "No data available"]]);
          }
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("runway")
    .description("Cash runway estimate")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports runway
  midday reports runway --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const months = await withSpinner(
          "Calculating runway...",
          () =>
            get<number>(
              "/reports/runway",
              {
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson({ months });
        } else {
          printDetail("Runway", [["Months Remaining", months]]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("expenses")
    .description("Expense breakdown")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports expenses --from 2026-01-01 --to 2026-03-31
  midday reports expenses --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Generating expenses report...",
          () =>
            get<{
              summary: { averageExpense: number; currency: string };
            }>(
              "/reports/expenses",
              {
                from: opts.from,
                to: opts.to,
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          printDetail("Expenses Report", [
            [
              "Average Expense",
              formatCurrency(
                data.summary?.averageExpense,
                data.summary?.currency,
              ),
            ],
            ["Currency", data.summary?.currency],
          ]);
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("spending")
    .description("Spending by category")
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports spending --from 2026-01-01 --to 2026-03-31
  midday reports spending --json`,
    )
    .action(async (opts, command) => {
      const globals = (command.parent?.parent?.opts() as GlobalFlags) ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Generating spending report...",
          () =>
            get<
              {
                name: string;
                amount: number;
                currency: string;
                percentage: number;
              }[]
            >(
              "/reports/spending",
              {
                from: opts.from,
                to: opts.to,
                currency: opts.currency,
              },
              { apiUrl: globals.apiUrl, debug: globals.debug },
            ),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          const items = Array.isArray(data) ? data : [];
          if (items.length > 0) {
            const rows = items.map((r) => [
              r.name,
              formatCurrency(r.amount, r.currency),
              `${r.percentage.toFixed(1)}%`,
            ]);
            printTable({
              title: "Spending by Category",
              head: ["Category", "Amount", "Percentage"],
              rows,
            });
          } else {
            printDetail("Spending", [["Data", "No data available"]]);
          }
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  return cmd;
}

function formatCurrency(
  amount: number | null | undefined,
  currency?: string,
): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}
