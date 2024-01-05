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
import { FilePreview } from "./file-preview";
import { InboxToolbar } from "./inbox-toolbar";

export function InboxDetails({ mail }) {
  return (
    <div className="flex h-[calc(100vh-180px)] overflow-hidden flex-col border rounded-xl min-w-[720px]">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
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
              <Button variant="ghost" size="icon" disabled={!mail}>
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
      {mail ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={mail.name} src={mail.logo_url} />
                <AvatarFallback>
                  {mail.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{mail.name}</div>
                <div className="line-clamp-1 text-xs">{mail.subject}</div>
              </div>
            </div>
            {mail.date && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(mail.date), "PPpp")}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex-1 whitespace-pre-wrap p-4 text-sm relative">
            <FilePreview
              src={mail?.attachment_url}
              type="application/pdf"
              width={680}
              height={900}
              disableFullscreen
              key={mail.id}
            />
          </div>

          <InboxToolbar item={mail} key={mail.id} />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
}
