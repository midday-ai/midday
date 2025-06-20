import { getTeamPlan } from "@db/queries";
import TrialEndedEmail from "@midday/email/emails/trial-ended";
import { render } from "@midday/email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { z } from "zod";

export const trialEndedEmailJob = job(
  "trial-ended-email",
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
      `Sending trial ended email to ${data.email} (${data.fullName})`,
    );

    const plan = await getTeamPlan(ctx.db, data.teamId);

    if (plan?.plan === "trial") {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: data.email,
        subject: "Your trial has ended",
        html: render(TrialEndedEmail({ fullName: data.fullName })),
      });
    }

    return {
      type: "trial-ended",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
