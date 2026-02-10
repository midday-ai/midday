"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@midday/ui/alert-dialog";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { revalidateInbox } from "@/actions/revalidate-action";
import { Portal } from "@/components/portal";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useInboxStore } from "@/store/inbox";
import { useTRPC } from "@/trpc/client";

export function InboxBulkActions() {
  const { selectedIds, clearSelection } = useInboxStore();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setParams } = useInboxParams();
  const { params: filter } = useInboxFilterParams();
  const [isOpen, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const selectedIdsArray = Object.keys(selectedIds);
  const selectedCount = selectedIdsArray.length;

  useEffect(() => {
    if (selectedCount > 0) {
      setOpen(true);
    } else {
      setOpen(false);
      setIsDialogOpen(false);
    }
  }, [selectedCount]);

  const deleteInboxMutation = useMutation(
    trpc.inbox.deleteMany.mutationOptions({
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        // Get current data
        const previousData = queryClient.getQueriesData({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        // Flatten the data from all pages
        const allInboxes = previousData
          // @ts-expect-error
          .flatMap(([, data]) => data?.pages ?? [])
          .flatMap((page: any) => page.data ?? []);

        // Optimistically update infinite query data by filtering out deleted items
        queryClient.setQueriesData(
          { queryKey: trpc.inbox.get.infiniteQueryKey() },
          (old: any) => ({
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.filter(
                (item: any) => !selectedIdsArray.includes(item.id),
              ),
            })),
            pageParams: old.pageParams,
          }),
        );

        return { previousData, allInboxes };
      },
      onSuccess: async (_, __, context) => {
        // Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.inbox.get.infiniteQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.inbox.getById.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.documents.get.infiniteQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.documents.get.queryKey(),
          }),
        ]);

        // Revalidate server-side cache
        await revalidateInbox();

        // Check if inbox is empty after deletion
        // Use the optimistically updated data from onMutate
        const remainingInboxes = (context?.allInboxes ?? []).filter(
          (item) => !selectedIdsArray.includes(item.id),
        );

        const hasFilters = Object.values(filter).some(
          (value) => value !== null,
        );

        // Navigate to empty state if inbox is empty and no filters
        if (remainingInboxes.length === 0 && !hasFilters) {
          setParams({ inboxId: null, connected: null });
          router.push("/inbox", { scroll: false });
        }

        clearSelection();
      },
      onError: (_, __, context) => {
        // Restore previous data on error
        if (context?.previousData) {
          queryClient.setQueriesData(
            { queryKey: trpc.inbox.get.infiniteQueryKey() },
            context.previousData,
          );
        }
      },
    }),
  );

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          className="h-12 fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-50"
          animate={{ y: isOpen ? 0 : 100 }}
          initial={{ y: 100 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="relative pointer-events-auto min-w-[400px] h-12">
            {/* Blur layer fades in separately to avoid backdrop-filter animation issues */}
            <motion.div
              className="absolute inset-0 backdrop-filter backdrop-blur-lg bg-[rgba(247,247,247,0.85)] dark:bg-[rgba(19,19,19,0.7)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.15 }}
            />
            <div className="relative h-12 justify-between items-center flex pl-4 pr-2">
              <span className="text-sm">{selectedCount} selected</span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => clearSelection()}
                >
                  <span>Deselect all</span>
                </Button>
                <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button>
                      <Icons.Delete className="mr-2" size={16} />
                      <span>Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete {selectedCount}{" "}
                        {selectedCount === 1 ? "inbox item" : "inbox items"}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteInboxMutation.mutate(selectedIdsArray);
                        }}
                      >
                        {deleteInboxMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  );
}
