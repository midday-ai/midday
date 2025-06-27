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

  const { data, fetchNextPage, hasNextPage, refetch, isFetching } =
    useSuspenseInfiniteQuery(
      trpc.documents.get.infiniteQueryOptions(
        {
          pageSize: 20,
          ...filter,
        },
        {
          getNextPageParam: ({ meta }) => meta?.cursor,
        },
      ),
    );

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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });

        // Invalidate global search
        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
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
      <div className="overflow-x-auto border-l border-r border-border">
        <Table>
          <DataTableHeader table={table} />

          <TableBody className="border-l-0 border-r-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group h-[40px] md:h-[45px] cursor-pointer select-text hover:bg-muted"
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AnimatePresence>
        {showBottomBar && <BottomBar data={files} />}
      </AnimatePresence>

      <LoadMore ref={ref} hasNextPage={hasNextPage} />
    </div>
  );
}
