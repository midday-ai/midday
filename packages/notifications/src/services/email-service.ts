import type { Database } from "@midday/db/client";
import { shouldSendNotification } from "@midday/db/queries";
// import InvoiceEmail from "@midday/email/emails/invoice";
// import InvoiceOverdueEmail from "@midday/email/emails/invoice-overdue";
// import InvoicePaidEmail from "@midday/email/emails/invoice-paid";
import InvoiceReminderEmail from "@midday/email/emails/invoice-reminder";
import TransactionsEmail from "@midday/email/emails/transactions";
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
        // For customer emails (with explicit 'to' field), always send - decision made at notification level
        if (email.to && email.to.length > 0) {
          return email;
        }

        // For team emails (no 'to' field), check user's notification settings
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
    let html: string;
    if (email.template) {
      const template = this.#getTemplate(email.template as string);
      html = render(template(email.data as any));
    } else {
      throw new Error(`No template found for email: ${email.template}`);
    }

    if (!email.subject) {
      throw new Error(`No subject found for email: ${email.template}`);
    }

    // Use explicit 'to' field if provided, otherwise default to user email
    const recipients = email.to || [email.user.email];

    const payload: CreateEmailOptions = {
      from: email.from || "Midday <middaybot@midday.ai>",
      to: recipients,
      subject: email.subject,
      html,
      headers: {
        "X-Entity-Ref-ID": nanoid(),
        ...email.headers,
      },
    };

    // Add optional fields if present
    if (email.replyTo) payload.replyTo = email.replyTo;
    if (email.cc) payload.cc = email.cc;
    if (email.bcc) payload.bcc = email.bcc;
    if (email.attachments) payload.attachments = email.attachments;
    if (email.tags) payload.tags = email.tags;
    if (email.text) payload.text = email.text;

    return payload;
  }

  #getTemplate(templateName: string) {
    const templates = {
      // invoice: InvoiceEmail,
      // "invoice-overdue": InvoiceOverdueEmail,
      // "invoice-paid": InvoicePaidEmail,
      "invoice-reminder": InvoiceReminderEmail,
      transactions: TransactionsEmail,
    };

    const template = templates[templateName as keyof typeof templates];

    if (!template) {
      throw new Error(`Unknown email template: ${templateName}`);
    }

    return template;
  }
}
