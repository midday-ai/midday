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
} from "@midday/ui/alert-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { revalidateInbox } from "@/actions/revalidate-action";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useTRPC } from "@/trpc/client";

type Props = {
  id: string;
  filePath: string[] | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteInboxDialog({
  id,
  filePath,
  isOpen,
  onOpenChange,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setParams, params } = useInboxParams();
  const { params: filter } = useInboxFilterParams();
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if inbox item has transaction attachments
  const { data: attachmentData, isLoading: isCheckingAttachments } = useQuery(
    trpc.inbox.checkAttachments.queryOptions(
      { id },
      {
        enabled: isOpen, // Only run when dialog is open
      },
    ),
  );

  const deleteInboxMutation = useMutation(
    trpc.inbox.delete.mutationOptions({
      onMutate: async () => {
        setIsDeleting(true);

        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        // Get current data
        const previousData = queryClient.getQueriesData({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        // Flatten the data from all pages to find the current index and the next item
        const allInboxes = previousData
          // @ts-expect-error
          .flatMap(([, data]) => data?.pages ?? [])
          .flatMap((page) => page.data ?? []);

        const currentIndex = allInboxes.findIndex((item) => item.id === id);
        let nextInboxId: string | null = null;

        if (allInboxes.length > 1) {
          if (currentIndex === allInboxes.length - 1) {
            // If it was the last item, select the previous one
            nextInboxId = allInboxes[currentIndex - 1]?.id ?? null;
          } else if (currentIndex !== -1) {
            // Otherwise, select the next one
            nextInboxId = allInboxes[currentIndex + 1]?.id ?? null;
          }
        }
        // If list had 0 or 1 item, or index not found, nextInboxId remains null

        // Optimistically update infinite query data
        queryClient.setQueriesData(
          { queryKey: trpc.inbox.get.infiniteQueryKey() },
          (old: any) => ({
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((item: any) => item.id !== id),
            })),
            pageParams: old.pageParams,
          }),
        );

        setParams({
          ...params,
          inboxId: nextInboxId,
        });

        return { previousData, allInboxes };
      },
      onSuccess: async (_, __, context) => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.search.global.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });

        // Revalidate server-side cache
        await revalidateInbox();

        // Check if inbox is now empty after deletion
        // Use the optimistically updated data from onMutate
        const remainingInboxes = (context?.allInboxes ?? []).filter(
          (item) => item.id !== id,
        );

        const hasFilters = Object.values(filter).some(
          (value) => value !== null,
        );

        // If inbox is empty and no filters, navigate to show empty state
        if (remainingInboxes.length === 0 && !hasFilters) {
          setParams({ inboxId: null, connected: null });
          router.push("/inbox", { scroll: false });
        }

        onOpenChange(false);
      },
      onError: (_, __, context) => {
        setIsDeleting(false);
        // Restore previous data on error
        if (context?.previousData) {
          queryClient.setQueriesData(
            { queryKey: trpc.inbox.get.infiniteQueryKey() },
            context.previousData,
          );
        }
      },
      onSettled: () => {
        setIsDeleting(false);
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const handleDelete = () => {
    deleteInboxMutation.mutate({ id });
  };

  const hasAttachments = attachmentData?.hasAttachments ?? false;
  const attachmentCount = attachmentData?.attachments?.length ?? 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-sm">
            Delete File
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {hasAttachments ? (
              <div className="space-y-3">
                <p>
                  You are about to delete this file from your inbox and vault.
                </p>
                <div className="my-6 px-3 py-3 bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-300 mb-1">
                        This file is attached to {attachmentCount} transaction
                        {attachmentCount > 1 ? "s" : ""}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        Deleting will remove the attachment
                        {attachmentCount > 1 ? "s" : ""} from the transaction
                        {attachmentCount > 1 ? "s" : ""}.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to continue?
                </p>
              </div>
            ) : (
              <div>
                <p>
                  You are about to delete this file from your inbox and vault.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This action cannot be undone.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </div>
            ) : (
              "Delete File"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
