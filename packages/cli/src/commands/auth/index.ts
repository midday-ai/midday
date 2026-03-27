import chalk from "chalk";
import { Command } from "commander";
import {
  getAuthStatus,
  loginWithBrowser,
  loginWithToken,
  logout,
} from "../../client/auth.js";
import { type GlobalFlags, resolveFormat } from "../../output/formatter.js";
import { printJson } from "../../output/json.js";
import { printDetail } from "../../output/table.js";
import { withSpinner } from "../../ui/spinner.js";
import { handleError } from "../../utils/errors.js";

export function createAuthCommand(): Command {
  const auth = new Command("auth").description(
    "Login, logout, check auth status",
  );

  auth
    .command("login")
    .description("Authenticate with Midday")
    .option("--token-stdin", "Read API key from stdin instead of browser OAuth")
    .option("--no-browser", "Print auth URL instead of opening browser")
    .addHelpText(
      "after",
      `
Examples:
  midday auth login                          # OAuth via browser
  midday auth login --no-browser             # Print URL to open manually
  echo $KEY | midday auth login --token-stdin # Use API key from stdin
  MIDDAY_API_KEY=xxx midday transactions list # Skip login, use env var`,
    )
    .action(async (opts: { tokenStdin?: boolean; browser?: boolean }) => {
      const globals = auth.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      try {
        if (opts.tokenStdin) {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) {
            chunks.push(chunk as Buffer);
          }
          const token = Buffer.concat(chunks).toString("utf-8").trim();

          if (!token) {
            throw new Error("No token provided on stdin");
          }

          await withSpinner(
            "Verifying token...",
            () => loginWithToken(token),
            globals.quiet,
          );
        } else {
          await loginWithBrowser({ noBrowser: !opts.browser });
        }

        const status = getAuthStatus();

        if (format === "json") {
          printJson({
            authenticated: true,
            email: status.email,
            team: status.teamName,
          });
        } else {
          console.log(
            `\n  ${chalk.green("✓")} Logged in as ${chalk.bold(status.email || "unknown")}`,
          );
          if (status.teamName) {
            console.log(`  ${chalk.dim("Team:")} ${status.teamName}`);
          }

          console.log(`\n  ${chalk.dim("What's next?")}\n`);
          console.log(
            `  ${chalk.cyan("midday transactions list")}    View recent transactions`,
          );
          console.log(
            `  ${chalk.cyan("midday invoices list")}        View your invoices`,
          );
          console.log(
            `  ${chalk.cyan("midday tracker start")}        Start tracking time`,
          );
          console.log(
            `  ${chalk.cyan("midday inbox list")}            View your inbox`,
          );
          console.log(
            `  ${chalk.cyan("midday --help")}               See all commands`,
          );
          console.log();
        }
      } catch (error) {
        handleError(error, format);
      }
    });

  auth
    .command("logout")
    .description("Remove stored credentials")
    .addHelpText(
      "after",
      `
Examples:
  midday auth logout`,
    )
    .action(() => {
      const globals = auth.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      logout();

      if (format === "json") {
        printJson({ authenticated: false });
      } else {
        console.log(`\n  ${chalk.green("✓")} Logged out\n`);
      }
    });

  auth
    .command("status")
    .description("Check current authentication status")
    .addHelpText(
      "after",
      `
Examples:
  midday auth status
  midday auth status --json`,
    )
    .action(() => {
      const globals = auth.parent?.opts() as GlobalFlags;
      const format = resolveFormat(globals);

      const status = getAuthStatus();

      if (format === "json") {
        printJson(status);
      } else if (status.loggedIn) {
        printDetail("Auth Status", [
          ["Status", chalk.green("authenticated")],
          ["Email", status.email],
          ["Team", status.teamName],
        ]);
      } else {
        console.log(
          `\n  ${chalk.yellow("Not logged in")}. Run ${chalk.cyan("midday auth login")} to authenticate.\n`,
        );
      }
    });

  return auth;
}
