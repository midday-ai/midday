import { getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxView } from "./inbox-view";

export async function Inbox({ ascending }) {
  const user = await getUser();
  const supabase = createClient();

  const inbox = await getInboxQuery(supabase, {
    to: 10000,
    teamId: user.data.team_id,
    ascending,
  });

  // if (!optimisticData?.length) {
  //   return <InboxEmpty inboxId={inboxId} />;
  // }

  return (
    <InboxView
      items={inbox?.data}
      teamId={user?.data?.team?.id}
      inboxId={user?.data?.team?.inbox_id}
      forwardEmail={user?.data?.team?.inbox_email}
      ascending={ascending}
    />
  );
}
