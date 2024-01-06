import { getInbox } from "@midday/supabase/cached-queries";
import { InboxView } from "./inbox-view";

export async function Inbox() {
  const inbox = await getInbox();

  return <InboxView items={inbox?.data} />;
}
