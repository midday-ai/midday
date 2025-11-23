import { z } from "zod";

export const trackerFilterSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "The project name or description to search for. Only use this if the prompt mentions a specific project or description.",
    ),
  start: z.coerce
    .string()
    .optional()
    .describe(
      "The start date in ISO-8601 format. Only set this if the prompt explicitly mentions a date range or time period (e.g., 'this month', 'last year').",
    ),
  end: z.coerce
    .string()
    .optional()
    .describe(
      "The end date in ISO-8601 format. Only set this if the prompt explicitly mentions a date range or time period. Do NOT default to current date unless explicitly requested.",
    ),
  status: z
    .enum(["in_progress", "completed"])
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions tracker status (e.g., 'completed projects', 'in progress').",
    ),
  tags: z
    .array(z.string())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions tag names from the available tags list.",
    ),
  customers: z
    .array(z.string())
    .optional()
    .describe(
      "Only set this if the prompt explicitly mentions customer names from the available customers list.",
    ),
});

export type TrackerFilterSchema = z.infer<typeof trackerFilterSchema>;

export const trackerFilterOutputSchema = z.object({
  q: z.string().nullable(),
  customers: z.array(z.string()).nullable(),
  status: z.enum(["in_progress", "completed"]).nullable(),
  tags: z.array(z.string()).nullable(),
  start: z.string().nullable(),
  end: z.string().nullable(),
});

export type TrackerFilterOutput = z.infer<typeof trackerFilterOutputSchema>;
