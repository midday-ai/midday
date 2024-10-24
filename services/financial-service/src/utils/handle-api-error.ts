import { handleError } from "@/errors";
import { Context } from "hono";

/**
 * Handles API errors by wrapping them in a consistent error response.
 *
 * @param error - The error object to be handled. This can be of any type,
 *                but is typically an Error instance or unknown.
 * @param c - The Hono context object, which provides access to the
 *            request and response objects.
 *
 * @returns A Response object that can be sent back to the client.
 *
 * @description
 * This function acts as a centralized error handler for API routes.
 * It differentiates between Error instances and other types of errors:
 *
 * - If the error is an instance of Error, it passes it directly to the
 *   handleError function.
 * - If the error is not an Error instance (e.g., a string, number, or
 *   undefined), it wraps it in a new Error object with a generic message
 *   before passing it to handleError.
 *
 * This ensures that all errors are consistently handled and formatted
 * before being sent back to the client.
 *
 * @example
 * ```
 * import { Context } from "hono";
 * import { handleApiError } from "@/utils/handle-api-error";
 *
 * export const someApiRoute = async (c: Context) => {
 *   try {
 *     // Some API logic that might throw an error
 *   } catch (error) {
 *     return handleApiError(error, c);
 *   }
 * };
 * ```
 */
export function handleApiError(error: unknown, c: Context): Response {
  if (error instanceof Error) {
    return handleError(error, c);
  } else {
    return handleError(new Error("An unknown error occurred"), c);
  }
}
