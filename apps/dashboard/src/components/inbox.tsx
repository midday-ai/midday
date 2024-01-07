import { getInbox, getUser } from "@midday/supabase/cached-queries";
import { InboxView } from "./inbox-view";

export async function Inbox({ searchParams }) {
  // TODO: Fix Infinite Scroll
  const inbox = await getInbox({ to: 10000 });
  const user = await getUser();

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
