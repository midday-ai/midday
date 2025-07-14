"use client";

import { OAuthApplicationForm } from "@/components/forms/oauth-application-form";
import { useOAuthApplicationParams } from "@/hooks/use-oauth-application-params";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader } from "@midday/ui/sheet";
import React from "react";

export function OAuthApplicationCreateSheet() {
  const { setParams, createApplication } = useOAuthApplicationParams();

  const isOpen = Boolean(createApplication);

  return (
    <Sheet open={isOpen} onOpenChange={() => setParams(null)}>
      <SheetContent stack>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <h2 className="text-xl">Create OAuth Application</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setParams(null)}
            className="p-0 m-0 size-auto hover:bg-transparent"
          >
            <Icons.Close className="size-5" />
          </Button>
        </SheetHeader>

        <ScrollArea className="h-full p-0 pb-28" hideScrollbar>
          <OAuthApplicationForm />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
