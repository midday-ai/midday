import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

/**
 * Error handling middleware
 *
 * @description Catches and handles errors thrown during request processing
 * @param {Context} c - The Hono context object
 * @param {Next} next - The next middleware function
 * @returns {Promise<Response>} JSON response with error details
 */
export const errorHandlerMiddleware = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof HTTPException) {
      return c.json({ error: error.message }, error.status);
    }
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};