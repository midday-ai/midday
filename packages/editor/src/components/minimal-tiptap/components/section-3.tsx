import { cn } from "@/lib/editor/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { CaretDownIcon, ListBulletIcon } from "@radix-ui/react-icons";
import type { Editor } from "@tiptap/core";

import { activeItemClass, DropdownMenuItemClass } from "../utils";
import { ShortcutKey } from "./shortcut-key";
import { ToolbarButton } from "./toolbar-button";

export default function SectionThree({ editor }: { editor: Editor }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          isActive={
            editor.isActive("bulletList") || editor.isActive("orderedList")
          }
          tooltip="Lists"
          className="w-12"
        >
          <ListBulletIcon className="size-5" />
          <CaretDownIcon className="size-5" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-full">
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(DropdownMenuItemClass, {
            [activeItemClass]: editor.isActive("orderedList"),
          })}
          aria-label="Numbered list"
        >
          <span className="grow">Numbered list</span>
          <ShortcutKey keys={["mod", "shift", "7"]} />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(DropdownMenuItemClass, {
            [activeItemClass]: editor.isActive("bulletList"),
          })}
          aria-label="Bullet list"
        >
          <span className="grow">Bullet list</span>
          <ShortcutKey keys={["mod", "shift", "8"]} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
