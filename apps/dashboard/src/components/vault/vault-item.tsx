"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { isMimeTypeSupportedForProcessing } from "@midday/documents/utils";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memo, useEffect, useState } from "react";
import { FilePreview } from "@/components/file-preview";
import { VaultItemTags } from "@/components/vault/vault-item-tags";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useTRPC } from "@/trpc/client";
import { isStaleProcessing } from "@/utils/document";
import { VaultItemActions } from "./vault-item-actions";

type Props = {
  data: Partial<RouterOutputs["documents"]["get"]["data"][number]> & {
    id: string;
    name?: string | null;
    metadata: Record<string, unknown>;
    pathTokens: string[];
    title: string;
    summary: string;
    createdAt?: string | Date | null;
    documentTagAssignments?: Array<{
      documentTag: { id: string; name: string; slug: string };
    }>;
  };
  small?: boolean;
};

export const VaultItem = memo(function VaultItem({ data, small }: Props) {
  const { setParams } = useDocumentParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Local state to bridge gap until props update from parent
  const [isReprocessing, setIsReprocessing] = useState(false);

  const mimetype = (data?.metadata as { mimetype?: string })?.mimetype;
  const isSupported = mimetype
    ? isMimeTypeSupportedForProcessing(mimetype)
    : false;

  const isFailed = data.processingStatus === "failed";

  // Document completed but AI classification failed - title is null
  const needsClassification =
    data.processingStatus === "completed" && !data.title;

  // Check if document is stuck in processing (pending for >10 minutes since creation)
  const staleProcessing = isStaleProcessing(
    data.processingStatus,
    data.createdAt,
  );

  // Show skeleton only for recently pending documents (not stale ones)
  const isLoading = data.processingStatus === "pending" && !staleProcessing;

  // Clear local state once processing completes (successfully or with graceful degradation)
  useEffect(() => {
    if (isReprocessing) {
      // Clear when:
      // - Processing failed (isFailed)
      // - Status is pending and fresh (isLoading) - API responded, job queued
      // - Status is completed AND has title (successful classification)
      // - Status is completed but no title (needsClassification) - graceful degradation
      //
      // The needsClassification case handles graceful degradation where AI classification
      // fails but the document is marked as completed. We need to clear isReprocessing
      // so the retry button shows again instead of an infinite loading skeleton.
      const isSuccessfullyCompleted =
        data.processingStatus === "completed" && !!data.title;
      if (
        isSuccessfullyCompleted ||
        isFailed ||
        isLoading ||
        needsClassification
      ) {
        setIsReprocessing(false);
      }
    }
  }, [
    isReprocessing,
    isLoading,
    isFailed,
    needsClassification,
    data.processingStatus,
    data.title,
  ]);

  // Show retry for failed, unclassified, or stale processing
  const showRetry =
    isSupported && (isFailed || needsClassification || staleProcessing);

  // Get display name - fallback to filename from path if no title
  const displayName =
    data?.title || data?.name?.split("/").at(-1) || "Document";

  const reprocessMutation = useMutation(
    trpc.documents.reprocessDocument.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.documents.get.queryKey(),
        });
      },
      onError: () => {
        // Reset local state so user can retry
        setIsReprocessing(false);
      },
    }),
  );

  const handleReprocess = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsReprocessing(true);
    reprocessMutation.mutate({ id: data.id });
  };

  // Show skeleton when processing OR waiting for props to update
  const showSkeleton = isLoading || isReprocessing;

  return (
    <div
      className={cn(
        "h-72 border relative flex text-muted-foreground p-4 flex-col gap-3 hover:bg-muted dark:hover:bg-[#141414] transition-colors duration-200 group cursor-pointer",
        small && "h-48",
      )}
      onClick={() => {
        setParams({ documentId: data.id });
      }}
    >
      {/* Status badge - top right */}
      {showRetry && !showSkeleton && (
        <div className="absolute top-4 right-4 z-10">
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#FFD02B]/10 text-[#FFD02B] dark:bg-[#FFD02B]/10 dark:text-[#FFD02B]">
            Processing incomplete
          </span>
        </div>
      )}

      {/* Actions menu - top right (hidden when badge is showing) */}
      {!(showRetry && !showSkeleton) && (
        <div
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <VaultItemActions
            id={data.id}
            filePath={data.pathTokens ?? []}
            hideDelete={small}
          />
        </div>
      )}

      <div
        className={cn(
          "w-[60px] h-[84px] flex items-center justify-center relative",
          small && "w-[45px] h-[63px]",
          mimetype?.startsWith("image/") && "bg-border",
        )}
      >
        {mimetype === "image/heic" && showSkeleton ? (
          // NOTE: We convert the heic images to jpeg in the backend, so we need to wait for the image to be processed
          // Otherwise the image will be a broken image, and the cache will not be updated
          <Skeleton className="absolute inset-0 w-full h-full" />
        ) : (
          <FilePreview
            filePath={data?.pathTokens?.join("/") ?? ""}
            mimeType={mimetype ?? ""}
            lazy
            fixedSize={
              small ? { width: 45, height: 63 } : { width: 60, height: 84 }
            }
          />
        )}
      </div>

      <div className="flex flex-col text-left flex-1">
        <h2 className="text-sm text-primary line-clamp-1 mb-2 mt-3">
          {showSkeleton ? <Skeleton className="w-[80%] h-4" /> : displayName}
        </h2>

        {showSkeleton ? (
          <Skeleton className="w-[50%] h-4" />
        ) : !showRetry ? (
          <p className="text-xs text-muted-foreground line-clamp-3">
            {data?.summary}
          </p>
        ) : null}
      </div>

      <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
        {showRetry ? (
          showSkeleton ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprocess}
              disabled={reprocessMutation.isPending}
              className="gap-2 w-full text-primary"
            >
              <Icons.Refresh className="size-3" />
              Re-analyze document
            </Button>
          )
        ) : !small ? (
          <VaultItemTags
            tags={data?.documentTagAssignments ?? []}
            isLoading={showSkeleton}
          />
        ) : null}
      </div>
    </div>
  );
});
