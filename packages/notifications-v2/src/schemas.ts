import { z } from "zod";

export const createActivitySchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  type: z.enum(["transactions_created", "transactions_enriched", "inbox_new"]),
  source: z.enum(["system", "user"]).default("system"),
  priority: z.number().int().min(1).max(10).default(5),
  groupId: z.string().uuid().optional(), // Links related activities together
  metadata: z.record(z.any()), // Flexible - any JSON object
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const userSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
    email: z.string().email(),
    locale: z.string().optional(),
    avatar_url: z.string().optional(),
  }),
  team_id: z.string().uuid(),
  team: z.object({
    name: z.string(),
    inbox_id: z.string(),
  }),
});

export const transactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  currency: z.string(),
  date: z.string(),
  category: z.string().optional(),
  status: z.string().optional(),
});

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string(),
  amount: z.number(),
  currency: z.string(),
  due_date: z.string(),
  status: z.string(),
});

export const transactionsCreatedSchema = z.object({
  users: z.array(userSchema),
  transactions: z.array(transactionSchema),
});

export const inboxItemSchema = z.object({
  totalCount: z.number(),
  syncType: z.enum(["manual", "automatic"]),
  provider: z.string(),
});

export const inboxNewSchema = z.object({
  users: z.array(userSchema),
  totalCount: z.number(),
  source: z.enum(["email", "sync", "slack", "upload"]),
  syncType: z.enum(["manual", "automatic"]).optional(),
  provider: z.string().optional(),
});

export type UserData = z.infer<typeof userSchema>;
export type TransactionData = z.infer<typeof transactionSchema>;
export type InvoiceData = z.infer<typeof invoiceSchema>;
export type TransactionsCreatedInput = z.infer<
  typeof transactionsCreatedSchema
>;

export type InboxItemData = z.infer<typeof inboxItemSchema>;
export type InboxNewInput = z.infer<typeof inboxNewSchema>;
