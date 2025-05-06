"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export function InboxConnectedAccounts() {
  const trpc = useTRPC();

  const { data, refetch } = useQuery(trpc.inboxAccounts.get.queryOptions());

  const deleteInboxAccountMutation = useMutation(
    trpc.inboxAccounts.delete.mutationOptions({
      onSuccess: () => {
        refetch();
      },
    }),
  );

  if (!data?.data?.length) return null;

  return (
    <div>
      <div className="flex flex-col gap-2 mt-6">
        <span className="text-sm font-medium">Connected accounts</span>
      </div>

      <div className="flex flex-col gap-2 mb-6 divide-y divide-border border-b-[1px]">
        {data?.data?.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between py-0.5"
          >
            <div className="flex flex-col justify-between w-full pr-4">
              <div className="text-sm flex justify-between">
                <span className="flex-2 text-sm">{account.email}</span>
                <span className="text-muted-foreground text-xs">
                  {formatDistanceToNow(new Date(account.last_accessed))} ago
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                deleteInboxAccountMutation.mutate({ id: account.id })
              }
            >
              <Icons.Delete />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
