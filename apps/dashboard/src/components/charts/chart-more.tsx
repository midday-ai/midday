"use client";

import { ShareReport } from "@/components/share-report";
import { Button } from "@absplatform/ui/button";
import { Dialog } from "@absplatform/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@absplatform/ui/dropdown-menu";
import { Icons } from "@absplatform/ui/icons";
import { useState } from "react";

type Props = {
  defaultValue: {
    from: string;
    to: string;
    type: "profit" | "revenue";
  };
  type: "profit" | "revenue";
};

export function ChartMore({ defaultValue, type }: Props) {
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

      <ShareReport defaultValue={defaultValue} type={type} setOpen={setOpen} />
    </Dialog>
  );
}
