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
import { documentProcessed } from "./types/document-processed";
import { documentUploaded } from "./types/document-uploaded";
import { inboxAutoMatched } from "./types/inbox-auto-matched";
import { inboxCrossCurrencyMatched } from "./types/inbox-cross-currency-matched";
import { inboxNeedsReview } from "./types/inbox-needs-review";
import { inboxNew } from "./types/inbox-new";
import { invoiceCancelled } from "./types/invoice-cancelled";
import { invoiceCreated } from "./types/invoice-created";
import { invoiceOverdue } from "./types/invoice-overdue";
import { invoicePaid } from "./types/invoice-paid";
import { invoiceReminderSent } from "./types/invoice-reminder-sent";
import { invoiceScheduled } from "./types/invoice-scheduled";
import { invoiceSent } from "./types/invoice-sent";
import { transactionsAssigned } from "./types/transactions-assigned";
import { transactionsCategorized } from "./types/transactions-categorized";
import { transactionsCreated } from "./types/transactions-created";
import { transactionsExported } from "./types/transactions-exported";

const handlers = {
  transactions_created: transactionsCreated,
  transactions_exported: transactionsExported,
  transactions_categorized: transactionsCategorized,
  transactions_assigned: transactionsAssigned,
  document_uploaded: documentUploaded,
  document_processed: documentProcessed,
  inbox_new: inboxNew,
  inbox_auto_matched: inboxAutoMatched,
  inbox_needs_review: inboxNeedsReview,
  inbox_cross_currency_matched: inboxCrossCurrencyMatched,
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
      role: "owner" | "member" | null;
      fullName: string | null;
      avatarUrl: string | null;
      email: string | null;
      locale?: string | null;
    }>,
    teamId: string,
    teamInfo: { name: string | null; inboxId: string | null },
  ): UserData[] {
    return teamMembers.map((member) => ({
      id: member.id,
      full_name: member.fullName ?? undefined,
      avatar_url: member.avatarUrl ?? undefined,
      email: member.email ?? "",
      locale: member.locale ?? "en",
      team_id: teamId,
      role: member.role ?? "member",
    }));
  }

  async #createActivities<T extends keyof NotificationTypes>(
    handler: any,
    validatedData: NotificationTypes[T],
    groupId: string,
    notificationType: string,
    options?: NotificationOptions,
  ) {
    const activityPromises = await Promise.all(
      validatedData.users.map(async (user: UserData) => {
        const activityInput = handler.createActivity(validatedData, user);

        // Check if user wants in-app notifications for this type
        const inAppEnabled = await shouldSendNotification(
          this.db,
          user.id,
          user.team_id,
          notificationType,
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
        activityInput.groupId = groupId;

        // Validate with Zod schema
        const validatedActivity = createActivitySchema.parse(activityInput);

        // Create activity directly using DB query
        return createActivity(this.db, validatedActivity);
      }),
    );

    return activityPromises.filter(Boolean);
  }

  #createEmailInput<T extends keyof NotificationTypes>(
    handler: any,
    validatedData: NotificationTypes[T],
    user: UserData,
    teamContext: { id: string; name: string; inboxId: string },
    options?: NotificationOptions,
  ): EmailInput {
    // Create email input using handler's createEmail function
    const customEmail = handler.createEmail(validatedData, user, teamContext);

    const baseEmailInput: EmailInput = {
      user,
      ...customEmail,
    };

    // Apply runtime options (highest priority)
    // Extract non-email options first
    const { priority, sendEmail, ...resendOptions } = options || {};
    if (Object.keys(resendOptions).length > 0) {
      Object.assign(baseEmailInput, resendOptions);
    }

    return baseEmailInput;
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
    const users = this.#toUserData(teamMembers, teamId, teamInfo);

    // Build the full notification data
    const data = { ...payload, users } as NotificationTypes[T];

    return this.#createInternal(type, data, options, teamInfo);
  }

  /**
   * Internal method that handles the actual notification creation and delivery logic
   */
  async #createInternal<T extends keyof NotificationTypes>(
    type: T,
    data: NotificationTypes[T],
    options?: NotificationOptions,
    teamInfo?: { id: string; name: string | null; inboxId: string | null },
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

      // Create activities for each user
      const activities = await this.#createActivities(
        handler,
        validatedData,
        groupId,
        type as string,
        options,
      );

      // CONDITIONALLY send emails
      let emails = {
        sent: 0,
        skipped: validatedData.users.length,
        failed: 0,
      };

      const sendEmail = options?.sendEmail ?? false;

      // Send emails if requested and handler supports email
      if (sendEmail && handler.createEmail) {
        const firstUser = validatedData.users[0];
        if (!firstUser) {
          throw new Error("No team members available for email context");
        }

        // Check the email type to determine behavior
        const teamContext = {
          id: teamInfo?.id || "",
          name: teamInfo?.name || "Team",
          inboxId: teamInfo?.inboxId || "",
        };
        const sampleEmail = handler.createEmail(
          validatedData,
          firstUser,
          teamContext,
        );

        if (sampleEmail.emailType === "customer") {
          // Customer-facing email: send regardless of team preferences
          const emailInputs = [
            this.#createEmailInput(
              handler,
              validatedData,
              firstUser,
              teamContext,
              options,
            ),
          ];

          emails = await this.#emailService.sendBulk(
            emailInputs,
            type as string,
          );

          console.log("📨 Email result for customer:", {
            sent: emails.sent,
            skipped: emails.skipped,
            failed: emails.failed || 0,
          });
        } else if (sampleEmail.emailType === "owners") {
          // Owners-only email: send to team owners only
          const ownerUsers = validatedData.users.filter(
            (user: UserData) => user.role === "owner",
          );

          const emailInputs = ownerUsers.map((user: UserData) =>
            this.#createEmailInput(
              handler,
              validatedData,
              user,
              teamContext,
              options,
            ),
          );

          console.log("📨 Email inputs for owners:", emailInputs.length);

          emails = await this.#emailService.sendBulk(
            emailInputs,
            type as string,
          );

          console.log("📨 Email result for owners:", {
            sent: emails.sent,
            skipped: emails.skipped,
            failed: emails.failed || 0,
          });
        } else {
          // Team-facing email: send to all team members
          const emailInputs = validatedData.users.map((user: UserData) =>
            this.#createEmailInput(
              handler,
              validatedData,
              user,
              teamContext,
              options,
            ),
          );

          console.log("📨 Email inputs for team:", emailInputs.length);

          emails = await this.#emailService.sendBulk(
            emailInputs,
            type as string,
          );

          console.log("📨 Email result for team:", {
            sent: emails.sent,
            skipped: emails.skipped,
            failed: emails.failed || 0,
          });
        }
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
  transactionsExportedSchema,
  documentUploadedSchema,
  documentProcessedSchema,
  inboxNewSchema,
  inboxAutoMatchedSchema,
  inboxNeedsReviewSchema,
  inboxCrossCurrencyMatchedSchema,
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
