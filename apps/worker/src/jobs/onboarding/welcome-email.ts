import { job } from "@worker/core/job";
import { z } from "zod";

export const welcomeEmailJob = job(
  "welcome-email",
  z.object({
    userId: z.string(),
    email: z.string().email(),
    fullName: z.string(),
    teamId: z.string(),
  }),
  async (data, ctx) => {
    // This would be your resend/email implementation
    ctx.logger.info(
      `Sending welcome email to ${data.email} (${data.fullName})`,
    );

    // Example implementation (you'd adapt this to your email system):
    // const { resend } = await import("@jobs/utils/resend");
    // const { WelcomeEmail } = await import("@midday/email/emails/welcome");
    // const { render } = await import("@midday/email/render");
    // const { shouldSendEmail } = await import("@jobs/utils/check-team-plan");

    // if (await shouldSendEmail(data.teamId)) {
    //   await resend.emails.send({
    //     to: data.email,
    //     subject: "Welcome to Midday",
    //     from: "Pontus from Midday <pontus@midday.ai>",
    //     html: render(WelcomeEmail({ fullName: data.fullName })),
    //   });
    // }

    return {
      type: "welcome",
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

export type WelcomeEmailData = z.infer<(typeof welcomeEmailJob)["schema"]>;
