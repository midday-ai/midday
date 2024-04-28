"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { searchEmbeddingsAction } from "@/actions/search/search-embeddings-action";
import { InboxDetails } from "@/components/inbox-details";
import { InboxList } from "@/components/inbox-list";
import { TabsContent } from "@midday/ui/tabs";
import { useDebounce } from "@uidotdev/usehooks";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxHeader } from "./inbox-header";
import { InboxListSkeleton } from "./inbox-list-skeleton";
import { InboxStructure } from "./inbox-structure";
import { InboxToolbar } from "./inbox-toolbar";

type Props = {
  items: any[];
  forwardEmail: string;
  inboxId: string;
  teamId: string;
  ascending: boolean;
};

export const TAB_ITEMS = ["todo", "done", "trash"];

const todoFilter = (item) =>
  !item.transaction_id && !item.trash && !item.archived;
const doneFilter = (item) =>
  item.transaction_id && !item.trash && !item.archived;
const trashFilter = (item) => item.trash;

export function InboxView({
  items,
  forwardEmail,
  teamId,
  inboxId,
  ascending,
}: Props) {
  const [isLoading, setLoading] = useState(false);
  const [params, setParams] = useQueryStates(
    {
      id: parseAsString.withDefault(items.filter(todoFilter)?.at(0)?.id),
      q: parseAsString.withDefault(""),
      tab: parseAsStringEnum(TAB_ITEMS).withDefault("todo"),
    },
    {
      shallow: true,
    }
  );

  const debouncedSearchTerm = useDebounce(params.q, 300);

  const searchAction = useAction(searchEmbeddingsAction, {
    onSuccess: (data) => {
      setLoading(false);

      if (data.length) {
        setParams({ id: data?.at(0)?.id });
      }
    },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    if (params.q) {
      setLoading(true);
    }
  }, [params.q]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchAction.execute({
        query: debouncedSearchTerm,
        type: "inbox",
        threshold: 0.78,
      });
    }
  }, [debouncedSearchTerm]);

  const data = ((params.q && searchAction.result?.data) || items) ?? [];

  const { execute: updateInbox, optimisticData } = useOptimisticAction(
    updateInboxAction,
    data,
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

          setParams({
            id: optimisticData?.at(selectIndex)?.id,
          });
        }
      },
    }
  );

  const getCurrentItems = (tab: (typeof TAB_ITEMS)[0]) => {
    if (params.q) {
      return optimisticData;
    }

    switch (tab) {
      case "todo":
        return optimisticData.filter(todoFilter);
      case "done":
        return optimisticData.filter(doneFilter);
      case "trash":
        return optimisticData.filter(trashFilter);
      default:
        return optimisticData;
    }
  };

  const currentItems = getCurrentItems(params.tab);
  const selectedItems = currentItems?.find((item) => item.id === params.id);
  const currentIndex = currentItems.findIndex((item) => item.id === params.id);

  const handleOnDelete = () => {
    const currentId = params.id;

    setParams({ id: null });
    updateInbox({ id: currentId, trash: true });
  };

  const handleOnPaginate = (direction) => {
    if (direction === "up") {
      const index = currentIndex - 1;
      setParams({ id: currentItems.at(index)?.id });
    }

    if (direction === "down") {
      const index = currentIndex + 1;
      setParams({ id: currentItems.at(index)?.id });
    }

    const currentTabIndex = TAB_ITEMS.indexOf(params.tab);

    if (direction === "left") {
      const nextTabIndex =
        currentTabIndex < TAB_ITEMS.length
          ? currentTabIndex - 1
          : currentTabIndex;
      const nextTab = TAB_ITEMS[nextTabIndex];

      if (nextTabIndex >= 0) {
        setParams({ tab: nextTab, id: getCurrentItems(nextTab)?.at(0)?.id });
      }
    }

    if (direction === "right") {
      const nextTabIndex =
        currentTabIndex < TAB_ITEMS.length
          ? currentTabIndex + 1
          : currentTabIndex;
      const nextTab = TAB_ITEMS[nextTabIndex];

      if (nextTabIndex < TAB_ITEMS.length)
        setParams({ tab: nextTab, id: getCurrentItems(nextTab)?.at(0)?.id });
    }
  };

  return (
    <InboxStructure
      onChangeTab={(tab) => {
        const items = getCurrentItems(tab);
        setParams({ id: items?.at(0)?.id });
      }}
      leftColumn={
        <>
          <InboxHeader
            forwardEmail={forwardEmail}
            inboxId={inboxId}
            handleOnPaginate={handleOnPaginate}
            ascending={ascending}
          />

          {isLoading && <InboxListSkeleton numberOfItems={12} />}

          <TabsContent value="todo" className="m-0 h-full">
            <InboxList
              items={currentItems}
              selectedId={params.id}
              setSelectedId={(value: string) => setParams({ id: value })}
            />
          </TabsContent>

          <TabsContent value="done" className="m-0 h-full">
            <InboxList
              items={currentItems}
              selectedId={params.id}
              setSelectedId={(value: string) => setParams({ id: value })}
            />
          </TabsContent>

          <TabsContent value="trash" className="m-0 h-full">
            <InboxList
              items={currentItems}
              selectedId={params.id}
              setSelectedId={(value: string) => setParams({ id: value })}
            />
          </TabsContent>

          <InboxToolbar
            onDelete={handleOnDelete}
            isFirst={currentIndex === 0}
            isLast={currentIndex === currentItems.length - 1}
            onKeyPress={handleOnPaginate}
          />
        </>
      }
      rightColumn={
        isLoading ? (
          <InboxDetailsSkeleton />
        ) : (
          <InboxDetails
            item={selectedItems}
            updateInbox={updateInbox}
            teamId={teamId}
          />
        )
      }
    />
  );
}
