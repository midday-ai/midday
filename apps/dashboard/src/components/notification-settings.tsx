import { updateSubscriberPreferenceAction } from "@/actions/update-subscriber-preference-action";
import { getSubscriberPreferences } from "@midday/notification";
import { getUserDetails } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { NotificationSetting } from "./notification-setting";

export async function NotificationSettings() {
  const supabase = createClient();
  const { data: userData } = await getUserDetails(supabase);
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
