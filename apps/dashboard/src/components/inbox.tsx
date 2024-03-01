import { getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxView } from "./inbox-view";

export async function Inbox({ selectedId: initialSelectedId }) {
  const user = await getUser();
  const supabase = createClient();

  // TODO: Fix Infinite Scroll
  const inbox = await getInboxQuery(supabase, {
    to: 10000,
    teamId: user.data.team_id,
  });

  const selectedId = initialSelectedId || inbox?.data?.at(0)?.id;

  return (
    <InboxView
      key={selectedId}
      items={inbox?.data}
      inboxId={user?.data?.team?.inbox_id}
      team={user?.data?.team}
      selectedId={selectedId}
    />
  );
}
