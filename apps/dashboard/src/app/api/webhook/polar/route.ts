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

      // Subscription has been revoked/peroid has ended with no renewal
      case "subscription.revoked": {
        if (!payload.data.metadata.teamId) {
          console.error("Customer ID or email is missing");
          break;
        }

        // If the subscription is canceled, we need to update the team plan to trial
        if (payload.data.status === "canceled") {
          await updateTeamPlan(supabase, {
            id: payload.data.metadata.teamId as string,
            plan: "trial",
          });

          return;
        }

        // Subscription status: incomplete, incomplete_expired, trialing, active, past_due, canceled, unpaid
        await updateTeamPlan(supabase, {
          id: payload.data.metadata.teamId as string,
          subscription_status: payload.data.status,
        });

        break;
      }
      default:
        console.log("Unknown event", payload.type);
        break;
    }
  },
});
