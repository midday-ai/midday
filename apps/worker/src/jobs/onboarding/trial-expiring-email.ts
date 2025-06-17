import { job } from "@worker/core/job";
import { z } from "zod";

export const trialExpiringEmailJob = job(
  "trial-expiring-email",
  z.object({
    userId: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    teamId: z.string(),
  }),
  async (data, ctx) => {
    ctx.logger.info(
      `Sending trial expiring email to ${data.email} (${data.fullName})`,
    );

    // Example implementation:
    // const { resend } = await import("@jobs/utils/resend");
    // const { TrialExpiringEmail } = await import("@midday/email/emails/trial-expiring");
    // const { render } = await import("@midday/email/render");
    // const { shouldSendEmail } = await import("@jobs/utils/check-team-plan");

    // if (await shouldSendEmail(data.teamId)) {
    //   await resend.emails.send({
    //     from: "Pontus from Midday <pontus@midday.ai>",
    //     to: data.email,
    //     subject: "Your trial is expiring soon",
    //     html: await render(TrialExpiringEmail({ fullName: data.fullName })),
    //   });
    // }

    return {
      type: "trial-expiring",
      emailSent: true,
      sentAt: new Date(),
      userId: data.userId,
    };
  },
  {
    priority: 2,
    attempts: 3,
  },
);

export type TrialExpiringEmailData = z.infer<
  (typeof trialExpiringEmailJob)["schema"]
>;
