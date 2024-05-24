"use client";

import { Chat } from "@/components/chat";
import { BackButton } from "@/components/command-menu/back-button";
import { useCommandStore } from "@/store/command";
import { Icons } from "@midday/ui/icons";
import { useRouter } from "next/navigation";
import { Experimental } from "../experimental";

export function CommandAI() {
  const router = useRouter();
  const { setOpen } = useCommandStore();

  const navigateToSettings = () => {
    setOpen();
    router.push("/account/assistant");
  };

  return (
    <div className="h-[500px]">
      <div className="p-5 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <BackButton />
          <h2>Assistant</h2>
        </div>

        <div className="flex space-x-2 items-center">
          <Experimental className="border-border text-[#878787]" />

          <button
            type="button"
            onClick={navigateToSettings}
            className="rounded-full size-6 border border-border flex items-center justify-center"
          >
            <Icons.Settings />
          </button>
        </div>
      </div>

      <Chat />
    </div>
  );
}
