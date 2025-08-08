import { z } from "zod";
import type { CreateActivityInput } from "./schemas";

export interface NotificationHandler<T = any> {
  schema: z.ZodSchema<T>;
  activityType: string;
  defaultPriority: number;
  email?: {
    template: string;
    subject: string;
    from?: string;
    replyTo?: string;
  };
  createActivity: (data: T, user: UserData) => CreateActivityInput;
  createEmail?: (data: T, user: UserData) => EmailInput;
}

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  locale?: string;
  avatar_url?: string;
  team_id: string;
  team_name: string;
  team_inbox_id: string;
}

export interface EmailInput {
  template: string;
  subject: string;
  user: UserData;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface NotificationOptions {
  priority?: number;
  sendEmail?: boolean;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface NotificationResult {
  type: string;
  activities: number;
  emails: {
    sent: number;
    skipped: number;
    failed?: number;
  };
}

// Common schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  locale: z.string().optional(),
  avatar_url: z.string().optional(),
  team_id: z.string().uuid(),
  team_name: z.string(),
  team_inbox_id: z.string(),
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
