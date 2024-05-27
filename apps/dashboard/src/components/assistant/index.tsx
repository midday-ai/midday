"use client";

import { Chat } from "@/components/chat";
import { useAssistantStore } from "@/store/assistant";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Header } from "./header";
import { SidebarList } from "./sidebar-list";

export function Assistant() {
  const { isOpen, setOpen } = useAssistantStore();
  const [isExpanded, setExpanded] = useState(false);
  const toggleOpen = () => setExpanded((prev) => !prev);

  useHotkeys("meta+k", () => setOpen());

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-[740px] h-[480px]"
        hideClose
      >
        <SidebarList
          isExpanded={isExpanded}
          setExpanded={setExpanded}
          setOpen={setOpen}
        />
        <Header toggleSidebar={toggleOpen} isExpanded={isExpanded} />
        <Chat />
      </DialogContent>
    </Dialog>
  );
}
