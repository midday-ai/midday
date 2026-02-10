"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDocumentParams } from "@/hooks/use-document-params";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTRPC } from "@/trpc/client";
import { LocalStorageKeys } from "@/utils/constants";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";

type Suggestion = NonNullable<
  RouterOutputs["transactions"]["getById"]
>["suggestion"];

type SuggestedMatchProps = {
  suggestion?: Suggestion;
  transactionId: string;
  className?: string;
  isLoading?: boolean;
};

export function SuggestedMatch({
  suggestion,
  transactionId,
  className,
  isLoading,
}: SuggestedMatchProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setParams } = useDocumentParams();
  const { toast } = useToast();
  const [hasSeenLearningToast, setHasSeenLearningToast] = useLocalStorage(
    LocalStorageKeys.MatchLearningToastSeen,
    false,
  );

  const confirmMutation = useMutation(
    trpc.inbox.confirmMatch.mutationOptions({
      onSuccess: () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        showLearningToast();
      },
    }),
  );

  const declineMutation = useMutation(
    trpc.inbox.declineMatch.mutationOptions({
      onSuccess: () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.getById.queryKey({ id: transactionId }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });

        showLearningToast();
      },
    }),
  );

  const showLearningToast = () => {
    if (!hasSeenLearningToast) {
      toast({
        title: "Midday AI",
        description: "We learn from your choices to improve matches over time.",
        variant: "ai",
        duration: 5000,
      });
      setHasSeenLearningToast(true);
    }
  };

  const handleConfirm = async () => {
    if (!suggestion?.suggestionId || !suggestion?.inboxId) return;

    confirmMutation.mutate({
      suggestionId: suggestion.suggestionId,
      inboxId: suggestion.inboxId,
      transactionId: transactionId,
    });
  };

  const handleDecline = async () => {
    if (!suggestion?.suggestionId || !suggestion?.inboxId) return;

    declineMutation.mutate({
      suggestionId: suggestion.suggestionId,
      inboxId: suggestion.inboxId,
    });
  };

  const handleExpandDocument = () => {
    if (!filePath) return;
    setParams({ filePath });
  };

  // Determine mime type from file path
  const getMimeType = (filePath: string[] | null): string => {
    if (!filePath || filePath.length === 0) return "application/octet-stream";

    const pathString = filePath.join("/");
    const extension = pathString.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      case "webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  };

  const documentName = suggestion?.documentName || "Document";
  const mimeType = getMimeType(suggestion?.documentPath || null);
  const filePath = suggestion?.documentPath
    ? suggestion.documentPath.join("/")
    : null;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center space-x-2 text-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>

        <div className="border border-border overflow-hidden">
          {/* Document Preview Skeleton */}
          <div className="relative bg-[#F6F6F3] dark:bg-[#1A1A1A] p-4 h-[300px] flex items-center justify-center">
            <Skeleton className="w-full h-full max-w-[190px]" />
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>

            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2 text-sm">
        <span>Suggested match</span>
        <span className="text-xs text-[#878787]">
          ({Math.round((suggestion?.confidenceScore || 0) * 100)}% confidence)
        </span>
      </div>

      <div className="border border-border overflow-hidden">
        {/* Document Preview */}
        <div className="relative bg-[#F6F6F3] dark:bg-[#1A1A1A] p-4 h-[300px] flex items-center justify-center">
          {filePath && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandDocument}
              className="absolute top-2 right-2 z-10 h-8 w-8 p-0 "
            >
              <Icons.ExpandContent className="h-4 w-4 text-[#878787]" />
            </Button>
          )}
          {filePath ? (
            <div className="relative w-full h-full max-w-[190px] mx-auto">
              <FilePreview
                mimeType={mimeType}
                filePath={filePath}
                lazy
                fixedSize={{ width: 190, height: 270 }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Icons.Description className="h-12 w-12 text-[#878787]" />
              <span className="text-sm text-[#878787]">
                No preview available
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">{documentName}</h4>
              {suggestion?.documentAmount && suggestion?.documentCurrency && (
                <p className="text-[#606060] text-xs mt-1">
                  <FormatAmount
                    amount={suggestion.documentAmount}
                    currency={suggestion.documentCurrency}
                  />
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <SubmitButton
                variant="outline"
                size="sm"
                onClick={handleDecline}
                className="h-8 px-3"
                isSubmitting={declineMutation.isPending}
              >
                <div className="flex items-center gap-1">
                  <Icons.Close className="size-3.5" />
                  <span>Decline</span>
                </div>
              </SubmitButton>
              <SubmitButton
                size="sm"
                onClick={handleConfirm}
                isSubmitting={confirmMutation.isPending}
                className="h-8 px-3"
              >
                <div className="flex items-center gap-1">
                  <Icons.Check className="size-3.5" />
                  <span>Confirm</span>
                </div>
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
