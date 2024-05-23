"use client";

import { Chat } from "@/components/chat";
import { BackButton } from "@/components/command-menu/back-button";

export function CommandAI() {
  return (
    <div className="h-[500px]">
      <div className="p-5 flex items-center space-x-3">
        <BackButton />
        <h2>Midday AI</h2>
      </div>

      <Chat />
    </div>
  );
}
