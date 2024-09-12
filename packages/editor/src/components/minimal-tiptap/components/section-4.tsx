import { cn } from "@/lib/editor/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  CaretDownIcon,
  CodeIcon,
  DividerHorizontalIcon,
  PlusIcon,
  QuoteIcon,
} from "@radix-ui/react-icons";
import type { Editor } from "@tiptap/core";

import { activeItemClass, DropdownMenuItemClass } from "../utils";
import { ImageEditDialog } from "./image/image-edit-dialog";
import { LinkEditPopover } from "./link/link-edit-popover";
import { ShortcutKey } from "./shortcut-key";
import { ToolbarButton } from "./toolbar-button";

export default function SectionFour({ editor }: { editor: Editor }) {
  return (
    <>
      {/* LINK */}
      <LinkEditPopover editor={editor} />

      {/* IMAGE */}
      <ImageEditDialog editor={editor} />

      {/* INSERT ELEMENTS */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            isActive={
              editor.isActive("codeBlock") || editor.isActive("blockquote")
            }
            tooltip="Insert elements"
            className="w-12"
          >
            <PlusIcon className="size-5" />
            <CaretDownIcon className="size-5" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-full">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(DropdownMenuItemClass, {
              [activeItemClass]: editor.isActive("codeBlock"),
            })}
          >
            <span className="flex grow items-center">
              <CodeIcon className="mr-2 size-4" />
              Code block
            </span>
            <ShortcutKey keys={["```"]} withBg />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(DropdownMenuItemClass, {
              [activeItemClass]: editor.isActive("blockquote"),
            })}
          >
            <span className="flex grow items-center">
              <QuoteIcon className="mr-2 size-4" />
              Blockquote
            </span>
            <ShortcutKey keys={[">"]} withBg />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <span className="flex grow items-center">
              <DividerHorizontalIcon className="mr-2 size-4" />
              Divider
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
