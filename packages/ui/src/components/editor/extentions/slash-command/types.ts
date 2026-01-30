import type { Editor, Range } from "@tiptap/react";
import type React from "react";

export type SlashCommandItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  command: (props: { editor: Editor; range: Range }) => void;
  // For items with submenus (like Bank Account)
  hasSubmenu?: boolean;
  submenuItems?: SlashCommandSubItem[];
};

export type SlashCommandSubItem = {
  id: string;
  label: string;
  description?: string;
  command: (props: { editor: Editor; range: Range }) => void;
};
