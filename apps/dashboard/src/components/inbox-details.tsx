import { useUserContext } from "@/store/user/hook";
import { formatDate } from "@/utils/format";
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
import { format } from "date-fns";
import { MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";
import { EditInboxModal } from "./modals/edit-inbox-modal";
import { SelectTransaction } from "./select-transaction";

type InboxItem = {
  id: string;
  status?: string;
  file_path?: string[];
  file_name?: string;
  website?: string;
  display_name?: string;
  amount?: number;
  currency?: string;
  date?: string;
  forwarded_to?: string;
  content_type?: string;
  description?: string;
  transaction?: any;
  locale?: string;
};

type Props = {
  item: InboxItem;
  onDelete: () => void;
  onSelectTransaction: () => void;
  teamId: string;
  isEmpty?: boolean;
  currencies: string[];
};

export function InboxDetails({
  item,
  onDelete,
  onSelectTransaction,
  teamId,
  isEmpty,
  currencies,
}: Props) {
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const { date_format: dateFormat } = useUserContext((state) => state.data);

  const isProcessing = item?.status === "processing" || item?.status === "new";

  useEffect(() => {
    setShowFallback(false);
  }, [item]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/inbox?id=${item.id}`,
      );

      toast({
        duration: 4000,
        title: "Copied link to clipboard.",
        variant: "success",
      });
    } catch {}
  };

  if (isEmpty) {
    return <div className="hidden md:block w-[1160px]" />;
  }

  const fallback = showFallback || (!item?.website && item?.display_name);

  return (
    <div className="h-[calc(100vh-120px)] overflow-hidden flex-col border w-[1160px] hidden md:flex">
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
        <div className="flex flex-1 flex-col">
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
                      src={`https://img.logo.dev/${item.website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`}
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
              <div className="text-xs text-muted-foreground select-text">
                {isProcessing && !item.date && (
                  <Skeleton className="h-3 w-[50px] rounded-sm" />
                )}
                {item.date && formatDate(item.date, dateFormat)}
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
                disableFullscreen
                isFullscreen
                width={680}
                height={780}
              />
            )}
          </div>

          <div className="h-12 dark:bg-[#1A1A1A] bg-[#F6F6F3] justify-between items-center flex border dark:border-[#2C2C2C] border-[#DCDAD2] rounded-full fixed bottom-14 right-[160px] z-50 w-[400px]">
            <SelectTransaction
              placeholder="Select transaction"
              teamId={teamId}
              inboxId={item.id}
              selectedTransaction={item?.transaction}
              onSelect={onSelectTransaction}
              key={item.id}
            />
          </div>

          <EditInboxModal
            isOpen={isOpen}
            onOpenChange={setOpen}
            id={item.id}
            currencies={currencies}
            defaultValue={{
              amount: item?.amount,
              currency: item.currency,
              display_name: item?.display_name,
            }}
          />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No attachment selected
        </div>
      )}
    </div>
  );
}
