import { getTeamPlan } from "@db/queries";
import { TrialExpiringEmail } from "@midday/email/emails/trial-expiring";
import { render } from "@midday/email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { z } from "zod";

export const trialExpiringEmailJob = job(
  "trial-expiring-email",
  z.object({
    userId: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    teamId: z.string(),
  }),
  {
    queue: emailQueue,
  },
  async (data, ctx) => {
    ctx.logger.info(
      `Sending trial expiring email to ${data.email} (${data.fullName})`,
    );

    const plan = await getTeamPlan(ctx.db, data.teamId);

    if (plan?.plan === "trial") {
      await resend.emails.send({
        to: data.email,
        subject: "Your trial is expiring soon",
        from: "Pontus from Midday <pontus@midday.ai>",
        html: render(TrialExpiringEmail({ fullName: data.fullName })),
      });
    }

    return {
      type: "trial-expiring",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
