import { getPlanByProductId, updateTeamPlan } from "@/utils/plans";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    switch (payload.type) {
      case "subscription.active": {
        await updateTeamPlan(payload.data.metadata.teamId as string, {
          email: payload.data.customer.email ?? undefined,
          plan: getPlanByProductId(payload.data.productId) as "starter" | "pro",
          canceled_at: null,
        });

        break;
      }

      // Subscription has been explicitly canceled by the user
      case "subscription.canceled": {
        await updateTeamPlan(payload.data.metadata.teamId as string, {
          plan: "trial",
          canceled_at: new Date().toISOString(),
        });

        break;
      }

      // Subscription has been revoked/peroid has ended with no renewal
      case "subscription.revoked": {
        if (!payload.data.metadata.teamId || !payload.data.customer.email) {
          console.error("Customer ID or email is missing");
          break;
        }

        await updateTeamPlan(payload.data.metadata.teamId as string, {
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
