import { getPlanByProductId, updateTeamPlan } from "@/utils/plans";
import { Webhooks } from "@polar-sh/nextjs";

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    switch (payload.type) {
      case "subscription.updated": {
        // Make sure the subscription is active before setting the plan
        if (payload.data.status !== "active") {
          break;
        }

        await updateTeamPlan({
          id: payload.data.customerId as string,
          email: payload.data.customer.email ?? undefined,
          plan: getPlanByProductId(payload.data.productId),
        });

        break;
      }

      // Subscription has been explicitly canceled by the user
      case "subscription.canceled": {
        await updateTeamPlan({
          id: payload.data.customerId as string,
          canceled_at: new Date(),
        });

        break;
      }

      // Subscription has been revoked/peroid has ended with no renewal
      case "subscription.revoked": {
        if (!payload.data.customerId || !payload.data.customer.email) {
          console.error("Customer ID or email is missing");
          break;
        }

        await updateTeamPlan({
          id: payload.data.customerId as string,
          plan: "trial",
          canceled_at: new Date(),
        });

        break;
      }
      default:
        console.log("Unknown event", payload.type);
        break;
    }
  },
});
