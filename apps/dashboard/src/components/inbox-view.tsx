"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { searchEmbeddingsAction } from "@/actions/search/search-embeddings-action";
import { InboxDetails } from "@/components/inbox-details";
import { InboxList, InboxSkeleton } from "@/components/inbox-list";
import { TabsContent } from "@midday/ui/tabs";
import { useDebounce } from "@uidotdev/usehooks";
import { useOptimisticAction } from "next-safe-action/hooks";
import { useAction } from "next-safe-action/hooks";
import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxHeader } from "./inbox-header";
import { InboxStructure } from "./inbox-structure";
import { InboxToolbar } from "./inbox-toolbar";

type Props = {
  items: any[];
  forwardEmail: string;
  inboxId: string;
  teamId: string;
};

export function InboxView({ items, forwardEmail, teamId, inboxId }: Props) {
  const [isLoading, setLoading] = useState(false);
  const [params, setParams] = useQueryStates(
    {
      id: parseAsString.withDefault(items?.at(0)?.id),
      q: parseAsString.withDefault(""),
      tab: parseAsStringEnum(["todo", "done"]).withDefault("todo"),
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

  const getCurrentItems = (tab: "todo" | "done") => {
    if (tab === "todo") {
      return optimisticData.filter((item) => !item.transaction_id);
    }

    return optimisticData.filter((item) => item.transaction_id);
  };

  const currentItems = getCurrentItems(params.tab);

  const selectedItems = currentItems?.find((item) => item.id === params.id);
  const currentIndex = currentItems.findIndex((item) => item.id === params.id);

  const handleOnPaginate = (direction) => {
    if (direction === "up") {
      const index = currentIndex - 1;
      setParams({ id: currentItems.at(index)?.id });
    }

    if (direction === "down") {
      const index = currentIndex + 1;
      setParams({ id: currentItems.at(index)?.id });
    }

    if (direction === "left") {
      setParams({ tab: "todo", id: getCurrentItems("todo")?.at(0)?.id });
    }

    if (direction === "right") {
      setParams({ tab: "done", id: getCurrentItems("done")?.at(0)?.id });
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
            onClear={() => {
              setParams({ q: null, id: null });
            }}
          />

          {isLoading && <InboxSkeleton numberOfItems={12} />}

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

          <InboxToolbar
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
