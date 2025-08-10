import { getPlanByProductId } from "@/utils/plans";
import { updateTeamPlan } from "@midday/supabase/mutations";
import { createClient } from "@midday/supabase/server";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const supabase = await createClient({ admin: true });

    switch (payload.type) {
      case "subscription.active": {
        await updateTeamPlan(supabase, {
          id: payload.data.metadata.teamId as string,
          email: payload.data.customer.email ?? undefined,
          plan: getPlanByProductId(payload.data.productId) as "starter" | "pro",
          canceled_at: null,
        });

        break;
      }

      // Subscription has been explicitly canceled by the user
      case "subscription.canceled": {
        await updateTeamPlan(supabase, {
          id: payload.data.metadata.teamId as string,
          email: payload.data.customer.email ?? undefined,
          canceled_at: new Date().toISOString(),
        });

        break;
      }

      // Subscription has been revoked/peroid has ended with no renewal
      case "subscription.revoked": {
        if (!payload.data.metadata.teamId) {
          console.error("Customer ID or email is missing");
          break;
        }

        await updateTeamPlan(supabase, {
          id: payload.data.metadata.teamId as string,
          plan: "trial",
          canceled_at: new Date().toISOString(),
        });

        break;
      }
      default:
        console.log("Unknown event", payload.type);
        break;
    }
  },
});
