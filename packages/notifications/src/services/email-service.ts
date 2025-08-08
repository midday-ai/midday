import type { Database } from "@midday/db/client";
import { shouldSendNotification } from "@midday/db/queries";
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
      transactions: require("@midday/email/emails/transactions").default,
      "invoice-paid": require("@midday/email/emails/invoice-paid").default,
      "invoice-overdue": require("@midday/email/emails/invoice-overdue")
        .default,
      "invoice-reminder": require("@midday/email/emails/invoice-reminder")
        .default,
      invoice: require("@midday/email/emails/invoice").default,
    };

    const template = templates[templateName as keyof typeof templates];

    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    return template;
  }
}
