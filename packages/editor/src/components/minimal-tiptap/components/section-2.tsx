import { cn } from "@/lib/editor/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  DotsHorizontalIcon,
  FontBoldIcon,
  FontItalicIcon,
} from "@radix-ui/react-icons";
import type { Editor } from "@tiptap/core";

import { activeItemClass, DropdownMenuItemClass } from "../utils";
import { ShortcutKey } from "./shortcut-key";
import { ToolbarButton } from "./toolbar-button";

export default function SectionTwo({ editor }: { editor: Editor }) {
  return (
    <>
      {/* BOLD */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={
          !editor.can().chain().focus().toggleBold().run() ||
          editor.isActive("codeBlock")
        }
        isActive={editor.isActive("bold")}
        tooltip="Bold"
        aria-label="Bold"
      >
        <FontBoldIcon className="size-5" />
      </ToolbarButton>

      {/* ITALIC */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={
          !editor.can().chain().focus().toggleItalic().run() ||
          editor.isActive("codeBlock")
        }
        isActive={editor.isActive("italic")}
        tooltip="Italic"
        aria-label="Italic"
      >
        <FontItalicIcon className="size-5" />
      </ToolbarButton>

      {/* STRIKE, CODE, CLEAR FORMATTING */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            isActive={editor.isActive("strike") || editor.isActive("code")}
            tooltip="More formatting"
            aria-label="More formatting"
          >
            <DotsHorizontalIcon className="size-5" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-full">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={
              !editor.can().chain().focus().toggleStrike().run() ||
              editor.isActive("codeBlock")
            }
            className={cn(DropdownMenuItemClass, {
              [activeItemClass]: editor.isActive("strike"),
            })}
            aria-label="Strikethrough"
          >
            <span className="grow">Strikethrough</span>
            <ShortcutKey keys={["mod", "shift", "S"]} />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={
              !editor.can().chain().focus().toggleCode().run() ||
              editor.isActive("codeBlock")
            }
            className={cn(DropdownMenuItemClass, {
              [activeItemClass]: editor.isActive("code"),
            })}
            aria-label="Code"
          >
            <span className="grow">Code</span>
            <ShortcutKey keys={["mod", "E"]} />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            disabled={
              !editor.can().chain().focus().unsetAllMarks().run() ||
              editor.isActive("codeBlock")
            }
            className={cn(DropdownMenuItemClass)}
            aria-label="Clear formatting"
          >
            <span className="grow">Clear formatting</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
