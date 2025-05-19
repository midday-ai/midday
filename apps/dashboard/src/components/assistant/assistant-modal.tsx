"use client";

import { useAssistantStore } from "@/store/assistant";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { Assistant } from ".";

export function AssistantModal() {
  const { isOpen, setOpen } = useAssistantStore();

  const toggleOpen = () => setOpen();

  return (
    <Dialog open={isOpen} onOpenChange={toggleOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-full w-full h-full md:max-w-[740px] md:h-[480px] m-0 select-text"
        hideClose
      >
        <Assistant />
      </DialogContent>
    </Dialog>
  );
}
