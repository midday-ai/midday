"use client";

import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useInboxParams } from "@/hooks/use-inbox-params";

export function InboxOrdering() {
  const { params, setParams } = useInboxParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Sort size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={params.inboxSort === "date" && params.inboxOrder === "asc"}
          onCheckedChange={() =>
            setParams({ inboxSort: "date", inboxOrder: "asc" })
          }
        >
          Most recent
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={params.inboxSort === "date" && params.inboxOrder === "desc"}
          onCheckedChange={() =>
            setParams({ inboxSort: "date", inboxOrder: "desc" })
          }
        >
          Oldest first
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={params.inboxSort === "alphabetical"}
          onCheckedChange={() =>
            setParams({ inboxSort: "alphabetical", inboxOrder: "asc" })
          }
        >
          Alphabetically
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={
            params.inboxSort === "document_date" && params.inboxOrder === "desc"
          }
          onCheckedChange={() =>
            setParams({ inboxSort: "document_date", inboxOrder: "desc" })
          }
        >
          Document date (newest first)
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={
            params.inboxSort === "document_date" && params.inboxOrder === "asc"
          }
          onCheckedChange={() =>
            setParams({ inboxSort: "document_date", inboxOrder: "asc" })
          }
        >
          Document date (oldest first)
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
