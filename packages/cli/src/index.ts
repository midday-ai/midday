import { Command } from "commander";
import { createAuthCommand } from "./commands/auth/index.js";
import { createBankAccountsCommand } from "./commands/bank-accounts/index.js";
import { createCategoriesCommand } from "./commands/categories/index.js";
import { createCustomersCommand } from "./commands/customers/index.js";
import { createDocumentsCommand } from "./commands/documents/index.js";
import { createInboxCommand } from "./commands/inbox/index.js";
import { createInvoicesCommand } from "./commands/invoices/index.js";
import { createProductsCommand } from "./commands/products/index.js";
import { createReportsCommand } from "./commands/reports/index.js";
import { createSearchCommand } from "./commands/search/index.js";
import { createTagsCommand } from "./commands/tags/index.js";
import { createTeamCommand } from "./commands/team/index.js";
import { createTrackerCommand } from "./commands/tracker/index.js";
import { createTransactionsCommand } from "./commands/transactions/index.js";
import { type GlobalFlags, resolveFormat } from "./output/formatter.js";
import { getBrandingText } from "./ui/branding.js";
import { isTTY } from "./utils/env.js";
import { handleError } from "./utils/errors.js";

const VERSION = "0.1.0";

export function createProgram(): Command {
  const program = new Command("midday")
    .version(VERSION, "-v, --version")
    .description("Midday CLI — run your business from the command line")
    .option("--json, -j", "Output as JSON (default when piped)")
    .option("--table", "Output as table (default when TTY)")
    .option("--agent", "Agent mode: JSON output, no prompts, no spinners")
    .option("--quiet, -q", "Suppress progress output")
    .option("--no-input", "Disable interactive prompts")
    .option("--yes, -y", "Skip confirmations")
    .option("--dry-run, -n", "Preview destructive actions without executing")
    .option("--api-url <url>", "Override API base URL")
    .option("--debug", "Verbose HTTP logging to stderr");

  program.addCommand(createAuthCommand());
  program.addCommand(createTransactionsCommand());
  program.addCommand(createInvoicesCommand());
  program.addCommand(createCustomersCommand());
  program.addCommand(createBankAccountsCommand());
  program.addCommand(createTrackerCommand());
  program.addCommand(createDocumentsCommand());
  program.addCommand(createInboxCommand());
  program.addCommand(createCategoriesCommand());
  program.addCommand(createTagsCommand());
  program.addCommand(createReportsCommand());
  program.addCommand(createTeamCommand());
  program.addCommand(createSearchCommand());
  program.addCommand(createProductsCommand());

  program.addHelpText(
    "after",
    `
Run midday <command> --help for detailed usage and examples.

Examples:
  midday auth login                              # Authenticate via browser
  midday transactions list --from 2026-01-01     # List recent transactions
  midday invoices create --customer cust_123     # Create a new invoice
  midday tracker start --project proj_abc        # Start time tracking
  midday reports revenue --json                  # Get revenue report as JSON
  midday search "office supplies"                # Search across everything`,
  );

  program.action(() => {
    if (isTTY()) {
      process.stdout.write(getBrandingText(VERSION));
    }
    program.outputHelp();
  });

  return program;
}

export async function run(argv?: string[]): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(argv || process.argv);
  } catch (error) {
    const flags = program.opts() as GlobalFlags;
    const format = resolveFormat(flags);
    handleError(error, format);
  }
}
