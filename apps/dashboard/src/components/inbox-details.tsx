import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
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
import { format } from "date-fns";
import { MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";
import { SelectTransaction } from "./select-transaction";

type Props = {
  item: any[];
  onDelete: () => void;
  onSelectTransaction: () => void;
  teamId: string;
  isEmpty?: boolean;
};

export function InboxDetails({
  item,
  onDelete,
  onSelectTransaction,
  teamId,
  isEmpty,
}: Props) {
  const { toast } = useToast();

  const isProcessing = item?.status === "processing" || item?.status === "new";

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/inbox?id=${item.id}`
      );

      toast({
        duration: 4000,
        title: "Copied URL to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  if (isEmpty) {
    return <div className="w-[1160px]" />;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden flex-col border rounded-xl w-[1160px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!item}
                onClick={onDelete}
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
              <DropdownMenuItem>
                <a
                  href={`/api/download/file?path=inbox/${item?.file_name}&filename=${item?.file_name}`}
                  download
                >
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl}>
                Copy URL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />

      {item ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm relative">
              {isProcessing ? (
                <Skeleton className="h-[40px] w-[40px] rounded-full" />
              ) : (
                <Avatar>
                  {item.website && (
                    <Image
                      alt={item.website}
                      width={40}
                      height={40}
                      className="rounded-full overflow-hidden"
                      src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${item.website}&size=128`}
                    />
                  )}
                  {!item.website && item?.display_name && (
                    <AvatarFallback>
                      {item.display_name
                        .split(" ")
                        .slice(0, 2)
                        .map((chunk) => chunk[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}

              <div className="grid gap-1">
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
                  {item.currency && (
                    <FormatAmount
                      amount={item.amount}
                      currency={item.currency}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-1 ml-auto text-right">
              <div className="text-xs text-muted-foreground">
                {isProcessing && !item.due_date && (
                  <Skeleton className="h-3 w-[50px] rounded-sm" />
                )}
                {item.due_date && format(new Date(item.due_date), "PP")}
              </div>

              <div className="flex space-x-2 items-center ml-auto mt-1">
                {item.forwarded_to && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Icons.Forwarded />
                    </TooltipTrigger>
                    <TooltipContent
                      className="px-3 py-1.5 text-xs"
                      side="left"
                      sideOffset={8}
                    >
                      Forwarded to {item.forwarded_to}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          <Separator />

          <div className="relative h-full">
            {item?.file_path && (
              <FilePreview
                src={`/api/proxy?filePath=vault/${item?.file_path.join("/")}`}
                name={item.name}
                type={item.content_type}
                width={680}
                height={900}
                disableFullscreen
              />
            )}
          </div>

          <div className="h-12 dark:bg-[#1A1A1A] bg-[#F6F6F3] justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-lg fixed bottom-14 right-[160px] z-50 w-[400px]">
            <SelectTransaction
              placeholder="Select transaction"
              teamId={teamId}
              inboxId={item.id}
              selectedTransaction={item?.transaction}
              onSelect={onSelectTransaction}
              key={item.id}
            />
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No attachment selected
        </div>
      )}
    </div>
  );
}
