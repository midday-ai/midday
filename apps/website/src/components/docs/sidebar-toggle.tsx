"use client";

import type { docsNavigation } from "@/lib/docs";
import { Icons } from "@midday/ui/icons";
import { useState } from "react";
import { DocsSidebar } from "./sidebar";

type DocsSidebarToggleProps = {
  navigation: typeof docsNavigation;
};

export function DocsSidebarToggle({ navigation }: DocsSidebarToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle button - fixed position, always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-20 left-4 z-30 p-2 border border-border bg-background hover:bg-secondary transition-colors flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        aria-label="Browse documentation"
      >
        <Icons.Menu className="w-4 h-4" />
        <span className="hidden sm:inline">Browse docs</span>
      </button>

      {/* Sidebar */}
      <DocsSidebar
        navigation={navigation}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
