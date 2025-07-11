import { getTeamPlan } from "@midday/db/queries";
import WelcomeEmail from "@midday/email/emails/welcome";
import { render } from "@react-email/render";
import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
import { resend } from "@worker/services/resend";
import { z } from "zod";

export const welcomeEmailJob = job(
  "welcome-email",
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
      `Sending welcome email to ${data.email} (${data.fullName})`,
    );

    const plan = await getTeamPlan(ctx.db, data.teamId);

    if (plan?.plan === "trial") {
      await resend.emails.send({
        to: data.email,
        subject: "Welcome to Midday",
        from: "Pontus from Midday <pontus@midday.ai>",
        html: await render(WelcomeEmail({ fullName: data.fullName })),
      });
    }

    return {
      type: "welcome",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
