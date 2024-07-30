import ConnectionIssueEmail from "@midday/email/emails/connection-issue";
import { renderAsync } from "@react-email/components";
import { cronTrigger } from "@trigger.dev/sdk";
import { client, resend, supabase } from "../client";

client.defineJob({
  id: "bank-disconnected",
  name: "Bank Disconnected",
  version: "0.1.1",
  trigger: cronTrigger({
    cron: "30 14 * * 1",
  }),
  integrations: {
    supabase,
    resend,
  },
  run: async (_, io, ctx) => {
    const { data } = await io.supabase.client
      .from("bank_connections")
      .select("id, team_id")
      .eq("status", "disconnected");

    const usersPromises =
      data?.map(async ({ team_id }) => {
        const { data: users } = await io.supabase.client
          .from("users_on_teams")
          .select("id, user:user_id(id, email, full_name, locale)")
          .eq("team_id", team_id)
          .eq("role", "owner")
          .single();

        return users;
      }) ?? [];

    // Batch 10 at a time
    const users = await Promise.all(usersPromises);

    const emailPromises = users.flat().map(async (user) => {
      const html = await renderAsync(
        ConnectionIssueEmail({
          fullName: user?.user?.full_name,
          locale: user?.user?.locale,
        }),
      );

      return {
        from: "Acme <onboarding@resend.dev>",
        to: [user?.user?.email],
        subject: "Bank Connection Issue",
        html,
      };
    });

    const emails = await Promise.all(emailPromises);

    await resend.batch.send("send-email", emails);
  },
});
