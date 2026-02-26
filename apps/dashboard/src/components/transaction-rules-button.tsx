"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";
import { TransactionRulesModal } from "./modals/transaction-rules-modal";

export function TransactionRulesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Icons.Tune size={16} className="mr-1.5" />
        Rules
      </Button>
      <TransactionRulesModal open={open} onOpenChange={setOpen} />
    </>
  );
}
