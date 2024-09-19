"use client";

import { inboxOrderAction } from "@/actions/inbox/order";
import { Button } from "@absplatform/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@absplatform/ui/dropdown-menu";
import { Icons } from "@absplatform/ui/icons";
import { useOptimisticAction } from "next-safe-action/hooks";

type Props = {
  ascending: boolean;
};

export function InboxOrdering({ ascending }: Props) {
  const { execute: inboxOrder, optimisticState } = useOptimisticAction(
    inboxOrderAction,
    {
      currentState: ascending,
      updateFn: (_, state) => !state,
    },
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
          checked={!optimisticState}
          onCheckedChange={() => inboxOrder(false)}
        >
          Most recent
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={optimisticState}
          onCheckedChange={() => inboxOrder(true)}
        >
          Oldest first
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
