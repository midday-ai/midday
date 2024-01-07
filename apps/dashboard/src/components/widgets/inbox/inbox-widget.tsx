import { getUser, getinboxs } from "@midday/supabase/cached-queries";
import { getInboxQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";
import { cn } from "@midday/ui/utils";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import Link from "next/link";
import { inboxData } from "./data";

export function InboxHeader() {
  return (
    <div className="flex  p-3 border-b-[1px]">
      <span className="font-medium text-sm w-[50%]">Description</span>
      <span className="font-medium text-sm w-[35%]">Amount</span>
      <span className="font-medium text-sm">Status</span>
    </div>
  );
}

export function InboxSkeleton() {
  return (
    <div className="divide-y">
      {[...Array(6)].map((_, index) => (
        <div
          key={index.toString()}
          className="flex justify-between px-3 items-center h-[44px]"
        >
          <div className="w-[60%]">
            <Skeleton className="h-4 w-[50%]" />
          </div>
          <div className="w-[40%]">
            <Skeleton className="w-[60%] h-4 align-start" />
          </div>
        </div>
      ))}
    </div>
  );
}

export async function InboxWidget({ filter, disabled }) {
  const supabase = createClient();
  const user = await getUser();

  const { data } = disabled
    ? inboxData
    : await getInboxQuery(supabase, {
        to: 3,
        from: 0,
        teamId: user.data.team_id,
      });

  if (!data?.length) {
    // TODO: Empty state
    return;
  }

  return (
    <div className="flex flex-col gap-4 pt-8">
      {data.map((item) => (
        <Link
          key={item.id}
          href={`/inbox?id=${item.id}`}
          className="flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-sm transition-all"
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="font-semibold">{item.name}</div>
                {!item.read && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-[#FFD02B]" />
                )}
              </div>
              <div className="ml-auto text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
            <div className="text-xs font-medium">{item?.attachment_name}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
