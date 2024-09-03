import { getUser } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { InboxEmpty } from "./inbox-empty";
import { UploadZone } from "./inbox-upload-zone";
import { InboxView } from "./inbox-view";

type Props = {
  ascending: boolean;
  query?: string;
  currencies: string[];
};

export async function Inbox({ ascending, query, currencies }: Props) {
  const supabase = createClient();
  const user = await getUser();

  const teamId = user?.data?.team_id as string;

  const inbox = await getInboxQuery(supabase, {
    to: 10000,
    teamId,
    ascending,
  });

  if (!inbox?.data?.length && !query) {
    return (
      <UploadZone teamId={teamId}>
        <InboxEmpty inboxId={user?.data?.team?.inbox_id} />
      </UploadZone>
    );
  }

  return (
    <UploadZone teamId={teamId}>
      <InboxView
        items={inbox?.data}
        teamId={teamId}
        inboxId={user?.data?.team?.inbox_id}
        forwardEmail={user?.data?.team?.inbox_email}
        inboxForwarding={user?.data?.team?.inbox_forwarding}
        ascending={ascending}
        query={query}
        currencies={currencies}
      />
    </UploadZone>
  );
}
