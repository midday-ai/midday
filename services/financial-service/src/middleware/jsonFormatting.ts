import { prettyJSON } from "hono/pretty-json";

/**
 * JSON formatting middleware
 *
 * @description Formats JSON responses for better readability
 */
export const jsonFormattingMiddleware = prettyJSON();
