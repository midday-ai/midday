import { updateSubscriberPreferenceAction } from "@/actions/update-subscriber-preference-action";
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

  return subscriberPreferences.map((preference) => {
    return (
      <NotificationSetting
        key={preference.template._id}
        id={preference.template._id}
        name={preference.template.name}
        enabled={preference.preference.channels?.in_app}
        updateSubscriberPreferenceAction={updateSubscriberPreferenceAction}
        subscriberId={userData.id}
        teamId={userData.team_id}
        type="in_app"
      />
    );
  });
}
