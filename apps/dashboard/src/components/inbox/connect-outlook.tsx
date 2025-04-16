"use client";

import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";

export function ConnectOutlook() {
  return (
    <Button
      className="px-6 py-4 w-full font-medium flex space-x-2 h-[40px]"
      variant="outline"
    >
      <Icons.Outlook />
      <span>Connect your Outlook</span>
    </Button>
  );
}
