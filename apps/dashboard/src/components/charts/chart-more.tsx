"use client";

import { ShareReport } from "@/components/share-report";
import { Button } from "@midday/ui/button";
import { Dialog } from "@midday/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";

type Props = {
  defaultValue: {
    from: string;
    to: string;
    type: "profit" | "revenue";
    currency: string;
  };
};

export function ChartMore({ defaultValue }: Props) {
  const [isOpen, setOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Icons.MoreHoriz size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={10} align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Share report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareReport
        defaultValue={defaultValue}
        type={defaultValue.type}
        currency={defaultValue.currency}
        setOpen={setOpen}
      />
    </Dialog>
  );
}
