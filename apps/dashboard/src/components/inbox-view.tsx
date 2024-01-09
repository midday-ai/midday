"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { InboxDetails, InboxDetailsSkeleton } from "@/components/inbox-details";
import { InboxList, InboxSkeleton } from "@/components/inbox-list";
import { InboxUpdates } from "@/components/inbox-updates";
import { createClient } from "@midday/supabase/client";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useQueryState } from "next-usequerystate";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyInput } from "./copy-input";
import { InboxEmpty } from "./inbox-empty";

export function InboxViewSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between py-2 mb-6 mt-2">
        <div className="space-x-4 flex">
          <div>
            <Skeleton className="h-3 w-[80px]" />
          </div>
          <div>
            <Skeleton className="h-3 w-[100px]" />
          </div>
        </div>

        <div>
          <Skeleton className="w-[245px] rounded-sm h-[30px]" />
        </div>
      </div>

      <div className="flex flex-row space-x-8">
        <div className="w-full h-full relative overflow-hidden">
          <div className="h-[calc(100vh-180px)]">
            <div className="flex flex-col gap-4 pt-0">
              <InboxSkeleton numberOfItems={12} />
            </div>
          </div>
        </div>

        <InboxDetailsSkeleton />
      </div>
    </div>
  );
}

export function InboxView({
  items,
  inboxId,
  teamId,
  selectedId: initialSelectedId,
  latestTransactions,
  onRefresh,
}) {
  const [updates, setUpdates] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const [selectedId, setSelectedId] = useQueryState("id", {
    defaultValue: initialSelectedId,
    shallow: true,
  });

  const { execute: updateInbox, optimisticData } = useOptimisticAction(
    updateInboxAction,
    items,
    (state, payload) => {
      if (payload.read) {
        return items.map((item) => {
          if (item.id === payload.id) {
            return {
              ...item,
              read: true,
            };
          }

          return item;
        });
      }

      if (payload.status === "delete") {
        return state.filter((item) => item.id === payload.id);
      }

      return state;
    },
    {
      onSuccess: (_, input) => {
        if (input.status === "deleted") {
          router.push("/inbox");
        }
      },
    }
  );

  useEffect(() => {
    supabase
      .channel("changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setUpdates(true);

            // If nothing in inbox yet
            if (!optimisticData?.length) {
              onRefresh();
            }
          }

          if (
            payload.eventType === "DELETE" ||
            payload.eventType === "UPDATE"
          ) {
            onRefresh();
          }
        }
      )
      .subscribe();
  }, [teamId, supabase]);

  const selectedItems = optimisticData?.find((item) => item.id === selectedId);

  if (!optimisticData?.length) {
    return <InboxEmpty inboxId={inboxId} />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between py-2 mb-4 mt-2">
          <TabsList className="p-0 h-auto space-x-4 bg-transparent">
            <TabsTrigger className="p-0" value="all">
              All
            </TabsTrigger>
            <TabsTrigger className="p-0" value="handled">
              Handled
            </TabsTrigger>
          </TabsList>

          <div>
            <CopyInput value={`${inboxId}@inbox.midday.ai`} />
          </div>
        </div>

        <div className="flex flex-row space-x-8">
          <div className="w-full h-full relative overflow-hidden">
            <InboxUpdates
              show={Boolean(updates)}
              onRefresh={() => {
                onRefresh();
                setUpdates(false);
              }}
            />

            <TabsContent value="all" className="m-0 h-full">
              <InboxList
                items={optimisticData}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
            <TabsContent value="handled" className="m-0 h-full">
              <InboxList
                items={optimisticData.filter(
                  (item) => item.status === "handled"
                )}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
          </div>

          <InboxDetails
            item={selectedItems}
            latestTransactions={latestTransactions}
            updateInbox={updateInbox}
            teamId={teamId}
          />
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
