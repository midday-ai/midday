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
          subscription_status: "active",
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

      // Subscription has been revoked/period has ended with no renewal
      // Note: This event is also sent for past_due status, so we need to check
      case "subscription.revoked": {
        if (!payload.data.metadata.teamId) {
          console.error("Customer ID or email is missing");
          break;
        }

        // Check if this is a past_due status (payment pending) vs actual revocation
        if (payload.data.status === "past_due") {
          // Keep the plan active but mark subscription as past_due
          // User keeps access while they fix their payment method
          await updateTeamPlan(supabase, {
            id: payload.data.metadata.teamId as string,
            subscription_status: "past_due",
          });
        } else {
          // Actual revocation - downgrade to trial
          await updateTeamPlan(supabase, {
            id: payload.data.metadata.teamId as string,
            plan: "trial",
            canceled_at: new Date().toISOString(),
            subscription_status: null,
          });
        }

        break;
      }
      default:
        console.log("Unknown event", payload.type);
        break;
    }
  },
});
