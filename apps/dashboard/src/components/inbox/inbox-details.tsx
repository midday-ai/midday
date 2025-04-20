import { FileViewer } from "@/components/file-viewer";
import { FormatAmount } from "@/components/format-amount";
import { useInboxFilterParams } from "@/hooks/use-inbox-filter-params";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { getUrl } from "@/utils/environment";
import { formatDate } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@midday/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuTrigger } from "@midday/ui/dropdown-menu";
import { Separator } from "@midday/ui/separator";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { InboxDetailsSkeleton } from "./inbox-details-skeleton";

export function InboxDetails() {
  const { setParams, params } = useInboxParams();
  const { params: filterParams } = useInboxFilterParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showFallback, setShowFallback] = useState(false);
  const { data: user } = useUserQuery();

  const id = params.inboxId;

  const { data, isLoading } = useQuery(
    trpc.inbox.getById.queryOptions(
      { id: id! },
      {
        enabled: !!id,
        initialData: () => {
          const pages = queryClient
            .getQueriesData({ queryKey: trpc.inbox.get.infiniteQueryKey() })
            .flatMap(([, data]) => data?.pages ?? [])
            .flatMap((page) => page.data ?? []);

          return pages.find((d) => d.id === id);
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
          inboxId: null,
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
      },
    }),
  );

  const handleOnDelete = () => {
    if (data?.id) {
      deleteInboxMutation.mutate({ id: data.id });
    }
  };

  const isProcessing = data?.status === "processing" || data?.status === "new";

  useEffect(() => {
    setShowFallback(false);
  }, [data]);

  const handleCopyLink = async () => {
    if (!data) return;

    try {
      await navigator.clipboard.writeText(`${getUrl()}/inbox?id=${data.id}`);

      toast({
        duration: 4000,
        title: "Copied link to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  const fallback = showFallback || (!data?.website && data?.display_name);

  if (isLoading) {
    return <InboxDetailsSkeleton />;
  }

  return (
    <div className="h-[calc(100vh-125px)] overflow-hidden flex-col border w-[615px] hidden md:flex shrink-0 -mt-[54px]">
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

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!data}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <a
                  href={`/api/download/file?path=${data?.file_path
                    ?.slice(1)
                    .join("/")}&filename=${data?.file_name}`}
                  download
                >
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateInboxMutation.mutate({
                    id: data?.id,
                    status: data?.status === "done" ? "pending" : "done",
                  })
                }
              >
                {data?.status === "done" ? "Mark as unhandled" : "Mark as done"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />

      {data?.id ? (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm relative">
              {isProcessing ? (
                <Skeleton className="h-[40px] w-[40px] rounded-full" />
              ) : (
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
                      {data?.display_name
                        ?.split(" ")
                        .slice(0, 2)
                        .map((chunk) => chunk[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}

              <div className="grid gap-1 select-text">
                <div className="font-semibold">
                  {isProcessing ? (
                    <Skeleton className="h-3 w-[120px] mb-1" />
                  ) : (
                    data.display_name
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
                {data.date && formatDate(data.date, user?.date_format)}
              </div>
            </div>
          </div>
          <Separator />

          {data?.file_path && (
            <FileViewer
              mimeType={data.content_type}
              url={`/api/proxy?filePath=vault/${data?.file_path.join("/")}`}
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
