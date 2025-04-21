import { NotificationTypes } from "@midday/notification";
import { triggerBulk } from "@midday/notification";
import { TriggerEvents } from "@midday/notification";
import { createClient } from "@midday/supabase/job";

export async function handleInboxNotifications({
  inboxId,
  description,
  teamId,
}: {
  inboxId: string;
  description: string;
  teamId: string;
}) {
  const supabase = createClient();

  // Get all users on team
  const { data: usersData } = await supabase
    .from("users_on_team")
    .select("user:users(id, full_name, avatar_url, email, locale)")
    .eq("team_id", teamId)
    .eq("role", "owner")
    .throwOnError();

  if (!usersData?.length) {
    return;
  }

  const notificationEvents = await Promise.all(
    usersData.map(async ({ user }) => {
      if (!user) return [];

      return [
        {
          name: TriggerEvents.InboxNewInApp,
          payload: {
            recordId: inboxId,
            description,
            type: NotificationTypes.Inbox,
          },
          user: {
            subscriberId: user.id,
            teamId,
            email: user.email,
            fullName: user.full_name,
            avatarUrl: user.avatar_url,
          },
        },
      ];
    }),
  );

  if (notificationEvents.length) {
    triggerBulk(notificationEvents?.flat());
  }
}
