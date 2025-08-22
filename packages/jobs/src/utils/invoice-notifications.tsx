import { InvoiceOverdueEmail } from "@midday/email/emails/invoice-overdue";
import { InvoicePaidEmail } from "@midday/email/emails/invoice-paid";
import { getI18n } from "@midday/email/locales";
import { render } from "@midday/email/render";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { getAppUrl } from "@midday/utils/envs";
import { logger } from "@trigger.dev/sdk";

export async function handlePaidInvoiceNotifications({
  user,
  invoiceId,
  invoiceNumber,
}: {
  user: any[];
  invoiceId: string;
  invoiceNumber: string;
}) {
  const link = `${getAppUrl()}/invoices?invoiceId=${invoiceId}&type=details`;

  const paidNotificationEvents = user
    ?.map(({ user, team_id }) => {
      const { t } = getI18n({ locale: user?.locale ?? "en" });

      if (!user) {
        return null;
      }

      return {
        name: TriggerEvents.InvoicePaidInApp,
        payload: {
          type: NotificationTypes.Invoice,
          recordId: invoiceId,
          description: t("notifications.invoicePaid", {
            invoiceNumber,
          }),
        },
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    })
    .filter(Boolean);

  try {
    // @ts-expect-error - TODO: Fix types with drizzle
    await triggerBulk(paidNotificationEvents);
  } catch (error) {
    await logger.error("Paid invoice notification", { error });
  }

  const paidEmailPromises = user
    ?.map(async ({ user, team_id }) => {
      const { t } = getI18n({ locale: user?.locale ?? "en" });

      if (!user) {
        return null;
      }

      const html = render(
        <InvoicePaidEmail invoiceNumber={invoiceNumber} link={link} />,
      );

      return {
        name: TriggerEvents.InvoicePaidEmail,
        payload: {
          subject: t("invoice.paid.subject", { invoiceNumber }),
          html,
        },
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    })
    .filter(Boolean);

  const validPaidEmailPromises = await Promise.all(paidEmailPromises);

  try {
    // @ts-expect-error - TODO: Fix types with drizzle
    await triggerBulk(validPaidEmailPromises);
  } catch (error) {
    await logger.error("Paid invoice email", { error });
  }
}

export async function handleOverdueInvoiceNotifications({
  user,
  invoiceId,
  invoiceNumber,
  customerName,
}: {
  user: any[];
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
}) {
  const link = `${getAppUrl()}/invoices?invoiceId=${invoiceId}&type=details`;

  const overdueNotificationEvents = user
    ?.map(({ user, team_id }) => {
      const { t } = getI18n({ locale: user?.locale ?? "en" });

      if (!user) {
        return null;
      }

      return {
        name: TriggerEvents.InvoiceOverdueInApp,
        payload: {
          type: NotificationTypes.Invoice,
          recordId: invoiceId,
          description: t("notifications.invoiceOverdue", {
            invoiceNumber,
          }),
        },
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    })
    .filter(Boolean);

  try {
    // @ts-expect-error - TODO: Fix types with drizzle
    await triggerBulk(overdueNotificationEvents);
  } catch (error) {
    await logger.error("Overdue invoice notification", { error });
  }

  const overdueEmailPromises = user
    ?.map(async ({ user, team_id }) => {
      const { t } = getI18n({ locale: user?.locale ?? "en" });

      if (!user) {
        return null;
      }

      const html = await render(
        <InvoiceOverdueEmail
          invoiceNumber={invoiceNumber}
          customerName={customerName}
          link={link}
        />,
      );

      return {
        name: TriggerEvents.InvoiceOverdueEmail,
        payload: {
          subject: t("invoice.overdue.subject", { invoiceNumber }),
          html,
        },
        user: {
          subscriberId: user.id,
          teamId: team_id,
          email: user.email,
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
        },
      };
    })
    .filter(Boolean);

  const validOverdueEmailPromises = await Promise.all(overdueEmailPromises);

  try {
    // @ts-expect-error - TODO: Fix types with drizzle
    await triggerBulk(validOverdueEmailPromises);
  } catch (error) {
    await logger.error("Overdue invoice email", { error });
  }
}
