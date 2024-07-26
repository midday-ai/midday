import { getSubscriberPreferences } from "@midday/notification";
import { getUser } from "@midday/supabase/cached-queries";
import { Skeleton } from "@midday/ui/skeleton";
import { NotificationSetting } from "./notification-setting";

export function NotificationSettingsSkeleton() {
  return [...Array(2)].map((_, index) => (
    <Skeleton key={index.toString()} className="h-4 w-[25%] mb-3" />
  ));
}

export async function NotificationSettings() {
  const { data: userData } = await getUser();
  const { data: subscriberPreferences } = await getSubscriberPreferences({
    subscriberId: userData.id,
    teamId: userData.team_id,
  });

  const inAppSettings = subscriberPreferences
    ?.filter((setting) =>
      Object.keys(setting.preference.channels).includes("in_app"),
    )
    .map((setting) => {
      return (
        <NotificationSetting
          key={setting.template._id}
          id={setting.template._id}
          name={setting.template.name}
          enabled={setting.preference.channels?.in_app}
          subscriberId={userData.id}
          teamId={userData.team_id}
          type="in_app"
        />
      );
    });

  const emailSettings = subscriberPreferences
    ?.filter((setting) =>
      Object.keys(setting.preference.channels).includes("email"),
    )
    .map((setting) => {
      return (
        <NotificationSetting
          key={setting.template._id}
          id={setting.template._id}
          name={setting.template.name}
          enabled={setting.preference.channels?.email}
          subscriberId={userData.id}
          teamId={userData.team_id}
          type="email"
        />
      );
    });

  return (
    <div className="flex space-y-4 flex-col">
      <div>
        <h2 className="mb-2">In-App Notifications</h2>
        {inAppSettings}
      </div>

      <div>
        <h2 className="mb-2">Email Notifications</h2>
        {emailSettings}
      </div>
    </div>
  );
}
