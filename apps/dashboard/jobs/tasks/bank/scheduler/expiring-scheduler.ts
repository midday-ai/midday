import { createClient } from "@midday/supabase/server";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { addDays } from "date-fns";
import { expiringNotifications } from "../notifications/expiring";

const BATCH_SIZE = 50;

export const expiringScheduler = schedules.task({
  id: "expiring-scheduler",
  // Every Monday at 3:30pm
  cron: "30 15 * * 1",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createClient();

    const { data: bankConnections } = await supabase
      .from("bank_connections")
      .select("id, team:team_id(id, name), name, expires_at")
      .eq("status", "connected")
      .lte("expires_at", addDays(new Date(), 15).toISOString())
      .gt("expires_at", new Date().toISOString());

    const usersPromises =
      bankConnections?.map(async ({ team, name, expires_at }) => {
        const { data: users } = await supabase
          .from("users_on_team")
          .select("user:user_id(id, email, full_name, locale)")
          .eq("team_id", team.id)
          .eq("role", "owner");

        return users?.map((user) => ({
          ...user,
          bankName: name,
          teamName: team.name,
          expiresAt: expires_at,
        }));
      }) ?? [];

    const users = (await Promise.all(usersPromises)).flat();

    if (users.length === 0) {
      logger.info("No expiring banks found");
      return;
    }

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const userBatch = users.slice(i, i + BATCH_SIZE);
      await expiringNotifications.triggerAndWait({
        users: userBatch,
      });
    }
  },
});
