import { FileViewer } from "@/components/file-viewer";
import { FormatAmount } from "@/components/format-amount";
import { useInboxParams } from "@/hooks/use-inbox-params";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@/trpc/routers/_app";
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
import { Icons } from "@midday/ui/icons";
import { Separator } from "@midday/ui/separator";
import { Skeleton } from "@midday/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  item?: RouterOutputs["inbox"]["get"]["data"][number];
};

export function InboxDetails({ item }: Props) {
  const { setParams, params } = useInboxParams();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const { data: user } = useUserQuery();

  const deleteInboxMutation = useMutation(
    trpc.inbox.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.inbox.get.infiniteQueryKey(),
        });

        setParams({
          ...params,
          inboxId: null,
        });
      },
    }),
  );

  const handleOnDelete = () => {
    if (item?.id) {
      deleteInboxMutation.mutate({ id: item.id });
    }
  };

  const isProcessing = item?.status === "processing" || item?.status === "new";

  useEffect(() => {
    setShowFallback(false);
  }, [item]);

  const handleCopyLink = async () => {
    if (!item) return;
    try {
      await navigator.clipboard.writeText(`${getUrl()}/inbox?id=${item.id}`);

      toast({
        duration: 4000,
        title: "Copied link to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  // if (isEmpty) {
  //   return <div className="hidden md:block w-[1160px]" />;
  // }

  const fallback = showFallback || (!item?.website && item?.display_name);

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden flex-col border w-[595px] hidden md:flex shrink-0 -mt-[54px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!item}
                onClick={handleOnDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 text-xs">
              Delete
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!item}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpen(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a
                  href={`/api/download/file?path=${item?.file_path
                    ?.slice(1)
                    .join("/")}&filename=${item?.file_name}`}
                  download
                >
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                Copy Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />

      {item?.id ? (
        <div className="flex flex-col flex-grow min-h-0">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm relative">
              {isProcessing ? (
                <Skeleton className="h-[40px] w-[40px] rounded-full" />
              ) : (
                <Avatar>
                  {item.website && (
                    <AvatarImageNext
                      alt={item.website}
                      width={40}
                      height={40}
                      className={cn(
                        "rounded-full overflow-hidden",
                        showFallback && "hidden",
                      )}
                      src={getWebsiteLogo(item.website)}
                      quality={100}
                      onError={() => {
                        setShowFallback(true);
                      }}
                    />
                  )}

                  {fallback && (
                    <AvatarFallback>
                      {item?.display_name
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
                    <Skeleton className="h-3 w-[120px] rounded-sm mb-1" />
                  ) : (
                    item.display_name
                  )}
                </div>
                <div className="line-clamp-1 text-xs">
                  {isProcessing && !item.currency && (
                    <Skeleton className="h-3 w-[50px] rounded-sm" />
                  )}
                  {item.currency && item.amount != null && (
                    <FormatAmount
                      amount={item.amount}
                      currency={item.currency}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-1 ml-auto text-right">
              <div className="text-xs text-muted-foreground select-text">
                {isProcessing && !item.date && (
                  <Skeleton className="h-3 w-[50px] rounded-sm" />
                )}
                {item.date && formatDate(item.date, user?.date_format)}
              </div>

              <div className="flex space-x-4 items-center ml-auto mt-1">
                {item.description && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Icons.Info />
                    </TooltipTrigger>
                    <TooltipContent
                      className="px-3 py-1.5 text-xs"
                      side="left"
                      sideOffset={8}
                    >
                      {item.description}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          <Separator />

          {item?.file_path && (
            <FileViewer
              mimeType={item.content_type}
              url={`/api/proxy?filePath=vault/${item?.file_path.join("/")}`}
            />
          )}

          {/* <div className="h-12 dark:bg-[#1A1A1A] bg-[#F6F6F3] justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-full fixed bottom-14 right-[160px] z-50 w-[400px]"> */}
          {/* <SelectTransaction
              placeholder="Select transaction"
              teamId={teamId}
              inboxId={item.id}
              selectedTransaction={item?.transaction}
              onSelect={onSelectTransaction}
              key={item.id}
            /> */}
          {/* </div> */}

          {/* <EditInboxModal
            isOpen={isOpen}
            onOpenChange={setOpen}
            id={item.id}
            currencies={currencies}
            defaultValue={{
              amount: item?.amount,
              currency: item.currency,
              display_name: item?.display_name,
            }}
          /> */}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No attachment selected
        </div>
      )}
    </div>
  );
}
