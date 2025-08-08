import type { Database } from "@midday/db/client";
import {
  createActivity,
  getTeamById,
  getTeamMembers,
  shouldSendNotification,
} from "@midday/db/queries";
import type {
  EmailInput,
  NotificationOptions,
  NotificationResult,
  UserData,
} from "./base";
import { type NotificationTypes, createActivitySchema } from "./schemas";
import { EmailService } from "./services/email-service";
import { inboxNew } from "./types/inbox-new";
import { invoiceCancelled } from "./types/invoice-cancelled";
import { invoiceCreated } from "./types/invoice-created";
import { invoiceOverdue } from "./types/invoice-overdue";
import { invoicePaid } from "./types/invoice-paid";
import { invoiceReminderSent } from "./types/invoice-reminder-sent";
import { invoiceScheduled } from "./types/invoice-scheduled";
import { invoiceSent } from "./types/invoice-sent";
import { transactionsCreated } from "./types/transactions-created";

const handlers = {
  transactions_created: transactionsCreated,
  inbox_new: inboxNew,
  invoice_paid: invoicePaid,
  invoice_overdue: invoiceOverdue,
  invoice_scheduled: invoiceScheduled,
  invoice_sent: invoiceSent,
  invoice_reminder_sent: invoiceReminderSent,
  invoice_cancelled: invoiceCancelled,
  invoice_created: invoiceCreated,
} as const;

export class Notifications {
  #emailService: EmailService;

  constructor(private db: Database) {
    this.#emailService = new EmailService(db);
  }

  #toUserData(
    teamMembers: Array<{
      id: string;
      fullName: string | null;
      avatarUrl: string | null;
      email: string | null;
      locale: string | null;
    }>,
    teamId: string,
    team: { name: string; inboxId: string },
  ): UserData[] {
    return teamMembers.map((member) => ({
      id: member.id,
      full_name: member.fullName!,
      avatar_url: member.avatarUrl ?? undefined,
      email: member.email!,
      locale: member.locale ?? "en",
      team_id: teamId,
      team_name: team.name,
      team_inbox_id: team.inboxId,
    }));
  }

  async create<T extends keyof NotificationTypes>(
    type: T,
    teamId: string,
    payload: Omit<NotificationTypes[T], "users">,
    options?: NotificationOptions,
  ): Promise<NotificationResult> {
    const [teamMembers, teamInfo] = await Promise.all([
      getTeamMembers(this.db, teamId),
      getTeamById(this.db, teamId),
    ]);

    if (!teamInfo) {
      throw new Error(`Team not found: ${teamId}`);
    }

    if (teamMembers.length === 0) {
      return {
        type: type as string,
        activities: 0,
        emails: { sent: 0, skipped: 0, failed: 0 },
      };
    }

    // Transform team members to UserData format
    const users = this.#toUserData(teamMembers, teamId, {
      name: teamInfo.name,
      inboxId: teamInfo.inboxId,
    });

    // Build the full notification data
    const data = { ...payload, users } as NotificationTypes[T];

    return this.#createInternal(type, data, options);
  }

  /**
   * Internal method that handles the actual notification creation and delivery logic
   */
  async #createInternal<T extends keyof NotificationTypes>(
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

      // Create activities - always create them but adjust priority based on in-app preferences
      const activityPromises = await Promise.all(
        validatedData.users.map(async (user: UserData) => {
          const activityInput = handler.createActivity(validatedData, user);

          // Check if user wants in-app notifications for this type
          const inAppEnabled = await shouldSendNotification(
            this.db,
            user.id,
            user.team_id,
            type as string,
            "in_app",
          );

          // Apply priority logic based on notification preferences
          let finalPriority = activityInput.priority;

          // Runtime priority override takes precedence
          if (options?.priority !== undefined) {
            finalPriority = options.priority;
          } else if (!inAppEnabled) {
            // If in-app notifications are disabled, set to low priority (7-10 range)
            // so it's not visible in the notification center
            finalPriority = Math.max(7, activityInput.priority + 4);
            finalPriority = Math.min(10, finalPriority); // Cap at 10
          }

          activityInput.priority = finalPriority;

          // Add the group ID to link related activities
          activityInput.groupId = groupId;

          // Validate with Zod schema
          const validatedActivity = createActivitySchema.parse(activityInput);

          // Create activity directly using DB query
          return createActivity(this.db, validatedActivity);
        }),
      );

      const activities = activityPromises.filter(Boolean);

      // CONDITIONALLY send emails
      let emails = { sent: 0, skipped: validatedData.users.length, failed: 0 };

      const sendEmail = options?.sendEmail ?? false;

      if (handler.email && sendEmail) {
        const emailInputs = validatedData.users.map((user: UserData) => {
          const baseEmailInput: EmailInput = {
            template: handler.email!.template,
            subject: handler.email!.subject,
            user,
            data: handler.createEmail
              ? handler.createEmail(validatedData, user).data
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
            const customEmail = handler.createEmail(validatedData, user);
            return {
              ...baseEmailInput,
              ...customEmail,
              ...(options?.from && { from: options.from }),
              ...(options?.replyTo && { replyTo: options.replyTo }),
              ...(options?.headers && {
                headers: { ...customEmail.headers, ...options.headers },
              }),
            };
          }

          return baseEmailInput;
        });

        emails = await this.#emailService.sendBulk(emailInputs, type as string);
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

// Export schemas and types
export {
  transactionsCreatedSchema,
  inboxNewSchema,
  invoicePaidSchema,
  invoiceOverdueSchema,
  invoiceScheduledSchema,
  invoiceSentSchema,
  invoiceReminderSentSchema,
  invoiceCancelledSchema,
  invoiceCreatedSchema,
} from "./schemas";
export type { NotificationTypes } from "./schemas";

// Export notification type definitions and utilities
export {
  getAllNotificationTypes,
  getUserSettingsNotificationTypes,
  getNotificationTypeByType,
  shouldShowInSettings,
  allNotificationTypes,
} from "./notification-types";
export type { NotificationType } from "./notification-types";
