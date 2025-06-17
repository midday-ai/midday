import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
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

    // Example implementation:
    // const { resend } = await import("@jobs/utils/resend");
    // const { TrialEndedEmail } = await import("@midday/email/emails/trial-ended");
    // const { render } = await import("@midday/email/render");
    // const { shouldSendEmail } = await import("@jobs/utils/check-team-plan");

    // if (await shouldSendEmail(data.teamId)) {
    //   await resend.emails.send({
    //     from: "Pontus from Midday <pontus@midday.ai>",
    //     to: data.email,
    //     subject: "Your trial has ended",
    //     html: await render(TrialEndedEmail({ fullName: data.fullName })),
    //   });
    // }

    return {
      type: "trial-ended",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
