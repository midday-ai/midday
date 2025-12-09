import type { Database } from "@midday/db/client";
import type { Activity } from "@midday/db/queries";
import type { CreateEmailOptions } from "resend";
import { z } from "zod";
import type { CreateActivityInput } from "./schemas";

export interface TeamContext {
  id: string;
  name: string;
  inboxId: string;
}

export interface NotificationHandler<T = any> {
  schema: z.ZodSchema<T>;
  email?: {
    template: string;
    subject: string;
    from?: string;
    replyTo?: string;
  };
  createActivity: (data: T, user: UserData) => CreateActivityInput;
  createEmail?: (
    data: T,
    user: UserData,
    team: TeamContext,
  ) => Partial<Omit<CreateEmailOptions, "template">> & {
    data: Record<string, any>;
    template?: string;
    emailType: "customer" | "team" | "owners"; // Explicit: customer emails go to external recipients, team emails go to all team members, owners emails go to team owners only
  };
  /**
   * Optional: Define combining behavior for this notification type
   * Allows multiple notifications of the same type to be combined into a single notification
   */
  combine?: {
    /**
     * Find an existing activity to combine with
     * Should return null if no suitable activity is found
     */
    findExisting: (
      db: Database,
      data: T,
      user: UserData,
    ) => Promise<Activity | null>;
    /**
     * Merge metadata from new notification into existing activity
     * Receives the metadata objects (not the full activity data) from both
     * existing and incoming activities, and returns the merged metadata object
     */
    mergeMetadata: (
      existing: Record<string, any>,
      incoming: Record<string, any>,
    ) => Record<string, any>;
  };
}

export interface UserData {
  id: string;
  full_name?: string;
  email: string;
  locale?: string;
  avatar_url?: string;
  team_id: string;
  role?: "owner" | "member";
}

// Combine template data with all Resend options using intersection type
export type EmailInput = {
  template?: string;
  user: UserData;
  data: Record<string, any>;
} & Partial<Omit<CreateEmailOptions, "template">>;

// Use intersection type to combine our options with Resend's CreateEmailOptions
export type NotificationOptions = {
  priority?: number;
  sendEmail?: boolean;
} & Partial<CreateEmailOptions>;

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
  role: z.enum(["owner", "member"]).optional(),
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
