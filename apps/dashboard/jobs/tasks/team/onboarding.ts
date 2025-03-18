import { resend } from "@/utils/resend";
import { GetStartedEmail } from "@midday/email/emails/get-started";
import { TrialEndedEmail } from "@midday/email/emails/trial-ended";
import { TrialExpiringEmail } from "@midday/email/emails/trial-expiring";
import { WelcomeEmail } from "@midday/email/emails/welcome";
import { render } from "@react-email/render";
import { schemaTask, wait } from "@trigger.dev/sdk/v3";
import { shouldSendEmail } from "jobs/utils/check-team-plan";
import { z } from "zod";

export const onboardTeam = schemaTask({
  id: "onboard-team",
  schema: z.object({
    teamId: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
  }),
  maxDuration: 300,
  run: async ({ teamId, fullName, email }) => {
    const [firstName, lastName] = fullName?.split(" ") ?? [];

    await resend.contacts.create({
      email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });

    await wait.for({ minutes: 15 });

    if (await shouldSendEmail(teamId)) {
      await resend.emails.send({
        to: email,
        subject: "Welcome to Midday",
        from: "Pontus from Midday <pontus@midday.ai>",
        html: await render(
          WelcomeEmail({
            fullName,
          }),
        ),
      });
    }

    await wait.for({ days: 3 });

    if (await shouldSendEmail(teamId)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: email,
        subject: "Get the most out of Midday",
        html: await render(
          GetStartedEmail({
            fullName,
          }),
        ),
      });
    }

    await wait.for({ days: 11 });

    if (await shouldSendEmail(teamId)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: email,
        subject: "Your trial is expiring soon",
        html: await render(
          TrialExpiringEmail({
            fullName,
          }),
        ),
      });
    }

    await wait.for({ days: 15 });

    if (await shouldSendEmail(teamId)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: email,
        subject: "Your trial has ended",
        html: await render(TrialEndedEmail({ fullName })),
      });
    }
  },
});
