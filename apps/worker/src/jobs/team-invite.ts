import { z } from "zod";
import { job } from "../core/job";
import { emailQueue } from "../queues/queues";

export const teamInviteJob = job(
  "team-invite",
  z.object({
    email: z.string().email(),
    teamId: z.string(),
    inviterName: z.string(),
  }),
  {
    queue: emailQueue,
  },
  async (data, ctx) => {
    ctx.logger.info(`Sending team invite to ${data.email}`, {
      teamId: data.teamId,
      inviterName: data.inviterName,
    });

    // Your email sending logic here
    // const { resend } = await import("@worker/services/resend");
    // await resend.emails.send({
    //   to: data.email,
    //   subject: `${data.inviterName} invited you to join their team`,
    //   html: `<p>You've been invited to join ${data.inviterName}'s team!</p>`,
    // });

    return {
      emailSent: true,
      invitedEmail: data.email,
      teamId: data.teamId,
      sentAt: new Date(),
    };
  },
);
