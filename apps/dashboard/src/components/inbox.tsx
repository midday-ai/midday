import { getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxView } from "./inbox-view";

export async function Inbox() {
  const user = await getUser();
  const supabase = createClient();

  // TODO: Fix Infinite Scroll
  const inbox = await getInboxQuery(supabase, {
    to: 10000,
    teamId: user.data.team_id,
  });

  // if (!optimisticData?.length) {
  //   return <InboxEmpty inboxId={inboxId} />;
  // }

  return <InboxView items={inbox?.data} team={user?.data?.team} />;
}
