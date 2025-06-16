import type { Database } from "@midday/db/client";
import type { Job } from "bullmq";
import {
  type EmailJobData,
  type InvoiceReminderData,
  type NotificationData,
  type TeamInviteData,
  emailJobSchema,
} from "../../types/email";
import { invoiceReminderTask } from "./invoice-reminder";
import { teamInviteTask } from "./team-invite";

// Main email task handler that routes to specific tasks
export async function emailTaskHandler(
  job: Job<EmailJobData>,
  db: Database,
): Promise<void> {
  // Validate the job data against the union schema
  const data = emailJobSchema.parse(job.data);

  // Route to the appropriate task based on type
  switch (data.type) {
    case "invoice_reminder":
      await invoiceReminderTask(job as Job<InvoiceReminderData>, db);
      break;

    case "team_invite":
      await teamInviteTask(job as Job<TeamInviteData>, db);
      break;

    default:
      // This should never happen due to Zod validation
      throw new Error(`Unknown email task type: ${(data as any).type}`);
  }
}
