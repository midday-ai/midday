import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { DialogTrigger } from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Separator } from "@midday/ui/separator";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { formatDate, getInitials } from "@midday/utils/format";
import { getTaxTypeLabel } from "@midday/utils/tax";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCopyToClipboard } from "usehooks-ts";
import { FileViewer } from "@/components/file-viewer";
import { FormatAmount } from "@/components/format-amount";
import { useFileUrl } from "@/hooks/use-file-url";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { getWebsiteLogo } from "@/utils/logos";
import { EditInboxModal } from "../modals/edit-inbox-modal";
import { DeleteInboxDialog } from "./delete-inbox-dialog";
import { InboxActions } from "./inbox-actions";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { InboxSourceIcon } from "./inbox-source-icon";

export function InboxDetails() {
  const { setParams, params } = useInboxParams();

  const { params: filterParams } = useInboxFilterParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showFallback, setShowFallback] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: user } = useUserQuery();
  const [, copy] = useCopyToClipboard();

  const id = params.inboxId;

  const { data, isLoading, isError } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
        retry: false,
      },
    ),
  );

  const updateInboxMutation = useMutation(
    trpc.inbox.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.transactions.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const retryMatchingMutation = useMutation(
    trpc.inbox.retryMatching.mutationOptions({
      onSuccess: () => {
        // Refresh queries after retry matching completes
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.getById.queryKey({ id: data?.id }),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const blockSenderMutation = useMutation(
    trpc.inbox.blocklist.create.mutationOptions({
      onMutate: async (variables) => {
        // Check if the currently selected inbox item matches what was blocked
        if (data) {
          const shouldDeselect =
            (variables.type === "email" &&
              data.senderEmail &&
              data.senderEmail.toLowerCase() ===
                variables.value.toLowerCase()) ||
            (variables.type === "domain" &&
              data.website &&
              data.website.toLowerCase() === variables.value.toLowerCase());

          if (shouldDeselect) {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({
              queryKey: trpc.inbox.get.infiniteQueryKey(),
            });

            // Get current data before invalidation
            const previousData = queryClient.getQueriesData({
              queryKey: trpc.inbox.get.infiniteQueryKey(),
            });

            // Flatten the data from all pages to find the current index and the next item
            const allInboxes = previousData
              // @ts-expect-error
              .flatMap(([, data]) => data?.pages ?? [])
              .flatMap((page) => page.data ?? []);

            const currentIndex = allInboxes.findIndex(
              (item) => item.id === data.id,
            );
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

            // Select the next item
            setParams({
              ...params,
              inboxId: nextInboxId,
            });

            return { previousData };
          }
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.blocklist.get.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
  );

  const handleBlockEmail = () => {
    if (data?.senderEmail) {
      blockSenderMutation.mutate({
        type: "email",
        value: data.senderEmail,
      });
    }
  };

  const handleBlockDomain = () => {
    if (data?.website) {
      blockSenderMutation.mutate({
        type: "domain",
        value: data.website,
      });
    }
  };

  const handleOnDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleRetryMatching = () => {
    if (data?.id) {
      updateInboxMutation.mutate({
        id: data.id,
        status: "analyzing",
      });

      retryMatchingMutation.mutate({ id: data.id });
    }
  };

  useHotkeys("meta+backspace", (event) => {
    event.preventDefault();
    handleOnDelete();
  });

  const isProcessing = data?.status === "processing" || data?.status === "new";
  const isOtherDocument = data?.status === "other" || data?.type === "other";

  useEffect(() => {
    setShowFallback(false);
    setImageLoading(true);
  }, [data]);

  const handleCopyLink = () => {
    if (!data) return;

    copy(`${getUrl()}/inbox?inboxId=${data.id}`);

    toast({
      duration: 4000,
      title: "Copied link to clipboard.",
      variant: "success",
    });
  };

  const { url: downloadUrl } = useFileUrl(
    data?.filePath && data?.fileName
      ? {
          type: "download",
          filePath: data.filePath.join("/"),
          filename: data.fileName,
        }
      : null,
  );

  const handleDownload = () => {
    if (downloadUrl && data?.fileName) {
      downloadFile(downloadUrl, data.fileName);
    }
  };

  const fallback = showFallback || (!data?.website && data?.displayName);

  if (isLoading) {
    return <InboxDetailsSkeleton />;
  }

  if (isError || (id && !data)) {
    return (
      <div className="h-[calc(100vh-125px)] border w-[614px] hidden md:flex shrink-0 -mt-[54px] items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-3 text-center max-w-[250px]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Item not found</p>
            <p className="text-xs text-[#878787]">
              This item may have been deleted or you don't have access to it.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setParams({ ...params, inboxId: null })}
          >
            Clear selection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-125px)] overflow-hidden flex-col border w-[614px] hidden md:flex shrink-0 -mt-[54px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={!data}
            onClick={handleOnDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center">
          {data && <InboxSourceIcon data={data} />}
          <EditInboxModal>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!data}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    updateInboxMutation.mutate({
                      id: data?.id!,
                      status: data?.status === "done" ? "pending" : "done",
                    })
                  }
                >
                  {data?.status === "done" ? (
                    <>
                      <Icons.SubdirectoryArrowLeft className="mr-2 size-4" />
                      <span className="text-xs">Mark as unhandled</span>
                    </>
                  ) : (
                    <>
                      <Icons.Check className="mr-2 size-4" />
                      <span className="text-xs">Mark as done</span>
                    </>
                  )}
                </DropdownMenuItem>

                {/* Hide retry matching for "other" (non-financial) documents */}
                {!isOtherDocument && (
                  <DropdownMenuItem
                    onClick={handleRetryMatching}
                    disabled={retryMatchingMutation.isPending}
                  >
                    {retryMatchingMutation.isPending ? (
                      <>
                        <Icons.Refresh className="mr-2 size-4 animate-spin" />
                        <span className="text-xs">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Refresh className="mr-2 size-4" />
                        <span className="text-xs">Retry Matching</span>
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem>
                  <DialogTrigger className="w-full text-left flex items-center">
                    <Icons.Edit className="mr-2 size-4" />
                    <span className="text-xs">Edit</span>
                  </DialogTrigger>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleDownload}
                  disabled={!downloadUrl}
                >
                  <Icons.ProjectStatus className="mr-2 size-4" />
                  <span className="text-xs">Download</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleCopyLink}>
                  <Icons.Copy className="mr-2 size-4" />
                  <span className="text-xs">Copy Link</span>
                </DropdownMenuItem>

                {(data?.website || data?.senderEmail) && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Icons.Block className="mr-2 size-4" />
                      <span className="text-xs">Blocklist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {data?.senderEmail && (
                        <DropdownMenuItem
                          onClick={handleBlockEmail}
                          disabled={blockSenderMutation.isPending}
                        >
                          {blockSenderMutation.isPending ? (
                            <>
                              <Icons.Refresh className="mr-2 size-4 animate-spin" />
                              <span className="text-xs">Blocking...</span>
                            </>
                          ) : (
                            <span className="text-xs">Block email</span>
                          )}
                        </DropdownMenuItem>
                      )}
                      {data?.website && (
                        <DropdownMenuItem
                          onClick={handleBlockDomain}
                          disabled={blockSenderMutation.isPending}
                        >
                          {blockSenderMutation.isPending ? (
                            <>
                              <Icons.Refresh className="mr-2 size-4 animate-spin" />
                              <span className="text-xs">Blocking...</span>
                            </>
                          ) : (
                            <span className="text-xs">Block domain</span>
                          )}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}

                {/* Destructive Actions - At Bottom */}
                <DropdownMenuItem
                  onClick={handleOnDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  <span className="text-xs">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </EditInboxModal>
        </div>
      </div>
      <Separator />

      {data?.id ? (
        <div className="flex flex-col flex-grow min-h-0 relative">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm relative">
              {isProcessing ? (
                <Skeleton className="h-[40px] w-[40px] rounded-full" />
              ) : (
                <div className="relative">
                  {data.website && imageLoading && (
                    <Skeleton className="h-[40px] w-[40px] rounded-full absolute z-20" />
                  )}
                  <Avatar>
                    {data.website && (
                      <AvatarImageNext
                        alt={data.website}
                        width={40}
                        height={40}
                        className={cn(
                          "rounded-full overflow-hidden",
                          showFallback && "hidden",
                        )}
                        src={getWebsiteLogo(data.website)}
                        quality={100}
                        onLoad={() => {
                          setImageLoading(false);
                        }}
                        onError={() => {
                          setImageLoading(false);
                          setShowFallback(true);
                        }}
                      />
                    )}

                    {fallback && (
                      <AvatarFallback>
                        {getInitials(data?.displayName ?? "")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )}

              <div className="grid gap-1 select-text">
                <div className="font-semibold">
                  {isProcessing ? (
                    <Skeleton className="h-3 w-[120px] mb-1" />
                  ) : (
                    data.displayName
                  )}
                </div>
                <div className="line-clamp-1 text-xs">
                  {isProcessing && !data.currency && (
                    <Skeleton className="h-3 w-[50px]" />
                  )}
                  {data.currency &&
                    data.amount != null &&
                    (!isProcessing &&
                    data?.taxAmount &&
                    data.taxAmount > 0 &&
                    data.currency ? (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              <FormatAmount
                                amount={data.amount}
                                currency={data.currency}
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs px-2 py-1">
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {data.taxType &&
                                  `${getTaxTypeLabel(data.taxType)} `}
                                <FormatAmount
                                  amount={data.taxAmount}
                                  currency={data.currency}
                                  maximumFractionDigits={2}
                                />
                                {data.taxRate &&
                                  data.taxRate > 0 &&
                                  ` (${data.taxRate}%)`}
                              </span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <FormatAmount
                        amount={data.amount}
                        currency={data.currency}
                      />
                    ))}
                </div>
              </div>
            </div>
            <div className="grid gap-1 ml-auto text-right">
              <div className="text-xs text-muted-foreground select-text">
                {isProcessing && !data.date && (
                  <Skeleton className="h-3 w-[50px]" />
                )}
                {data.date && formatDate(data.date, user?.dateFormat)}
              </div>
            </div>
          </div>

          <Separator />

          <div className="absolute bottom-4 left-4 right-4 z-50">
            <InboxActions data={data} key={data.id} />
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
            {data?.filePath && (
              <div className="min-h-0 flex-shrink-0 h-full">
                {/* Show skeleton while HEIC is being converted (browser can't render HEIC natively) */}
                {data.contentType === "image/heic" && isProcessing ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <FileViewer
                    // Use jpeg mimetype if heic (file was converted, contentType not yet updated)
                    mimeType={
                      data.contentType === "image/heic"
                        ? "image/jpeg"
                        : data.contentType
                    }
                    url={`${process.env.NEXT_PUBLIC_API_URL}/files/proxy?filePath=vault/${data?.filePath.join("/")}`}
                    // Include contentType in key to remount after HEIC conversion (busts browser cache)
                    key={`${params.order}-${JSON.stringify(filterParams)}-${data.contentType}-primary`}
                  />
                )}
              </div>
            )}

            {data?.relatedItems &&
              data.relatedItems.length > 0 &&
              data.relatedItems.map(
                (relatedItem) =>
                  relatedItem.filePath && (
                    <div
                      key={relatedItem.id}
                      className="min-h-0 flex-shrink-0 h-full"
                    >
                      {/* Show skeleton while HEIC is being converted */}
                      {relatedItem.contentType === "image/heic" &&
                      isProcessing ? (
                        <Skeleton className="h-full w-full" />
                      ) : (
                        <FileViewer
                          // Use jpeg mimetype if heic (file was converted, contentType not yet updated)
                          mimeType={
                            relatedItem.contentType === "image/heic"
                              ? "image/jpeg"
                              : relatedItem.contentType
                          }
                          url={`${process.env.NEXT_PUBLIC_API_URL}/files/proxy?filePath=vault/${relatedItem.filePath.join("/")}`}
                          // Include contentType in key to remount after HEIC conversion
                          key={`${relatedItem.id}-${params.order}-${JSON.stringify(filterParams)}-${relatedItem.contentType}`}
                        />
                      )}
                    </div>
                  ),
              )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No attachment selected
        </div>
      )}

      <DeleteInboxDialog
        id={data?.id!}
        filePath={data?.filePath ?? null}
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}
