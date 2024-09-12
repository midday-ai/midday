import { memo, useCallback } from "react";
import { cn } from "@/lib/editor/utils";
import { Editor } from "@tiptap/react";

import { TableOfContents } from "../tableOfContents";

export const Sidebar = memo(
  ({
    editor,
    isOpen,
    onClose,
  }: {
    editor: Editor;
    isOpen?: boolean;
    onClose: () => void;
  }) => {
    const handlePotentialClose = useCallback(() => {
      if (window.innerWidth < 1024) {
        onClose();
      }
    }, [onClose]);

    const windowClassName = cn(
      "absolute top-0 left-0 bg-white lg:bg-white/30 lg:backdrop-blur-xl h-full lg:h-auto lg:relative z-[999] w-0 duration-300 transition-all",
      "dark:bg-black lg:dark:bg-black/30",
      !isOpen && "border-r-transparent",
      isOpen && "w-80 border-r border-r-neutral-200 dark:border-r-neutral-800",
    );

    return (
      <div className={windowClassName}>
        <div className="h-full w-full overflow-hidden">
          <div className="h-full w-full overflow-auto p-6">
            <TableOfContents
              onItemClick={handlePotentialClose}
              editor={editor}
            />
          </div>
        </div>
      </div>
    );
  },
);

Sidebar.displayName = "TableOfContentSidepanel";
