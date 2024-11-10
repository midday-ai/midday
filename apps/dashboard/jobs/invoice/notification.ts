import { getI18n } from "@midday/email/locales";
import {
  NotificationTypes,
  TriggerEvents,
  triggerBulk,
} from "@midday/notification";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export const invoiceNotification = schemaTask({
  id: "invoice-notification",
  schema: z.object({
    invoiceId: z.string().uuid(),
    invoiceNumber: z.string(),
    status: z.enum(["paid", "overdue"]),
    teamId: z.string(),
  }),
  run: async ({ invoiceId, invoiceNumber, status, teamId }) => {
    const supabase = createClient();

    const { data: usersData } = await supabase
      .from("users_on_team")
      .select(
        "id, team_id, user:users(id, full_name, avatar_url, email, locale)",
      )
      .eq("team_id", teamId);

    if (status === "paid") {
      const paidNotificationEvents = usersData?.map(({ user, team_id }) => {
        const { t } = getI18n({ locale: user?.locale ?? "en" });

        if (!user) {
          return;
        }

        return {
          name: TriggerEvents.InvoicePaidInApp,
          payload: {
            type: NotificationTypes.Invoice,
            invoiceId,
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
      });

      try {
        await triggerBulk(paidNotificationEvents.flat());
      } catch (error) {
        await logger.error("Paid invoice notification", { error });
      }
    }

    if (status === "overdue") {
      const overdueNotificationEvents = usersData?.map(({ user, team_id }) => {
        const { t } = getI18n({ locale: user?.locale ?? "en" });

        if (!user) {
          return;
        }

        return {
          name: TriggerEvents.InvoiceOverdueInApp,
          payload: {
            type: NotificationTypes.Invoice,
            invoiceId,
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
      });

      try {
        await triggerBulk(overdueNotificationEvents.flat());
      } catch (error) {
        await logger.error("Overdue invoice notification", { error });
      }
    }
  },
});
