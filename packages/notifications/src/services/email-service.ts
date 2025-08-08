import type { Database } from "@midday/db/client";
import { shouldSendNotification } from "@midday/db/queries";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import { nanoid } from "nanoid";
import { type CreateEmailOptions, Resend } from "resend";
import type { EmailInput } from "../base";

export class EmailService {
  private resend: Resend;

  constructor(private db: Database) {
    this.resend = new Resend(process.env.RESEND_API_KEY!);
  }

  async sendBulk(emails: EmailInput[], notificationType: string) {
    if (emails.length === 0) {
      return { sent: 0, skipped: 0, failed: 0 };
    }

    const eligibleEmails = await Promise.all(
      emails.map(async (email) => {
        const shouldSend = await shouldSendNotification(
          this.db,
          email.user.user.id,
          email.user.team_id,
          notificationType,
          "email",
        );

        return shouldSend ? email : null;
      }),
    );

    const filteredEmails = eligibleEmails.filter(Boolean) as EmailInput[];

    if (filteredEmails.length === 0) {
      return {
        sent: 0,
        skipped: emails.length,
        failed: 0,
      };
    }

    // Prepare emails for Resend batch sending
    const resendEmails = filteredEmails.map((email) => {
      const { t } = getI18n({ locale: email.user.user.locale ?? "en" });

      // Dynamically import the email template
      const EmailTemplate = this.#getTemplates(email.template);

      const html = render(
        EmailTemplate({
          ...email.data,
          locale: email.user.user.locale ?? "en",
          fullName: email.user.user.full_name,
        }),
      );

      // Build email object with configurable options
      const emailOptions: CreateEmailOptions = {
        from: email.from || "Midday <middaybot@midday.ai>",
        to: [email.user.user.email],
        subject: t(email.subject),
        html,
        headers: {
          "X-Entity-Ref-ID": nanoid(),
          ...email.headers,
        },
      };

      // Add replyTo if specified
      if (email.replyTo) {
        emailOptions.replyTo = email.replyTo;
      }

      return emailOptions;
    });

    try {
      const sent = 0;
      const failed = 0;

      // Send emails using Resend batch API
      // if (resendEmails.length === 1) {
      //   // Single email
      //   const response = await this.resend.emails.send(resendEmails[0]!);
      //   if (response.error) {
      //     console.error("Failed to send email:", response.error);
      //     failed = 1;
      //   } else {
      //     sent = 1;
      //   }
      // } else {
      //   // Batch emails
      //   const response = await this.resend.batch.send(resendEmails);
      //   if (response.error) {
      //     console.error("Failed to send batch emails:", response.error);
      //     failed = resendEmails.length;
      //   } else {
      //     sent = resendEmails.length;
      //   }
      // }

      return {
        sent,
        skipped: emails.length - sent - failed,
        failed,
      };
    } catch (error) {
      console.error("Failed to send emails:", error);
      return { sent: 0, skipped: 0, failed: emails.length };
    }
  }

  #getTemplates(template: string) {
    const templates = {
      transactions: require("@midday/email/emails/transactions").default,
      "invoice-paid": require("@midday/email/emails/invoice-paid").default,
      "invoice-overdue": require("@midday/email/emails/invoice-overdue")
        .default,
    };

    return templates[template as keyof typeof templates];
  }
}
