import { createClient } from "@midday/supabase/server";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { disconnectedNotifications } from "../notifications/disconnected";

const BATCH_SIZE = 50;

export const disconnectedScheduler = schedules.task({
  id: "disconnected-scheduler",
  // Every Monday at 2:30pm
  cron: "30 14 * * 1",
  run: async () => {
    // Only run in production (Set in Trigger.dev)
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    // TODO: Enable soon
    return null;

    const supabase = createClient();

    const { data: bankConnections } = await supabase
      .from("bank_connections")
      .select("name, team:team_id(id, name)")
      .eq("status", "disconnected");

    const usersPromises =
      bankConnections?.map(async ({ team, name }) => {
        const { data: users } = await supabase
          .from("users_on_team")
          .select("user:user_id(id, email, full_name, locale)")
          .eq("team_id", team.id)
          .eq("role", "owner");

        return users?.map((user) => ({
          ...user,
          bankName: name,
          teamName: team.name,
        }));
      }) ?? [];

    const users = (await Promise.all(usersPromises)).flat();

    if (users.length === 0) {
      logger.info("No disconnected banks found");
      return;
    }

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const userBatch = users.slice(i, i + BATCH_SIZE);
      await disconnectedNotifications.triggerAndWait({
        users: userBatch,
      });
    }
  },
});
