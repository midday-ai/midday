import { createClient } from "@midday/supabase/job";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import {
  handleOverdueInvoiceNotifications,
  handlePaidInvoiceNotifications,
} from "../../utils/invoice-notifications";

export const sendInvoiceNotifications = schemaTask({
  id: "invoice-notifications",
  schema: z.object({
    invoiceId: z.string().uuid(),
    invoiceNumber: z.string(),
    status: z.enum(["paid", "overdue"]),
    teamId: z.string(),
    customerName: z.string(),
  }),
  run: async ({ invoiceId, invoiceNumber, status, teamId, customerName }) => {
    const supabase = createClient();

    const { data: user } = await supabase
      .from("users_on_team")
      .select(
        "id, team_id, user:users(id, full_name, avatar_url, email, locale)",
      )
      .eq("team_id", teamId)
      .eq("role", "owner");

    switch (status) {
      case "paid":
        await handlePaidInvoiceNotifications({
          user,
          invoiceId,
          invoiceNumber,
        });
        break;
      case "overdue":
        await handleOverdueInvoiceNotifications({
          user,
          invoiceId,
          invoiceNumber,
          customerName,
        });
        break;
    }
  },
});
