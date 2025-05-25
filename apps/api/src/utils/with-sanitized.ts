import type { z } from "zod";

/**
 * Sanitizes data by removing properties that are not defined in the provided Zod schema
 * @param schema - The Zod schema to validate against
 * @param data - The data to sanitize
 * @returns The sanitized data containing only properties defined in the schema
 */
export function withSanitized<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  return schema.parse(data);
}
