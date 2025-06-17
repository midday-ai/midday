import { getTeamPlan } from "@db/queries";
import GetStartedEmail from "@midday/email/emails/get-started";
import { render } from "@midday/email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { z } from "zod";

export const getStartedEmailJob = job(
  "get-started-email",
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
      `Sending get started email to ${data.email} (${data.fullName})`,
    );

    const plan = await getTeamPlan(ctx.db, data.teamId);

    if (plan?.plan === "trial") {
      await resend.emails.send({
        to: data.email,
        subject: "Get the most out of Midday",
        from: "Pontus from Midday <pontus@midday.ai>",
        html: render(GetStartedEmail({ fullName: data.fullName })),
      });
    }

    return {
      type: "get-started",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
