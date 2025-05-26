import { z } from "@hono/zod-openapi";

export const getTrackerProjectsSchema = z
  .object({
    cursor: z.string().nullable().optional(),
    pageSize: z.coerce.number().min(1).max(100).optional(),
    filter: z
      .object({
        q: z.string().nullable().optional(),
        start: z.string().nullable().optional(),
        end: z.string().nullable().optional(),
        status: z.enum(["in_progress", "completed"]).nullable().optional(),
        customers: z.array(z.string()).nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
      })
      .optional(),
    sort: z.array(z.string()).nullable().optional(),
  })
  .optional();

export const upsertTrackerProjectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  estimate: z.number().nullable().optional(),
  billable: z.boolean().nullable().optional().default(false),
  rate: z.number().min(1).nullable().optional(),
  currency: z.string().nullable().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
  customerId: z.string().uuid().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        value: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export const deleteTrackerProjectSchema = z.object({ id: z.string().uuid() });

export const getTrackerProjectByIdSchema = z.object({ id: z.string().uuid() });
