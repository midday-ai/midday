"use client";

import { updateInboxAction } from "@/actions/inbox/update";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@midday/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuTrigger } from "@midday/ui/dropdown-menu";
import { Separator } from "@midday/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@midday/ui/tooltip";
import format from "date-fns/format";
import { Archive, MoreVertical, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hook";
import { useRouter } from "next/navigation";
import { FilePreview } from "./file-preview";
import { InboxToolbar } from "./inbox-toolbar";

export function InboxDetails({ item }) {
  const router = useRouter();

  const updateInbox = useAction(updateInboxAction, {
    onSuccess: () => router.push("/inbox"),
  });

  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden flex-col border rounded-xl min-w-[720px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!item}
                onClick={() =>
                  updateInbox.execute({ id: item.id, status: "archived" })
                }
              >
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!item}
                onClick={() =>
                  updateInbox.execute({ id: item.id, status: "deleted" })
                }
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
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
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Copy URL</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />
      {item ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={item.name} src={item.logo_url} />
                <AvatarFallback>
                  {item.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{item.name}</div>
                <div className="line-clamp-1 text-xs">{item.subject}</div>
              </div>
            </div>
            {item.date && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(item.date), "PPpp")}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm relative">
            <FilePreview
              src={item?.attachment_url}
              type="application/pdf"
              width={680}
              height={900}
              disableFullscreen
              key={item.id}
            />
          </div>

          <InboxToolbar item={item} key={item.id} />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
}
