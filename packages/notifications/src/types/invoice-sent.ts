import { getI18n } from "@midday/email/locales";
import { encrypt } from "@midday/encryption";
import { getAppUrl } from "@midday/utils/envs";
import type { NotificationHandler } from "../base";
import { invoiceSentSchema } from "../schemas";

export const invoiceSent: NotificationHandler = {
  schema: invoiceSentSchema,

  createActivity: (data, user) => ({
    teamId: user.team_id,
    userId: user.id,
    type: "invoice_sent",
    source: "user",
    priority: 3,
    metadata: {
      recordId: data.invoiceId,
      invoiceNumber: data.invoiceNumber,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
    },
  }),

  createEmail: (data, user, team) => {
    const { t } = getI18n({ locale: user?.locale ?? "en" });
    const link = `${getAppUrl()}/i/${encodeURIComponent(
      data.token,
    )}?viewer=${encodeURIComponent(encrypt(data.customerEmail))}`;

    // Subject line: use custom plain-text subject if provided, otherwise i18n default
    const subject =
      data.emailSubject ||
      t("invoice.sent.subject", {
        teamName: team.name,
      });

    return {
      template: "invoice",
      emailType: "customer",
      to: [data.customerEmail],
      subject,
      from: `${team.name} <middaybot@midday.ai>`,
      data: {
        customerName: data.customerName,
        teamName: team.name,
        link,
        // Gmail structured data fields
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate,
        // Custom email content (emailHeading = in-body heading, separate from subject)
        emailHeading: data.emailHeading,
        emailBody: data.emailBody,
        emailButtonText: data.emailButtonText,
        // Template labels and logo
        logoUrl: data.logoUrl,
        dueDateLabel: data.dueDateLabel,
        invoiceNoLabel: data.invoiceNoLabel,
        // Formatting
        locale: data.locale,
        dateFormat: data.dateFormat,
      },
    };
  },
};
