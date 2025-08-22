import type { Database } from "@midday/db/client";
import { z } from "zod";

// Event context passed to all listeners
export interface EventContext {
  db: Database;
}

// Generic event listener interface
export interface EventListener<T = any> {
  handle(data: T, context: EventContext): Promise<void>;
}

// Zod schemas for event payloads
export const customerCreatedEventSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  customer: z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string(),
    website: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
  }),
});

export const transactionCategorizedEventSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  transaction: z.object({
    id: z.string().uuid(),
    categorySlug: z.string(),
  }),
  transactionIds: z.array(z.string().uuid()),
});

export const transactionAssignedEventSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  transaction: z.object({
    id: z.string().uuid(),
    assignedUserId: z.string().uuid(),
  }),
  transactionIds: z.array(z.string().uuid()),
});

// Activity event definitions (inferred from Zod schemas)
export interface ActivityEvents {
  "customer.created": z.infer<typeof customerCreatedEventSchema>;
  "transaction.categorized": z.infer<typeof transactionCategorizedEventSchema>;
  "transaction.assigned": z.infer<typeof transactionAssignedEventSchema>;
}

// Helper types
export type ActivityEventName = keyof ActivityEvents;
export type ActivityEventData<T extends ActivityEventName> = ActivityEvents[T];
