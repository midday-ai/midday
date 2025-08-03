import { getDb } from "@jobs/init";
import { getTeamOwnersByTeamId } from "@midday/db/queries";
import { NotificationTypes } from "@midday/notification";
import { triggerBulk } from "@midday/notification";
import { TriggerEvents } from "@midday/notification";

export async function handleInboxNotifications({
  inboxId,
  description,
  teamId,
}: {
  inboxId: string;
  description: string;
  teamId: string;
}) {
  const db = getDb();

  // Get all users on team
  const usersData = await getTeamOwnersByTeamId(db, teamId);

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
            fullName: user.fullName,
            avatarUrl: user.avatarUrl,
          },
        },
      ];
    }),
  );

  if (notificationEvents.length) {
    triggerBulk(notificationEvents?.flat());
  }
}
