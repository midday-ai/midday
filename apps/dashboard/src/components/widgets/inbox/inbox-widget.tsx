"use client";

import { CopyInput } from "@/components/copy-input";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { getInboxEmail } from "@midday/inbox";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { InboxOption } from "./data";
import { InboxList } from "./inbox-list";

type Props = {
  disabled: boolean;
  filter: InboxOption;
};

export function InboxWidget({ disabled, filter }: Props) {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { data } = useSuspenseQuery(
    trpc.inbox.get.queryOptions({
      filter: {
        done: filter === "done",
      },
    }),
  );

  if (!data?.data?.length) {
    return (
      <div className="flex flex-col space-y-4 items-center justify-center h-full text-center">
        <div>
          <CopyInput value={getInboxEmail(user?.team?.inbox_id ?? "")} />
        </div>

        <p className="text-sm text-[#606060]">
          Use this email for online purchases to seamlessly
          <br />
          match invoices againsts transactions.
        </p>
      </div>
    );
  }

  return <InboxList data={data.data} />;
}
