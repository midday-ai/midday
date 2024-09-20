import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";

import { Database } from "@midday/supabase/types";

/**
 * Generates a unique identifier of specified length.
 *
 * @param length - The desired length of the unique identifier.
 * @returns A string containing a random alphanumeric identifier.
 */
function generateUniqueId(length: number): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Logs a message with a unique identifier to prevent cache key conflicts.
 * This function appends a unique identifier to each log message, ensuring
 * that log entries remain distinct even if the message content is identical.
 *
 * @param io - The I/O context for logging, which includes Supabase integration.
 * @param level - The log level to use ('info', 'warn', or 'error').
 * @param message - The main message to be logged.
 * @param data - Additional data to be included with the log entry. Defaults to an empty object.
 *
 * @throws Will throw an error if the logging operation fails.
 *
 * @example
 * ```typescript
 * await uniqueLog(io, 'info', 'User logged in', { userId: '123' });
 * // Logs: "User logged in [a1b2c3]" with additional data { userId: '123' }
 * ```
 */
export async function uniqueLog(
  io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>,
  level: "info" | "warn" | "error",
  message: string,
  data: Record<string, any> = {}
): Promise<void> {
  const uniqueId = generateUniqueId(6);
  await io.logger[level](`${message} [${uniqueId}]`, data);
}
