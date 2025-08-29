"use client";

import { FileViewer } from "@/components/file-viewer";
import { FormatAmount } from "@/components/format-amount";
import { InboxActions } from "@/components/inbox/inbox-actions";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatDate, getInitials } from "@/utils/format";
import { getWebsiteLogo } from "@/utils/logos";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { Separator } from "@midday/ui/separator";
import { SheetHeader } from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function InboxSheetDetails() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { params } = useInboxParams();
  const { data: user } = useUserQuery();

  const isOpen = Boolean(params.inboxId && params.type === "details");

  const { data, isLoading } = useQuery({
    ...trpc.inbox.getById.queryOptions({
      id: params.inboxId!,
    }),
    enabled: isOpen,
    staleTime: 0,
    initialData: () => {
      const pages = queryClient
        .getQueriesData({ queryKey: trpc.inbox.get.infiniteQueryKey() })
        // @ts-expect-error
        .flatMap(([, data]) => data?.pages ?? [])
        .flatMap((page) => page.data ?? []);

      return pages.find((d) => d.id === params.inboxId);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
        <SheetHeader className="mb-4 flex justify-between items-center flex-row">
          <div className="min-w-0 flex-1 max-w-[70%] flex flex-row gap-2 items-end">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </SheetHeader>

        <div className="flex-1 mb-4 overflow-hidden relative flex items-center justify-center">
          <Skeleton className="h-full w-full max-w-[565px]" />
        </div>
      </div>
    );
  }

  const isProcessing =
    data.status === "processing" || data.status === "analyzing";
  const logoUrl = getWebsiteLogo(data.website);

  return (
    <div className="flex flex-col flex-grow min-h-0 relative h-full w-full">
      {/* Document info header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {logoUrl && (
              <div className="relative">
                <Avatar className="size-9 border">
                  <AvatarImageNext
                    src={logoUrl}
                    alt={data.website || ""}
                    width={36}
                    height={36}
                    quality={100}
                  />
                  <AvatarFallback className="text-[9px] font-medium">
                    {data.website ? getInitials(data.website) : ""}
                  </AvatarFallback>
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
                  <FormatAmount amount={data.amount} currency={data.currency} />
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
      </div>

      <Separator className="mb-4" />

      {/* Document preview */}
      <div className="flex-1 mb-4 overflow-hidden relative">
        {data?.filePath && (
          <div className="h-full flex items-center justify-center">
            <FileViewer
              mimeType={data.contentType}
              url={`/api/proxy?filePath=vault/${data.filePath.join("/")}`}
              maxWidth={565}
            />
          </div>
        )}

        <div className="absolute bottom-4 z-10 left-4 right-4">
          <InboxActions data={data} key={data.id} />
        </div>
      </div>

      <Separator className="mb-4" />
    </div>
  );
}
