import { getDb } from "@jobs/init";
import { onboardTeamSchema } from "@jobs/schema";
import { shouldSendEmail } from "@jobs/utils/check-team-plan";
import { resend } from "@jobs/utils/resend";
import { getBankConnectionCount, getUserById } from "@midday/db/queries";
import { TrialActivationEmail } from "@midday/email/emails/trial-activation";
import { WelcomeEmail } from "@midday/email/emails/welcome";
import { render } from "@midday/email/render";
import { logger, schemaTask, wait } from "@trigger.dev/sdk";

export const onboardTeam = schemaTask({
  id: "onboard-team",
  schema: onboardTeamSchema,
  maxDuration: 300,
  run: async ({ userId }) => {
    const user = await getUserById(getDb(), userId);

    if (!user?.fullName || !user.email) {
      throw new Error("User data is missing");
    }

    const [firstName, lastName] = user.fullName.split(" ") ?? [];

    await resend.contacts.create({
      email: user.email,
      firstName,
      lastName,
      unsubscribed: false,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
    });

    await resend.emails.send({
      to: user.email,
      subject: "Welcome to Midday",
      from: "Pontus from Midday <pontus@midday.ai>",
      html: await render(
        WelcomeEmail({
          fullName: user.fullName,
        }),
      ),
    });

    if (!user.teamId) {
      logger.info("User has no team, skipping onboarding");
      return;
    }

    // Day 3: Activation nudge — encourage bank connection
    await wait.for({ days: 3 });

    if (await shouldSendEmail(user.teamId)) {
      const count = await getBankConnectionCount(getDb(), {
        teamId: user.teamId,
      });

      if (!count || count === 0) {
        await resend.emails.send({
          from: "Pontus from Midday <pontus@midday.ai>",
          to: user.email,
          subject: "Connect your bank to see the full picture",
          html: await render(TrialActivationEmail({ fullName: user.fullName })),
        });
      }
    }
  },
});
