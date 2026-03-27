import chalk from "chalk";
import type { OutputFormat } from "../output/formatter.js";
import { printJsonError } from "../output/json.js";

export class CLIError extends Error {
  public readonly exitCode: number;
  public readonly hint?: string;

  constructor(message: string, opts?: { exitCode?: number; hint?: string }) {
    super(message);
    this.name = "CLIError";
    this.exitCode = opts?.exitCode ?? 1;
    this.hint = opts?.hint;
  }
}

export class AuthRequiredError extends CLIError {
  constructor() {
    super("Not logged in. Run `midday auth login` to authenticate.", {
      exitCode: 1,
      hint: "midday auth login",
    });
  }
}

export class APIError extends CLIError {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string, hint?: string) {
    super(message, { exitCode: 1, hint });
    this.status = status;
    this.code = code;
  }
}

export function handleError(error: unknown, format: OutputFormat): never {
  if (error instanceof CLIError) {
    if (format === "json") {
      const code = error instanceof APIError ? error.code : "cli_error";
      printJsonError(code, error.message);
    } else {
      console.error(`\n  ${chalk.red("error")} ${error.message}`);
      if (error.hint) {
        console.error(`  ${chalk.dim(error.hint)}`);
      }
      console.error();
    }
    process.exit(error.exitCode);
  }

  if (format === "json") {
    const message = error instanceof Error ? error.message : String(error);
    printJsonError("unexpected_error", message);
  } else {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n  ${chalk.red("error")} ${message}\n`);
  }

  process.exit(1);
}
