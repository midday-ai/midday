import ConnectionExpireEmail from "@midday/email/emails/connection-expire";
import { renderAsync } from "@react-email/components";
import { cronTrigger } from "@trigger.dev/sdk";
import { client, resend, supabase } from "../client";

client.defineJob({
  id: "bank-expired",
  name: "Bank Expired",
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
      .lt(
        "expire_at",
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      );

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
        ConnectionExpireEmail({
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
