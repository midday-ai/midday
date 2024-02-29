"use client";

import { BackButton } from "@/components/command-menu/back-button";
import { MenuOption, useCommandStore } from "@/store/command";
import { Button } from "@midday/ui/button";

export function CommandAI() {
  const { setMenu } = useCommandStore();

  return (
    <div className="h-[500px]">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Midday AI</h2>
      </div>

      <div className="mt-24 flex items-center justify-center text-sm flex-col space-y-4">
        <p>Not enabled for this account yet.</p>
        <Button variant="outline" onClick={() => setMenu(MenuOption.Feedback)}>
          Request access
        </Button>
      </div>
    </div>
  );
}
