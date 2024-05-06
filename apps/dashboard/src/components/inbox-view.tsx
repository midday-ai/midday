"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { InboxDetails } from "@/components/inbox-details";
import { InboxList } from "@/components/inbox-list";
import { createClient } from "@midday/supabase/client";
import { TabsContent } from "@midday/ui/tabs";
import { ToastAction } from "@midday/ui/toast";
import { useToast } from "@midday/ui/use-toast";
import { useOptimisticAction } from "next-safe-action/hooks";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { InboxHeader } from "./inbox-header";
import { InboxStructure } from "./inbox-structure";
import { InboxToolbar } from "./inbox-toolbar";

type Props = {
  items: any[];
  forwardEmail: string;
  inboxForwarding: boolean;
  inboxId: string;
  teamId: string;
  ascending: boolean;
};

export const TAB_ITEMS = ["todo", "done"];

const todoFilter = (item) =>
  !item.transaction_id &&
  item.status !== "deleted" &&
  item.status !== "archived";

const doneFilter = (item) =>
  item.transaction_id &&
  item.status !== "deleted" &&
  item.status !== "archived";

export function InboxView({
  items: initialItems,
  forwardEmail,
  inboxForwarding,
  teamId,
  inboxId,
  ascending,
}: Props) {
  const supabase = createClient();
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);

  const [params, setParams] = useQueryStates({
    inboxId: parseAsString.withDefault(
      items?.filter(todoFilter)?.at(0)?.id ?? null
    ),
    q: parseAsString.withDefault(""),
    tab: parseAsStringEnum(TAB_ITEMS).withDefault("todo"),
  });

  useEffect(() => {
    setItems(initialItems);
  }, [ascending]);

  useEffect(() => {
    const channel = supabase
      .channel("realtime_inbox")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inbox",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              {
                setItems((prev) => [payload.new, ...prev]);

                if (params.inboxId) {
                  setParams({ inboxId: payload.new.id });
                }
              }
              break;
            case "UPDATE":
              {
                setItems((prev) => {
                  return prev.map((item) => {
                    if (item.id === payload.new.id) {
                      return { ...item, ...payload.new };
                    }

                    return item;
                  });
                });
              }
              break;
            default:
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const { execute: updateInbox, optimisticData } = useOptimisticAction(
    updateInboxAction,
    items,
    (state, payload) => {
      if (payload.status === "deleted") {
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
    }
  );

  const getCurrentItems = (tab: (typeof TAB_ITEMS)[0]) => {
    if (params.q) {
      return optimisticData;
    }

    switch (tab) {
      case "todo":
        return optimisticData?.filter(todoFilter);
      case "done":
        return optimisticData?.filter(doneFilter);
      default:
        return optimisticData?.filter(todoFilter);
    }
  };

  const currentItems = getCurrentItems(params.tab);
  const selectedItems = currentItems?.find(
    (item) => item.id === params.inboxId
  );
  const currentIndex = currentItems?.findIndex(
    (item) => item.id === params.inboxId
  );
  const currentTabEmpty = Boolean(currentItems?.length === 0);

  const selectNextItem = () => {
    const selectIndex = currentIndex > 0 ? currentIndex - 1 : 1;

    setParams({
      inboxId: currentItems?.at(selectIndex)?.id ?? null,
    });
  };

  const handleOnPaginate = (direction) => {
    if (direction === "up") {
      const index = currentIndex - 1;
      setParams({ inboxId: currentItems.at(index)?.id });
    }

    if (direction === "down") {
      const index = currentIndex + 1;
      setParams({ inboxId: currentItems.at(index)?.id });
    }

    const currentTabIndex = TAB_ITEMS.indexOf(params.tab);

    if (direction === "left") {
      const nextTabIndex =
        currentTabIndex < TAB_ITEMS.length
          ? currentTabIndex - 1
          : currentTabIndex;
      const nextTab = TAB_ITEMS[nextTabIndex];

      if (nextTabIndex >= 0) {
        setParams({
          tab: nextTab,
          inboxId: getCurrentItems(nextTab)?.at(0)?.id ?? null,
        });
      }
    }

    if (direction === "right") {
      const nextTabIndex =
        currentTabIndex < TAB_ITEMS.length
          ? currentTabIndex + 1
          : currentTabIndex;
      const nextTab = TAB_ITEMS[nextTabIndex];

      if (nextTabIndex < TAB_ITEMS.length)
        setParams({
          tab: nextTab,
          inboxId: getCurrentItems(nextTab)?.at(0)?.id ?? null,
        });
    }
  };

  const handleOnDelete = () => {
    selectNextItem();

    toast({
      duration: 6000,
      title: "Item deleted",
      description: "You can still find the attachment in your Vault.",
      variant: "success",
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => updateInbox({ id: params.inboxId, status: "pending" })}
        >
          Undo
        </ToastAction>
      ),
    });

    updateInbox({
      id: params.inboxId,
      status: "deleted",
    });
  };

  const handleOnSelectTransaction = (item) => {
    selectNextItem();
    updateInbox(item);
  };

  return (
    <InboxStructure
      onChangeTab={(tab) => {
        const items = getCurrentItems(tab);
        setParams({ inboxId: items?.at(0)?.id ?? null, q: null });
      }}
      headerComponent={
        <InboxHeader
          inboxForwarding={inboxForwarding}
          forwardEmail={forwardEmail}
          inboxId={inboxId}
          handleOnPaginate={handleOnPaginate}
          ascending={ascending}
        />
      }
      leftComponent={
        <>
          {TAB_ITEMS.map((value) => (
            <TabsContent key={value} value={value} className="m-0 h-full">
              <InboxList
                items={currentItems}
                hasQuery={Boolean(params.q)}
                onClear={() =>
                  setParams(
                    { q: null, inboxId: currentItems?.id ?? null },
                    { shallow: false }
                  )
                }
              />
            </TabsContent>
          ))}

          <InboxToolbar
            onAction={handleOnDelete}
            isFirst={currentIndex === 0}
            isLast={currentIndex === currentItems?.length - 1}
            onKeyPress={handleOnPaginate}
          />
        </>
      }
      rightComponent={
        <InboxDetails
          item={selectedItems}
          onSelectTransaction={handleOnSelectTransaction}
          onDelete={handleOnDelete}
          teamId={teamId}
          isEmpty={currentTabEmpty}
        />
      }
    />
  );
}
