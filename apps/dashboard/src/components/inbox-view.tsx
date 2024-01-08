"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { InboxDetails } from "@/components/inbox-details";
import { InboxList } from "@/components/inbox-list";
import { InboxUpdates } from "@/components/inbox-updates";
import { createClient } from "@midday/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { TooltipProvider } from "@midday/ui/tooltip";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useQueryState } from "next-usequerystate";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CopyInput } from "./copy-input";
import { InboxEmpty } from "./inbox-empty";

export function InboxView({
  items,
  inboxId,
  teamId,
  selectedId: initialSelectedId,
  onRefresh,
}) {
  const [updates, setUpdates] = useState();
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

  useEffect(() => {
    const currentIndex = items?.findIndex((row) => row.id === selectedId);

    const keyDownHandler = (evt: KeyboardEvent) => {
      if (selectedId && evt.key === "ArrowDown") {
        evt.preventDefault();
        const nextItem = items.at(currentIndex + 1);

        if (nextItem) {
          setSelectedId(nextItem.id);
        }
      }

      if (selectedId && evt.key === "ArrowUp") {
        evt.preventDefault();

        const prevItem = items.at(currentIndex - 1);

        if (currentIndex > 0 && prevItem) {
          setSelectedId(prevItem.id);
        }
      }
    };

    document.addEventListener("keydown", keyDownHandler);

    return () => {
      document.removeEventListener("keydown", keyDownHandler);
    };
  }, [selectedId, items, setSelectedId]);

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
            <TabsTrigger className="p-0" value="completed">
              Completed
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
                // router.push("/inbox");
                onRefresh();
                setUpdates(false);
              }}
            />

            <TabsContent value="all" className="m-0  h-full">
              <InboxList
                items={optimisticData}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
            <TabsContent value="completed" className="m-0  h-full">
              <InboxList
                items={optimisticData.filter(
                  (item) => item.status === "completed"
                )}
                selectedId={selectedId}
                updateInbox={updateInbox}
                setSelectedId={setSelectedId}
              />
            </TabsContent>
          </div>

          <InboxDetails item={selectedItems} updateInbox={updateInbox} />
        </div>
      </Tabs>
    </TooltipProvider>
  );
}
