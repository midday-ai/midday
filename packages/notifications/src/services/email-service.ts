import type { Database } from "@midday/db/client";
import { shouldSendNotification } from "@midday/db/queries";
import ApiKeyCreatedEmail from "@midday/email/emails/api-key-created";
import AppInstalledEmail from "@midday/email/emails/app-installed";
import AppReviewRequestEmail from "@midday/email/emails/app-review-request";
import ConnectionExpireEmail from "@midday/email/emails/connection-expire";
import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import GetStartedEmail from "@midday/email/emails/get-started";
import InviteEmail from "@midday/email/emails/invite";
import InvoiceEmail from "@midday/email/emails/invoice";
import InvoiceOverdueEmail from "@midday/email/emails/invoice-overdue";
import InvoicePaidEmail from "@midday/email/emails/invoice-paid";
import InvoiceReminderEmail from "@midday/email/emails/invoice-reminder";
import TransactionsEmail from "@midday/email/emails/transactions";
import TrialEndedEmail from "@midday/email/emails/trial-ended";
import TrialExpiringEmail from "@midday/email/emails/trial-expiring";
import WelcomeEmail from "@midday/email/emails/welcome";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import { nanoid } from "nanoid";
import { type CreateEmailOptions, Resend } from "resend";
import type { EmailInput } from "../base";

export class EmailService {
  private client: Resend;

  constructor(private db: Database) {
    this.client = new Resend(process.env.RESEND_API_KEY!);
  }

  async sendBulk(emails: EmailInput[], notificationType: string) {
    if (emails.length === 0) {
      return {
        sent: 0,
        skipped: 0,
        failed: 0,
      };
    }

    const eligibleEmails = await this.#filterEligibleEmails(
      emails,
      notificationType,
    );

    if (eligibleEmails.length === 0) {
      return {
        sent: 0,
        skipped: emails.length,
        failed: 0,
      };
    }

    const emailPayloads = eligibleEmails.map((email) =>
      this.#buildEmailPayload(email),
    );

    try {
      const response = await this.client.batch.send(emailPayloads);

      if (response.error) {
        console.error("Failed to send emails:", response.error);
        return {
          sent: 0,
          skipped: emails.length - eligibleEmails.length,
          failed: eligibleEmails.length,
        };
      }

      return {
        sent: eligibleEmails.length,
        skipped: emails.length - eligibleEmails.length,
        failed: 0,
      };
    } catch (error) {
      console.error("Failed to send emails:", error);
      return {
        sent: 0,
        skipped: 0,
        failed: eligibleEmails.length,
      };
    }
  }

  async #filterEligibleEmails(emails: EmailInput[], notificationType: string) {
    const eligibleEmails = await Promise.all(
      emails.map(async (email) => {
        const shouldSend = await shouldSendNotification(
          this.db,
          email.user.id,
          email.user.team_id,
          notificationType,
          "email",
        );

        return shouldSend ? email : null;
      }),
    );

    return eligibleEmails.filter(Boolean) as EmailInput[];
  }

  #buildEmailPayload(email: EmailInput): CreateEmailOptions {
    const { t } = getI18n({ locale: email.user.locale ?? "en" });
    const template = this.#getTemplate(email.template);

    const html = render(
      template({
        ...email.data,
        locale: email.user.locale ?? "en",
        fullName: email.user.full_name,
      }),
    );

    const payload: CreateEmailOptions = {
      from: email.from || "Midday <middaybot@midday.ai>",
      to: [email.user.email],
      subject: t(email.subject),
      html,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
        ...email.headers,
      },
    };

    if (email.replyTo) {
      payload.replyTo = email.replyTo;
    }

    return payload;
  }

  #getTemplate(templateName: string) {
    const templates = {
      "api-key-created": ApiKeyCreatedEmail,
      "app-installed": AppInstalledEmail,
      "app-review-request": AppReviewRequestEmail,
      "connection-expire": ConnectionExpireEmail,
      "connection-issue": ConnectionIssueEmail,
      "get-started": GetStartedEmail,
      invite: InviteEmail,
      invoice: InvoiceEmail,
      "invoice-overdue": InvoiceOverdueEmail,
      "invoice-paid": InvoicePaidEmail,
      "invoice-reminder": InvoiceReminderEmail,
      transactions: TransactionsEmail,
      "trial-ended": TrialEndedEmail,
      "trial-expiring": TrialExpiringEmail,
      welcome: WelcomeEmail,
    };

    const template = templates[templateName as keyof typeof templates];

    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    return template;
  }
}
