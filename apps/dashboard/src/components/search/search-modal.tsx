"use client";

import { useSearchStore } from "@/store/search";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "./search";
import { SearchFooter } from "./search-footer";

export function SearchModal() {
  const { isOpen, setOpen } = useSearchStore();

  useHotkeys("meta+k", () => setOpen(), {
    enableOnFormTags: true,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-full w-full md:max-w-[740px] h-[535px] m-0 select-text bg-transparent border-none"
        hideClose
      >
        <Search />
        <SearchFooter />
      </DialogContent>
    </Dialog>
  );
}
