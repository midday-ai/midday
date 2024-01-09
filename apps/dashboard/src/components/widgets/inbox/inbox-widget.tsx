import { CopyInput } from "@/components/copy-input";
import { getInbox, getUser } from "@midday/supabase/cached-queries";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import Link from "next/link";
import { inboxData } from "./data";

export async function InboxWidget({ filter, disabled }) {
  const user = await getUser();

  const { data } = disabled
    ? inboxData
    : await getInbox({
        to: 3,
        from: 0,
        status: filter,
      });

  if (!data?.length) {
    return (
      <div className="flex flex-col space-y-4 items-center justify-center h-full text-center">
        <div>
          <CopyInput value={`${user?.data?.team?.inbox_id}@inbox.midday.ai`} />
        </div>

        <p className="text-sm text-[#606060]">
          Use this email for online purchases to seamlessly
          <br />
          match receipts againsts transactions.
        </p>
      </div>
    );
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
            <div className="flex items-center mb-1">
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
            <div className="flex">
              <div className="text-xs font-medium">{item?.file_name}</div>
              <div className="ml-auto text-xs font-medium">€134.50</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
