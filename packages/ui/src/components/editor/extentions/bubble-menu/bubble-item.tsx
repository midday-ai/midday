"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenuButton } from "./bubble-menu-button";

interface BubbleItemProps {
  editor: Editor;
  action: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

export function BubbleMenuItem({
  editor,
  action,
  isActive,
  children,
}: BubbleItemProps) {
  return (
    <BubbleMenuButton
      action={() => {
        editor.chain().focus();
        action();
      }}
      isActive={isActive}
    >
      {children}
    </BubbleMenuButton>
  );
}
