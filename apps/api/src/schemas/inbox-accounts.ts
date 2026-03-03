import { z } from "@hono/zod-openapi";

const MAX_SYNC_MONTHS = 12;

export const connectInboxAccountSchema = z.object({
  provider: z.enum(["gmail", "outlook"]),
  redirectPath: z.string().optional(),
});

export const exchangeCodeForAccountSchema = z.object({
  code: z.string(),
  provider: z.enum(["gmail", "outlook"]),
});

export const deleteInboxAccountSchema = z.object({ id: z.string() });

export const syncInboxAccountSchema = z.object({
  id: z.string(),
  manualSync: z.boolean().optional(),
  syncStartDate: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) return false;
        const limit = new Date();
        limit.setMonth(limit.getMonth() - MAX_SYNC_MONTHS);
        return date >= limit;
      },
      {
        message: `Sync start date cannot be more than ${MAX_SYNC_MONTHS} months in the past`,
      },
    ),
  maxResults: z.number().optional(),
});
