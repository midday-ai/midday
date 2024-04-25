"use client";

import { Avatar, AvatarFallback } from "@midday/ui/avatar";
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
import { FileType } from "@midday/utils";
import { format } from "date-fns";
import { MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FilePreview } from "./file-preview";
import { FormatAmount } from "./format-amount";
import { InboxToolbar } from "./inbox-toolbar";

// function extractRootDomainFromEmail(email) {
//   const url = email?.split("@")?.at(1);

//   const domain = url.match(
//     /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/im
//   )[1];
//   const parts = domain.split(".").reverse();
//   const rootDomain = `${parts[1]}.${parts[0]}`;
//   return rootDomain;
// }

export function InboxDetailsSkeleton() {
  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden flex-col border rounded-xl w-[1160px]">
      <div className="flex items-center py-2 h-[52px]">
        <div className="flex items-center gap-2" />
      </div>

      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <Skeleton className="h-[40px] w-[40px] rounded-full" />
            <div className="grid gap-1 space-y-1">
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-2 w-[120px]" />
            </div>
          </div>
          <div className="grid gap-1 ml-auto text-right">
            <Skeleton className="h-2 w-[100px] ml-auto" />
            <Skeleton className="h-2 w-[50px] ml-auto" />
          </div>
        </div>

        <Separator />
      </div>
    </div>
  );
}

export function InboxDetails({ item, updateInbox, teamId }) {
  const { toast } = useToast();
  const [hasError, setError] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isLoaded, setLoaded] = useState(false);

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

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden flex-col border rounded-xl w-[1160px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!item}
                onClick={() => updateInbox({ id: item.id, trash: true })}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="px-3 py-1.5 text-xs">
              Move to trash
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
              {isLoading && (
                <Skeleton className="w-[40px] h-[40px] rounded-full" />
              )}

              {!isLoading && hasError && (
                <Avatar>
                  <AvatarFallback>
                    {item?.name
                      .split(" ")
                      .slice(0, 2)
                      .map((chunk) => chunk[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )}

              {!hasError && (
                <Image
                  width={40}
                  height={40}
                  onError={() => {
                    setLoading(false);
                    setError(true);
                  }}
                  className={cn(
                    "rounded-full overflow-hidden",
                    // NOTE: Can't be hidden because onLoad is not fired
                    isLoading && "absolute -left-[100px]"
                  )}
                  src={`https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${item.website}&size=128`}
                  alt={item.name}
                  placeholder={undefined}
                  onLoad={() => setLoading(false)}
                />
              )}

              <div className="grid gap-1">
                <div className="font-semibold">{item.name}</div>
                <div className="line-clamp-1 text-xs">{item.file_name}</div>
              </div>
            </div>
            <div className="grid gap-1 ml-auto text-right">
              <div className="text-xs text-muted-foreground">
                {format(new Date(item.created_at), "PPpp")}
              </div>

              <div className="flex space-x-2 items-center ml-auto mt-1">
                {item.currency && (
                  <div className="line-clamp-1 text-xs">
                    <FormatAmount
                      amount={item.amount}
                      currency={item.currency}
                    />
                  </div>
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
                width={680}
                height={900}
                disableFullscreen
                onLoaded={() => setLoaded(true)}
              />
            )}
          </div>

          <InboxToolbar
            selectedItem={item}
            teamId={teamId}
            onSelect={updateInbox}
            isLoaded={isLoaded}
          />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
}
