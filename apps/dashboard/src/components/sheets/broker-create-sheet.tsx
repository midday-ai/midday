"use client";

import { BrokerForm } from "@/components/forms/broker-form";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useQueryState } from "nuqs";

export function BrokerCreateSheet() {
  const [createBroker, setCreateBroker] = useQueryState("createBroker");
  const isOpen = createBroker === "true";

  return (
    <Sheet open={isOpen} onOpenChange={() => setCreateBroker(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Add Broker</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCreateBroker(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <BrokerForm onSuccess={() => setCreateBroker(null)} />
      </SheetContent>
    </Sheet>
  );
}
