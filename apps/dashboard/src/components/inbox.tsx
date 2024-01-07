import { getInbox, getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxView } from "./inbox-view";

export async function Inbox({ searchParams }) {
  // TODO: Fix Infinite Scroll
  const supabase = createClient();
  const user = await getUser();
  const inbox = await getInboxQuery(supabase, {
    teamId: user.data.team_id,
    to: 10000,
  });

  const selectedId = searchParams?.id || inbox?.data?.at(0)?.id;

  return (
    <InboxView
      items={inbox?.data}
      inboxId={user?.data?.team?.inbox_id}
      teamId={user?.data?.team?.id}
      selectedId={selectedId}
    />
  );
}
