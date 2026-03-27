import ora, { type Ora } from "ora";
import { isTTY } from "../utils/env.js";

export function createSpinner(text: string, quiet = false): Ora {
  return ora({
    text,
    stream: process.stderr,
    isSilent: quiet || !isTTY(),
  });
}

export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  quiet = false,
): Promise<T> {
  const spinner = createSpinner(text, quiet);
  spinner.start();
  try {
    const result = await fn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
