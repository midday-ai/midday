import {
  getInbox,
  getTransactions,
  getUser,
} from "@midday/supabase/cached-queries";
import { revalidateTag } from "next/cache";
import { InboxView } from "./inbox-view";

async function onRefresh() {
  "use server";

  const user = await getUser();

  revalidateTag(`inbox_${user?.data?.team_id}`);
}

export async function Inbox({ selectedId: initialSelectedId }) {
  const user = await getUser();

  const transactions = await getTransactions({
    from: 0,
    to: 10,
    filter: {
      attachments: "exclude",
    },
  });

  // TODO: Fix Infinite Scroll
  const inbox = await getInbox({
    to: 10000,
  });

  const selectedId = initialSelectedId || inbox?.data?.at(0)?.id;

  return (
    <InboxView
      key={selectedId}
      items={inbox?.data}
      inboxId={user?.data?.team?.inbox_id}
      teamId={user?.data?.team?.id}
      selectedId={selectedId}
      onRefresh={onRefresh}
      latestTransactions={transactions?.data}
    />
  );
}
