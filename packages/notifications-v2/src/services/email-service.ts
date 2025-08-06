import type { Database } from "@midday/db/client";
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

  async sendBulk(emails: EmailInput[]) {
    if (emails.length === 0) {
      return { sent: 0, skipped: 0, failed: 0 };
    }

    // TODO: Filter users based on email preferences
    const eligibleEmails = emails;

    if (eligibleEmails.length === 0) {
      return {
        sent: 0,
        skipped: emails.length,
        failed: 0,
      };
    }

    // Prepare emails for Resend batch sending
    const resendEmails = eligibleEmails.map((email) => {
      const { t } = getI18n({ locale: email.user.user.locale ?? "en" });

      // Dynamically import the email template
      const EmailTemplate = this.getEmailTemplate(email.template);

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
      let sent = 0;
      let failed = 0;

      // Send emails using Resend batch API
      if (resendEmails.length === 1) {
        // Single email
        const response = await this.resend.emails.send(resendEmails[0]!);
        if (response.error) {
          console.error("Failed to send email:", response.error);
          failed = 1;
        } else {
          sent = 1;
        }
      } else {
        // Batch emails
        const response = await this.resend.batch.send(resendEmails);
        if (response.error) {
          console.error("Failed to send batch emails:", response.error);
          failed = resendEmails.length;
        } else {
          sent = resendEmails.length;
        }
      }

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

  private getEmailTemplate(template: string) {
    const templates = {
      transactions: require("@midday/email/emails/transactions").default,
    };

    return templates[template as keyof typeof templates];
  }
}
