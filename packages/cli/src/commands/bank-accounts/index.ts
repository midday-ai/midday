import { Command } from "commander";
import { get } from "../../client/api.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson, printJsonList } from "../../output/json.js";
import { printDetail, printTable } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

interface BankAccount {
  id: string;
  name: string;
  currency?: string;
  balance?: number | null;
  type?: string | null;
  enabled?: boolean;
  manual?: boolean;
}

export function createBankAccountsCommand(): Command {
  const cmd = new Command("bank-accounts").description(
    "View balances and account details",
  );

  cmd
    .command("list")
    .description("List connected bank accounts")
    .addHelpText(
      "after",
      `
Examples:
  midday bank-accounts list
  midday bank-accounts list --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching accounts...",
          () =>
            get<{ data: BankAccount[] }>("/bank-accounts", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const accounts = data.data || [];

        if (format === "json") {
          printJsonList(accounts);
        } else {
          const rows = accounts.map((a) => [
            a.name,
            a.currency || null,
            a.balance != null
              ? formatAmount(a.balance, a.currency || "USD")
              : null,
            a.type || null,
            a.enabled ? "yes" : "no",
          ]);

          printTable({
            title: `Bank Accounts (${accounts.length})`,
            head: ["Name", "Currency", "Balance", "Type", "Enabled"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("balances")
    .description("Show current balances for all accounts")
    .addHelpText(
      "after",
      `
Examples:
  midday bank-accounts balances
  midday bank-accounts balances --json`,
    )
    .action(async () => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const data = await withSpinner(
          "Fetching balances...",
          () =>
            get<{ data: BankAccount[] }>("/bank-accounts", undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        const accounts = (data.data || []).filter((a) => a.balance != null);

        if (format === "json") {
          printJsonList(
            accounts.map((a) => ({
              id: a.id,
              name: a.name,
              balance: a.balance,
              currency: a.currency,
            })),
          );
        } else {
          const rows = accounts.map((a) => [
            a.name,
            formatAmount(a.balance!, a.currency || "USD"),
            a.currency || null,
          ]);

          printTable({
            title: "Account Balances",
            head: ["Account", "Balance", "Currency"],
            rows,
          });
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  cmd
    .command("get")
    .description("Get details for a specific bank account")
    .argument("<id>", "Bank account ID")
    .addHelpText(
      "after",
      `
Examples:
  midday bank-accounts get acc_abc123
  midday bank-accounts get acc_abc123 --json`,
    )
    .action(async (id: string) => {
      const globals = cmd.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        const account = await withSpinner(
          "Fetching account...",
          () =>
            get<BankAccount>(`/bank-accounts/${id}`, undefined, {
              apiUrl: globals.apiUrl,
              debug: globals.debug,
            }),
          globals.quiet,
        );

        if (format === "json") {
          printJson(account);
        } else {
          printDetail(account.name, [
            ["ID", account.id],
            ["Type", account.type],
            ["Currency", account.currency],
            [
              "Balance",
              account.balance != null
                ? formatAmount(account.balance, account.currency || "USD")
                : null,
            ],
            ["Enabled", account.enabled ? "yes" : "no"],
          ]);
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
