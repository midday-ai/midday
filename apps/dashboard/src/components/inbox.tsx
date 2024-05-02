import { getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxEmpty } from "./inbox-empty";
import { InboxView } from "./inbox-view";

type Props = {
  ascending: boolean;
  query?: string;
};

export async function Inbox({ ascending, query }: Props) {
  const user = await getUser();
  const supabase = createClient();

  const inbox = await getInboxQuery(supabase, {
    to: 10000,
    teamId: user.data.team_id,
    ascending,
  });

  if (!inbox?.data?.length) {
    return <InboxEmpty inboxId={user?.data?.team?.inbox_id} />;
  }

  return (
    <InboxView
      items={inbox?.data}
      teamId={user?.data?.team?.id}
      inboxId={user?.data?.team?.inbox_id}
      forwardEmail={user?.data?.team?.inbox_email}
      inboxForwarding={user?.data?.team?.inbox_forwarding}
      ascending={ascending}
      query={query}
    />
  );
}
