"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { InboxDetails, InboxDetailsSkeleton } from "@/components/inbox-details";
import { InboxList, InboxSkeleton } from "@/components/inbox-list";
import { InboxSearch } from "@/components/inbox-search";
import { InboxUpdates } from "@/components/inbox-updates";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { InboxEmpty } from "./inbox-empty";
import { InboxSettingsModal } from "./modals/inbox-settings-modal";

export function InboxViewSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between py-2 mb-6 mt-2">
        <div className="space-x-4 flex mt-3">
          <div>
            <Skeleton className="h-3 w-[80px]" />
          </div>
          <div>
            <Skeleton className="h-3 w-[100px]" />
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
  team,
  selectedId: initialSelectedId,
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
      if (payload.trash) {
        return state.filter((item) => item.id !== payload.id);
      }

      return items.map((item) => {
        if (item.id === payload.id) {
          return {
            ...item,
            ...payload,
          };
        }

        return item;
      });
    },
    {
      onExecute: (input) => {
        if (input.trash) {
          const deleteIndex = optimisticData.findIndex(
            (item) => item.id === input.id
          );

          const selectIndex = deleteIndex > 0 ? deleteIndex - 1 : 0;
          setSelectedId(optimisticData?.at(selectIndex)?.id);
        }
      },
    }
  );

  // useEffect(() => {
  //   const channel = supabase
  //     .channel("realtime_inbox")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "*",
  //         schema: "public",
  //         table: "inbox",
  //         filter: `team_id=eq.${team.id}`,
  //       },
  //       (payload) => {
  //         if (payload.eventType === "INSERT") {
  //           setUpdates(true);

  //           // If nothing in inbox yet
  //           if (!optimisticData?.length) {
  //             router.refresh();
  //           }
  //         }

  //         if (payload.eventType === "UPDATE") {
  //           router.refresh();
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [team, supabase]);

  const selectedItems = optimisticData?.find((item) => item.id === selectedId);

  if (!optimisticData?.length) {
    return <InboxEmpty inboxId={inboxId} />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tabs defaultValue="todo">
        <div className="flex flex-row space-x-8 mt-4">
          <div className="w-full h-full relative overflow-hidden">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <TabsList>
                <TabsTrigger value="todo">Todo</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <InboxSearch />

              <div className="flex space-x-2">
                <Button variant="outline" size="icon">
                  <Icons.Sort size={16} />
                </Button>
                <InboxSettingsModal email={team?.inbox_email} />
              </div>
            </div>

            <InboxUpdates
              show={Boolean(updates)}
              onRefresh={() => {
                setUpdates(false);
              }}
            />

            <TabsContent value="todo" className="m-0 h-full">
              <InboxList
                items={optimisticData}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>

            <TabsContent value="pending" className="m-0 h-full">
              <InboxList
                items={optimisticData.filter(
                  (item) => item.pending && !item.transaction_id
                )}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>

            <TabsContent value="completed" className="m-0 h-full">
              <InboxList
                items={optimisticData.filter((item) => item.transaction_id)}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
          </div>

          <InboxDetails
            item={selectedItems}
            updateInbox={updateInbox}
            teamId={team.id}
          />
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
