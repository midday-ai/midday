"use client";

import {
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { VaultItem } from "@/components/vault/vault-item";
import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { NoResults } from "./empty-states";
import { VaultGetStarted } from "./vault-get-started";

const ROW_HEIGHT = 288; // h-72 = 18rem = 288px
const GAP = 32; // gap-8 = 2rem = 32px

/**
 * Compute the number of grid columns based on viewport width,
 * matching the Tailwind breakpoints previously used by the CSS grid:
 * grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-6
 */
function getColumnCount(width: number): number {
  if (width >= 1800) return 6; // 3xl
  if (width >= 1024) return 4; // lg
  if (width >= 768) return 3; // md
  if (width >= 640) return 2; // sm
  return 1;
}

export function VaultGrid() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: user } = useUserQuery();
  const parentRef = useRef<HTMLDivElement>(null);

  const { filter, hasFilters } = useDocumentFilterParams();
  const { params } = useDocumentParams();

  // Hide header on scroll (matches table view behavior)
  useScrollHeader(parentRef);

  // Responsive column count based on viewport width
  // Default to 4 on both server and client to avoid hydration mismatch
  const [columnCount, setColumnCount] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount(window.innerWidth));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const infiniteQueryOptions = trpc.documents.get.infiniteQueryOptions(
    {
      pageSize: 24,
      ...filter,
    },
    {
      getNextPageParam: ({ meta }) => meta?.cursor,
    },
  );

  const { data, fetchNextPage, hasNextPage, refetch, isFetching } =
    useSuspenseInfiniteQuery(infiniteQueryOptions);

  const documents = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const rowCount = Math.ceil(documents.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + GAP,
    overscan: 3,
  });

  // Trigger fetchNextPage when last virtual row is near the viewport
  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];

    if (
      lastItem &&
      lastItem.index >= rowCount - 2 &&
      hasNextPage &&
      !isFetching
    ) {
      fetchNextPage();
    }
  }, [virtualItems, rowCount, hasNextPage, isFetching, fetchNextPage]);

  const debouncedEventHandler = useDebounceCallback(() => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.documents.get.queryKey(),
    });

    queryClient.invalidateQueries({
      queryKey: trpc.documents.get.infiniteQueryKey(),
    });

    // Invalidate global search
    queryClient.invalidateQueries({
      queryKey: trpc.search.global.queryKey(),
    });
  }, 50);

  useRealtime({
    channelName: "realtime_documents",
    table: "documents",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      if (
        payload.eventType === "INSERT" ||
        (payload.eventType === "UPDATE" && params.view === "grid")
      ) {
        debouncedEventHandler();
      }
    },
  });

  if (hasFilters && !documents?.length) {
    return <NoResults />;
  }

  if (!documents?.length && !isFetching) {
    return <VaultGetStarted />;
  }

  return (
    <div
      ref={parentRef}
      className="overflow-auto overscroll-contain scrollbar-hide"
      style={{
        height: "calc(100vh - 180px + var(--header-offset, 0px))",
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const rowDocuments = documents.slice(
            startIndex,
            startIndex + columnCount,
          );

          return (
            <div
              key={virtualRow.index}
              className="flex gap-8"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {rowDocuments.map((document) => (
                <div key={document.id} className="flex-1 min-w-0">
                  {/* @ts-expect-error */}
                  <VaultItem data={document} />
                </div>
              ))}
              {/* Fill empty slots in last row to maintain grid alignment */}
              {rowDocuments.length < columnCount &&
                Array.from({ length: columnCount - rowDocuments.length }).map(
                  (_, i) => (
                    <div
                      key={`empty-${virtualRow.index}-${i}`}
                      className="flex-1 min-w-0"
                    />
                  ),
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
