import { Database } from "@midday/supabase/types";
import { IOWithIntegrations } from "@trigger.dev/sdk";
import { Supabase } from "@trigger.dev/supabase";

/**
 * A unique logger class that ensures each log message has a unique identifier.
 * This class is designed to work with Trigger.dev's IO context and Supabase integration.
 */
export class ConsoleLogger {
  private io: IOWithIntegrations<{
    supabase: Supabase<Database, "public", any>;
  }>;

  /**
   * Creates an instance of ConsoleLogger.
   * @param io - The I/O context for logging, which includes Supabase integration.
   */
  constructor(
    io: IOWithIntegrations<{
      supabase: Supabase<Database, "public", any>;
    }>,
  ) {
    this.io = io;
  }

  /**
   * Generates a unique identifier of specified length.
   * @param length - The desired length of the unique identifier.
   * @returns A string containing a random alphanumeric identifier.
   */
  private generateUniqueId(length: number): string {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  /**
   * Logs a message with a unique identifier to prevent cache key conflicts.
   * This method appends a unique identifier to each log message, ensuring
   * that log entries remain distinct even if the message content is identical.
   *
   * @param level - The log level to use ('info', 'warn', or 'error').
   * @param message - The main message to be logged.
   * @param data - Additional data to be included with the log entry. Defaults to an empty object.
   *
   * @throws Will throw an error if the logging operation fails.
   *
   * @example
   * ```typescript
   * const logger = new ConsoleLogger(io);
   * await logger.log('info', 'User logged in', { userId: '123' });
   * // Logs: "User logged in [a1b2c3]" with additional data { userId: '123' }
   * ```
   */
  async log(
    level: "info" | "warn" | "error",
    message: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    const uniqueId = this.generateUniqueId(6);
    await this.io.logger[level](`${message} [${uniqueId}]`, data);
  }

  /**
   * Logs an info message with a unique identifier.
   *
   * @param message - The main message to be logged.
   * @param data - Additional data to be included with the log entry.
   */
  async info(message: string, data: Record<string, any> = {}): Promise<void> {
    await this.log("info", message, data);
  }

  /**
   * Logs a warning message with a unique identifier.
   *
   * @param message - The main message to be logged.
   * @param data - Additional data to be included with the log entry.
   */
  async warn(message: string, data: Record<string, any> = {}): Promise<void> {
    await this.log("warn", message, data);
  }

  /**
   * Logs an error message with a unique identifier.
   *
   * @param message - The main message to be logged.
   * @param data - Additional data to be included with the log entry.
   */
  async error(message: string, data: Record<string, any> = {}): Promise<void> {
    await this.log("error", message, data);
  }
}
