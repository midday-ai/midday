import { onboardTeamSchema } from "@jobs/schema";
import { shouldSendEmail } from "@jobs/utils/check-team-plan";
import { resend } from "@jobs/utils/resend";
import { TrialActivationEmail } from "@midday/email/emails/trial-activation";
import { TrialExpiringEmail } from "@midday/email/emails/trial-expiring";
import { WelcomeEmail } from "@midday/email/emails/welcome";
import { render } from "@midday/email/render";
import { createClient } from "@midday/supabase/job";
import { logger, schemaTask, wait } from "@trigger.dev/sdk";
import { subDays } from "date-fns";

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
      html: await render(
        WelcomeEmail({
          fullName: user.full_name,
        }),
      ),
    });

    if (!user.team_id) {
      logger.info("User has no team, skipping onboarding");
      return;
    }

    // Day 3: Activation nudge — encourage bank connection
    await wait.for({ days: 3 });

    if (await shouldSendEmail(user.team_id)) {
      const { count } = await supabase
        .from("bank_connections")
        .select("id", { count: "exact", head: true })
        .eq("team_id", user.team_id);

      if (!count || count === 0) {
        await resend.emails.send({
          from: "Pontus from Midday <pontus@midday.ai>",
          to: user.email,
          subject: "Connect your bank to see the full picture",
          html: await render(
            TrialActivationEmail({ fullName: user.full_name }),
          ),
        });
      }
    }

    // Trial expiring reminder — must arrive BEFORE Polar charges.
    // Wait until day 10 from registration to check for trialing subscription,
    // then schedule the reminder based on when the team was created
    // (trial starts at checkout during onboarding, usually within hours of registration).
    // We send the reminder at day 12 from registration to ensure it arrives
    // before the 14-day Polar trial expires.
    await wait.for({ days: 7 });

    if (await shouldSendEmail(user.team_id)) {
      const { data: team } = await supabase
        .from("teams")
        .select("subscription_status, created_at")
        .eq("id", user.team_id)
        .single();

      if (team?.subscription_status === "trialing") {
        // Wait until 1 day before the trial likely ends (13 days from team creation)
        const trialEnd = new Date(team.created_at);
        trialEnd.setDate(trialEnd.getDate() + 14);
        const reminderDate = subDays(trialEnd, 1);
        const now = new Date();

        if (reminderDate > now) {
          await wait.until({ date: reminderDate });
        }

        // Re-check subscription_status directly — shouldSendEmail is too
        // permissive here because a canceled trial resets plan to "trial"
        // with a null subscriptionStatus, which shouldSendEmail treats as truthy.
        const { data: freshTeam } = await supabase
          .from("teams")
          .select("subscription_status, canceled_at")
          .eq("id", user.team_id)
          .single();

        if (
          freshTeam?.subscription_status === "trialing" &&
          !freshTeam.canceled_at
        ) {
          await resend.emails.send({
            from: "Pontus from Midday <pontus@midday.ai>",
            to: user.email,
            subject: "Your trial ends tomorrow — billing starts automatically",
            html: await render(
              TrialExpiringEmail({
                fullName: user.full_name,
              }),
            ),
          });
        }
      }
    }
  },
});
