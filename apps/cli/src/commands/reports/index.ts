import { Command } from "commander";
import { get } from "../../client/api.js";
import { resolveFormat, type GlobalFlags } from "../../output/formatter.js";
import { printJson } from "../../output/json.js";
import { printDetail } from "../../output/table.js";
import { handleError } from "../../utils/errors.js";
import { withSpinner } from "../../ui/spinner.js";

function createReportSubcommand(
  name: string,
  description: string,
  path: string,
  fields: [string, (data: Record<string, unknown>) => string | number | null | undefined][],
): Command {
  return new Command(name)
    .description(description)
    .option("--from <date>", "Start date (YYYY-MM-DD)")
    .option("--to <date>", "End date (YYYY-MM-DD)")
    .option("--currency <code>", "Currency code")
    .addHelpText(
      "after",
      `
Examples:
  midday reports ${name}
  midday reports ${name} --from 2026-01-01 --to 2026-03-31
  midday reports ${name} --json`,
    )
    .action(async (opts, command) => {
      const globals = command.parent?.parent?.opts() as GlobalFlags ?? {};
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          `Generating ${name} report...`,
          () =>
            get<Record<string, unknown>>(path, {
              start_date: opts.from,
              end_date: opts.to,
              currency: opts.currency,
            }, { apiUrl: globals.apiUrl, debug: globals.debug }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(data);
        } else {
          const displayFields = fields.map(
            ([label, extract]) => [label, extract(data)] as [string, string | number | null | undefined],
          );
          printDetail(`${description}`, displayFields);
        }
      } catch (error) {
        handleError(error, format);
      }
    });
}

export function createReportsCommand(): Command {
  const cmd = new Command("reports").description("Revenue, profit, burn rate, and more");

  const reportDefs: {
    name: string;
    desc: string;
    path: string;
    fields: [string, (d: Record<string, unknown>) => string | number | null | undefined][];
  }[] = [
    {
      name: "revenue",
      desc: "Revenue report",
      path: "/reports/revenue",
      fields: [
        ["Total Revenue", (d) => formatCurrency(d.total as number, d.currency as string)],
        ["Currency", (d) => d.currency as string],
      ],
    },
    {
      name: "profit",
      desc: "Profit report",
      path: "/reports/profit",
      fields: [
        ["Revenue", (d) => formatCurrency(d.revenue as number, d.currency as string)],
        ["Expenses", (d) => formatCurrency(d.expenses as number, d.currency as string)],
        ["Profit", (d) => formatCurrency(d.profit as number, d.currency as string)],
      ],
    },
    {
      name: "burn-rate",
      desc: "Monthly burn rate",
      path: "/reports/burn-rate",
      fields: [
        ["Burn Rate", (d) => formatCurrency(d.burn_rate as number, d.currency as string)],
        ["Currency", (d) => d.currency as string],
      ],
    },
    {
      name: "runway",
      desc: "Cash runway estimate",
      path: "/reports/runway",
      fields: [
        ["Months Remaining", (d) => d.months as number],
        ["Burn Rate", (d) => formatCurrency(d.burn_rate as number, d.currency as string)],
      ],
    },
    {
      name: "expenses",
      desc: "Expense breakdown",
      path: "/reports/expenses",
      fields: [
        ["Total Expenses", (d) => formatCurrency(d.total as number, d.currency as string)],
        ["Currency", (d) => d.currency as string],
      ],
    },
    {
      name: "spending",
      desc: "Spending by category",
      path: "/reports/spending",
      fields: [
        ["Total Spending", (d) => formatCurrency(d.total as number, d.currency as string)],
        ["Currency", (d) => d.currency as string],
      ],
    },
  ];

  for (const def of reportDefs) {
    cmd.addCommand(createReportSubcommand(def.name, def.desc, def.path, def.fields));
  }

  return cmd;
}

function formatCurrency(amount: number | null | undefined, currency?: string): string | null {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `${amount} ${currency || "USD"}`;
  }
}
