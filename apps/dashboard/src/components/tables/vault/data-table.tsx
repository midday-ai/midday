"use client";

import { LoadMore } from "@/components/load-more";
import { NoResults } from "@/components/vault/empty-states";
import { VaultGetStarted } from "@/components/vault/vault-get-started";
import { useDocumentFilterParams } from "@/hooks/use-document-filter-params";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useRealtime } from "@/hooks/use-realtime";
import { useUserQuery } from "@/hooks/use-user";
import { useDocumentsStore } from "@/store/vault";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Table, TableBody, TableCell, TableRow } from "@midday/ui/table";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence } from "framer-motion";
import * as React from "react";
import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";
import { useCopyToClipboard } from "usehooks-ts";
import { useDebounceCallback } from "usehooks-ts";
import { BottomBar } from "./bottom-bar";
import { columns } from "./columns";
import { DataTableHeader } from "./data-table-header";

export function DataTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const { data: user } = useUserQuery();
  const { filter, hasFilters } = useDocumentFilterParams();
  const { setRowSelection, rowSelection } = useDocumentsStore();
  const { setParams, params } = useDocumentParams();
  const [, copy] = useCopyToClipboard();

  const infiniteQueryOptions = trpc.documents.get.infiniteQueryOptions(
    {
      pageSize: 20,
      filter,
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

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [inView]);

  const debouncedEventHandler = useDebounceCallback(() => {
    refetch();

    queryClient.invalidateQueries({
      queryKey: trpc.documents.get.queryKey(),
    });
  }, 50);

  useRealtime({
    channelName: "realtime_documents",
    table: "documents",
    filter: `team_id=eq.${user?.teamId}`,
    onEvent: (payload) => {
      if (
        payload.eventType === "INSERT" ||
        (payload.eventType === "UPDATE" && params.view === "list")
      ) {
        debouncedEventHandler();
      }
    },
  });

  const deleteDocumentMutation = useMutation(
    trpc.documents.delete.mutationOptions({
      onMutate: async ({ id }) => {
        setParams({ documentId: null });

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        // Get current data
        const previousData = queryClient.getQueriesData({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        // Optimistically update infinite query data
        queryClient.setQueriesData(
          { queryKey: trpc.documents.get.infiniteQueryKey() },
          (old: InfiniteData<any>) => ({
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((item: any) => item.id !== id),
            })),
            pageParams: old.pageParams,
          }),
        );

        return { previousData };
      },
      onError: (_, __, context) => {
        // Restore previous data on error
        if (context?.previousData) {
          queryClient.setQueriesData(
            { queryKey: trpc.documents.get.infiniteQueryKey() },
            context.previousData,
          );
        }
      },
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const signedUrlMutation = useMutation(
    trpc.documents.signedUrl.mutationOptions({
      onSuccess: (data) => {
        if (data?.signedUrl) {
          copy(data.signedUrl);
        }
      },
    }),
  );

  const handleDelete = (id: string) => {
    deleteDocumentMutation.mutate({
      id,
    });
  };

  const handleShare = (filePath: string[]) => {
    signedUrlMutation.mutate({
      filePath: filePath?.join("/") ?? "",
      expireIn: 60 * 60 * 24 * 30, // 30 days
    });
  };

  const files = useMemo(() => {
    return documents.map((document) => document.pathTokens?.join("/") ?? "");
  }, [documents]);

  const showBottomBar = Object.keys(rowSelection).length > 0;

  const table = useReactTable({
    data: documents,
    columns,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    // @ts-expect-error
    meta: {
      handleDelete,
      handleShare,
    },
    state: {
      rowSelection,
    },
  });

  if (hasFilters && !documents?.length) {
    return <NoResults />;
  }

  if (!documents?.length && !isFetching) {
    return <VaultGetStarted />;
  }

  return (
    <div className="w-full">
      <Table>
        <DataTableHeader table={table} />

        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="h-[40px] md:h-[45px] cursor-pointer select-text"
              >
                {row.getAllCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.className)}
                    onClick={() => {
                      if (
                        cell.column.id !== "select" &&
                        cell.column.id !== "tags" &&
                        cell.column.id !== "actions"
                      ) {
                        setParams({ documentId: row.original.id });
                      }
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AnimatePresence>
        {showBottomBar && <BottomBar data={files} />}
      </AnimatePresence>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </div>
  );
}
