import type { z } from "zod";

/**
 * Parses a Zod error and returns a formatted error message.
 *
 * @param err - The Zod error object to parse.
 * @returns A string containing the formatted error message.
 *
 * @description
 * This function attempts to parse the Zod error message, which is typically
 * a JSON string containing an array of error objects. It extracts the first
 * error from the array and formats it as a string in the format:
 * "path.to.field: error message"
 *
 * If the parsing fails (e.g., if the error message is not in the expected
 * JSON format), it falls back to returning the original error message.
 *
 * @example
 * ```typescript
 * import { z } from "zod";
 * import { parseZodErrorMessage } from "./zod-error";
 *
 * const schema = z.object({ name: z.string() });
 * const result = schema.safeParse({ name: 123 });
 *
 * if (!result.success) {
 *   console.log(parseZodErrorMessage(result.error));
 *   // Output: "name: Expected string, received number"
 * }
 * ```
 *
 * @throws {Error} This function doesn't throw errors itself, but errors from
 * JSON.parse() are caught and handled internally.
 */
export function parseZodErrorMessage(err: z.ZodError): string {
  try {
    const arr = JSON.parse(err.message) as Array<{
      message: string;
      path: Array<string>;
    }>;
    const { path, message } = arr[0];
    return `${path.join(".")}: ${message}`;
  } catch {
    return err.message;
  }
}
