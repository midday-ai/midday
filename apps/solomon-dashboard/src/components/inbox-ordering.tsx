"use client";

import { inboxOrderAction } from "@/actions/inbox/order";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  ascending: boolean;
};

export function InboxOrdering({ ascending }: Props) {
  const { execute: inboxOrder, optimisticData } = useOptimisticAction(
    inboxOrderAction,
    ascending,
    (state) => {
      return !state;
    }
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Sort size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuCheckboxItem
          checked={!optimisticData}
          onCheckedChange={() => inboxOrder(false)}
        >
          Most recent
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={optimisticData}
          onCheckedChange={() => inboxOrder(true)}
        >
          Oldest first
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
