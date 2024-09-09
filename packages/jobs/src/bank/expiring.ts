import ConnectionExpireEmail from "@midday/email/emails/connection-expire";
import { renderAsync } from "@react-email/components";
import { cronTrigger } from "@trigger.dev/sdk";
import { addDays } from "date-fns";
import { nanoid } from "nanoid";
import { client, resend, supabase } from "../client";
import { Jobs } from "../constants";
import { processBatch } from "../utils/process";

client.defineJob({
  id: Jobs.BANK_CONNECTION_EXPIRING,
  name: "Bank - Connection Expiring",
  version: "0.1.1",
  trigger: cronTrigger({
    // Every monday
    cron: "30 15 * * 1",
  }),
  integrations: {
    supabase,
    resend,
  },
  run: async (_, io) => {
    const { data } = await io.supabase.client
      .from("bank_connections")
      .select("id, team:team_id(id, name), name, expires_at")
      .eq("status", "connected")
      .lte("expires_at", addDays(new Date(), 17).toISOString())
      .gt("expires_at", new Date().toISOString());

    const usersPromises =
      data?.map(async ({ team, name, expires_at }) => {
        const { data: users } = await io.supabase.client
          .from("users_on_team")
          .select("id, user:user_id(id, email, full_name, locale)")
          .eq("team_id", team.id)
          .eq("role", "owner");

        return users?.map((user) => ({
          ...user,
          bankName: name,
          teamName: team.name,
          expiresAt: expires_at,
        }));
      }) ?? [];

    const users = await Promise.all(usersPromises);

    const emailPromises = users
      .flat()
      .map(async ({ user, bankName, teamName, expireAt }) => {
        const html = await renderAsync(
          ConnectionExpireEmail({
            fullName: user.full_name,
            locale: user.locale,
            bankName,
            teamName,
            expireAt,
          }),
        );

        return {
          from: "Middaybot <middaybot@midday.ai>",
          to: [user.email],
          subject: "Bank Connection Expiring Soon",
          html,
        };
      });

    const emails = await Promise.all(emailPromises);

    await processBatch(emails, 50, async (batch) => {
      await io.resend.batch.send(`send-email-${nanoid()}`, batch);
    });
  },
});
