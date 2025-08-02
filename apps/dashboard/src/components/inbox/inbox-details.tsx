import { FileViewer } from "@/components/file-viewer";
import { FormatAmount } from "@/components/format-amount";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { downloadFile } from "@/lib/download";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatDate } from "@/utils/format";
import { getInitials } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { DialogTrigger } from "@midday/ui/dialog";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@midday/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuTrigger } from "@midday/ui/dropdown-menu";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCopyToClipboard } from "usehooks-ts";
import { EditInboxModal } from "../modals/edit-inbox-modal";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";
import { MatchTransaction } from "./match-transaction";

export function InboxDetails() {
  const { setParams, params } = useInboxParams();
  const { params: filterParams } = useInboxFilterParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showFallback, setShowFallback] = useState(false);
  const { data: user } = useUserQuery();
  const [, copy] = useCopyToClipboard();

  const id = params.inboxId;

  const { data, isLoading } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
        initialData: () => {
          const pages = queryClient
            .getQueriesData({ queryKey: trpc.inbox.get.infiniteQueryKey() })
            // @ts-expect-error
            .flatMap(([, data]) => data?.pages ?? [])
            .flatMap((page) => page.data ?? []);

          return pages.find(
            (d) => d.id === id,
          ) as RouterOutputs["inbox"]["getById"];
        },
      },
    ),
  );

  const deleteInboxMutation = useMutation(
    trpc.inbox.delete.mutationOptions({
      onMutate: async ({ id }) => {
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

        return { previousData };
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
      onSettled: () => {
        // Refetch after error or success
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });
      },
    }),
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

  const handleOnDelete = () => {
    if (data?.id) {
      deleteInboxMutation.mutate({ id: data.id });
    }
  };

  useHotkeys("meta+backspace", (event) => {
    event.preventDefault();
    handleOnDelete();
  });

  const isProcessing = data?.status === "processing" || data?.status === "new";

  useEffect(() => {
    setShowFallback(false);
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

  const fallback = showFallback || (!data?.website && data?.displayName);

  if (isLoading) {
    return <InboxDetailsSkeleton />;
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
          {data?.inboxAccount?.provider === "gmail" && (
            <div className="border-r border-border pr-4">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Icons.Gmail className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs px-3 py-1.5">
                    {data.inboxAccount.email}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          <EditInboxModal>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!data}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <DialogTrigger className="w-full text-left">
                    Edit
                  </DialogTrigger>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    if (data?.filePath && data?.fileName) {
                      downloadFile(
                        `/api/download/file?path=${data.filePath.join("/")}&filename=${data.fileName}`,
                        data.fileName,
                      );
                    }
                  }}
                >
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateInboxMutation.mutate({
                      id: data?.id!,
                      status: data?.status === "done" ? "pending" : "done",
                    })
                  }
                >
                  {data?.status === "done"
                    ? "Mark as unhandled"
                    : "Mark as done"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  Copy Link
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
                        onError={() => {
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
                  {data.currency && data.amount != null && (
                    <FormatAmount
                      amount={data.amount}
                      currency={data.currency}
                    />
                  )}
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
            <MatchTransaction />
          </div>

          {data?.filePath && (
            <FileViewer
              mimeType={data.contentType}
              url={`/api/proxy?filePath=vault/${data?.filePath.join("/")}`}
              // If the order changes, the file viewer will remount otherwise the PDF worker will crash
              key={`${params.order}-${JSON.stringify(filterParams)}`}
            />
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No attachment selected
        </div>
      )}
    </div>
  );
}
