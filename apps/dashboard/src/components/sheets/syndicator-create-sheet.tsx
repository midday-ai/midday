"use client";

import { SyndicatorForm } from "@/components/forms/syndicator-form";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import { useQueryState } from "nuqs";

export function SyndicatorCreateSheet() {
  const [createSyndicator, setCreateSyndicator] =
    useQueryState("createSyndicator");
  const isOpen = createSyndicator === "true";

  return (
    <Sheet open={isOpen} onOpenChange={() => setCreateSyndicator(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Add Syndicator</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCreateSyndicator(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <SyndicatorForm onSuccess={() => setCreateSyndicator(null)} />
      </SheetContent>
    </Sheet>
  );
}
