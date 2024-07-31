import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import { renderAsync } from "@react-email/components";
import { cronTrigger } from "@trigger.dev/sdk";
import { client, resend, supabase } from "../client";
import { processBatch } from "../utils/process";

client.defineJob({
  id: "bank-connection-disconnected",
  name: "Bank - Connection Disconnected",
  version: "0.1.1",
  trigger: cronTrigger({
    // Every monday
    cron: "30 14 * * 1",
  }),
  integrations: {
    supabase,
    resend,
  },
  run: async (_, io) => {
    const { data } = await io.supabase.client
      .from("bank_connections")
      .select("id, team:team_id(id, name), name")
      .eq("status", "disconnected");

    const usersPromises =
      data?.map(async ({ team, name }) => {
        const { data: users } = await io.supabase.client
          .from("users_on_team")
          .select("id, user:user_id(id, email, full_name, locale)")
          .eq("team_id", team.id)
          .eq("role", "owner");

        return users?.map((user) => ({
          ...user,
          bankName: name,
          teamName: team.name,
        }));
      }) ?? [];

    const users = await Promise.all(usersPromises);

    const emailPromises = users
      ?.flat()
      .map(async ({ user, bankName, teamName }) => {
        const html = await renderAsync(
          ConnectionIssueEmail({
            fullName: user.full_name,
            locale: user.locale,
            bankName,
            teamName,
          }),
        );

        return {
          from: "Middaybot <middaybot@midday.ai>",
          to: [user.email],
          subject: "Bank Connection Issue",
          html,
        };
      });

    const emails = await Promise.all(emailPromises);

    await processBatch(emails, 50, async (batch, index) => {
      await io.resend.batch.send(`send-email-${index}`, batch);
    });
  },
});
