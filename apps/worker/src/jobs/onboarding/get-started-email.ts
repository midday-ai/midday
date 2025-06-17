import { job } from "@worker/core/job";
import { emailQueue } from "@worker/queues/queues";
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

    // Example implementation:
    // const { resend } = await import("@jobs/utils/resend");
    // const { GetStartedEmail } = await import("@midday/email/emails/get-started");
    // const { render } = await import("@midday/email/render");
    // const { shouldSendEmail } = await import("@jobs/utils/check-team-plan");

    // if (await shouldSendEmail(data.teamId)) {
    //   await resend.emails.send({
    //     from: "Pontus from Midday <pontus@midday.ai>",
    //     to: data.email,
    //     subject: "Get the most out of Midday",
    //     html: await render(GetStartedEmail({ fullName: data.fullName })),
    //   });
    // }

    return {
      type: "get-started",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
);
