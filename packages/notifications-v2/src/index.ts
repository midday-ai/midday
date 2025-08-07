import type { Database } from "@midday/db/client";
import { createActivity } from "@midday/db/queries";
import type { NotificationOptions, NotificationResult } from "./base";
import { createActivitySchema } from "./schemas";
import { EmailService } from "./services/email-service";

// Import all notification type handlers
import { transactionsCreated } from "./types/transactions-created";
import { transactionsEnriched } from "./types/transactions-enriched";
// Add more imports as you create new notification types

const handlers = {
  transactions_created: transactionsCreated,
  transactions_enriched: transactionsEnriched,
} as const;

// Auto-generated type map for full type safety
export type NotificationTypes = {
  [K in keyof typeof handlers]: Parameters<
    (typeof handlers)[K]["schema"]["parse"]
  >[0];
};

export class Notifications {
  private emailService: EmailService;

  constructor(private db: Database) {
    this.emailService = new EmailService(db);
  }

  async send<T extends keyof NotificationTypes>(
    type: T,
    data: NotificationTypes[T],
    options?: NotificationOptions,
  ): Promise<NotificationResult> {
    const handler = handlers[type];
    if (!handler) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    try {
      // Validate input data with the handler's schema
      const validatedData = handler.schema.parse(data);

      // Generate a single group ID for all related activities
      const groupId = crypto.randomUUID();

      // ALWAYS create activities (guaranteed to happen)
      const activities = await Promise.all(
        validatedData.users.map((user) => {
          const activityInput = (handler as any).createActivity(
            validatedData,
            user,
          );

          // Apply runtime priority override if provided
          if (options?.priority !== undefined) {
            activityInput.priority = options.priority;
          }

          // Add the group ID to link related activities
          activityInput.groupId = groupId;

          // Validate with Zod schema
          const validatedActivity = createActivitySchema.parse(activityInput);

          // Create activity directly using DB query
          return createActivity(this.db, validatedActivity);
        }),
      );

      // CONDITIONALLY send emails
      let emails = { sent: 0, skipped: validatedData.users.length, failed: 0 };
      const skipEmail = options?.skipEmail ?? false;

      if (handler.email && !skipEmail) {
        const emailInputs = validatedData.users.map((user) => {
          const baseEmailInput: any = {
            template: handler.email!.template,
            subject: handler.email!.subject,
            user,
            data: handler.createEmail
              ? (handler as any).createEmail(validatedData, user).data
              : validatedData,
          };

          // Add handler-level email options
          if (handler.email!.from) {
            baseEmailInput.from = handler.email!.from;
          }

          if (handler.email!.replyTo) {
            baseEmailInput.replyTo = handler.email!.replyTo;
          }

          // Apply runtime options (highest priority)
          if (options?.from) {
            baseEmailInput.from = options.from;
          }

          if (options?.replyTo) {
            baseEmailInput.replyTo = options.replyTo;
          }

          if (options?.headers) {
            baseEmailInput.headers = {
              ...baseEmailInput.headers,
              ...options.headers,
            };
          }

          // If handler has createEmail, it can override these settings
          if (handler.createEmail) {
            const customEmail = (handler as any).createEmail(
              validatedData,
              user,
            );
            return {
              ...baseEmailInput,
              ...customEmail,
              // But runtime options still take precedence
              ...(options?.from && { from: options.from }),
              ...(options?.replyTo && { replyTo: options.replyTo }),
              ...(options?.headers && {
                headers: { ...customEmail.headers, ...options.headers },
              }),
            };
          }

          return baseEmailInput;
        });

        emails = await this.emailService.sendBulk(emailInputs);
      }

      return {
        type: type as string,
        activities: activities.length,
        emails,
      };
    } catch (error) {
      console.error(`Failed to send notification ${type}:`, error);
      throw error;
    }
  }
}

// Export types and base classes for extending
export type {
  NotificationHandler,
  UserData,
  EmailInput,
  NotificationOptions,
  NotificationResult,
} from "./base";
export { userSchema, transactionSchema, invoiceSchema } from "./base";

// Export the main class as default
export default Notifications;
