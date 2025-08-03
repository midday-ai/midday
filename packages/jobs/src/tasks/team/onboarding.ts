import { onboardTeamSchema } from "@jobs/schema";
import { shouldSendEmail } from "@jobs/utils/check-team-plan";
import { resend } from "@jobs/utils/resend";
import { GetStartedEmail } from "@midday/email/emails/get-started";
import { TrialEndedEmail } from "@midday/email/emails/trial-ended";
import { TrialExpiringEmail } from "@midday/email/emails/trial-expiring";
import { WelcomeEmail } from "@midday/email/emails/welcome";
import { render } from "@midday/email/render";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask, wait } from "@trigger.dev/sdk";

export const onboardTeam = schemaTask({
  id: "onboard-team",
  schema: onboardTeamSchema,
  maxDuration: 300,
  run: async ({ userId }) => {
    const supabase = createClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, team_id")
      .eq("id", userId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!user.full_name || !user.email) {
      throw new Error("User data is missing");
    }

    const [firstName, lastName] = user.full_name.split(" ") ?? [];

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
      html: render(
        WelcomeEmail({
          fullName: user.full_name,
        }),
      ),
    });

    if (!user.team_id) {
      logger.info("User has no team, skipping onboarding");
      return;
    }

    await wait.for({ days: 3 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: user.email,
        subject: "Get the most out of Midday",
        html: await render(
          GetStartedEmail({
            fullName: user.full_name,
          }),
        ),
      });
    }

    await wait.for({ days: 11 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: user.email,
        subject: "Your trial is expiring soon",
        html: await render(
          TrialExpiringEmail({
            fullName: user.full_name,
          }),
        ),
      });
    }

    await wait.for({ days: 15 });

    if (await shouldSendEmail(user.team_id)) {
      await resend.emails.send({
        from: "Pontus from Midday <pontus@midday.ai>",
        to: user.email,
        subject: "Your trial has ended",
        html: await render(TrialEndedEmail({ fullName: user.full_name })),
      });
    }
  },
});
