import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { Link2Icon } from "@radix-ui/react-icons";
import type { Editor } from "@tiptap/core";

import { LinkProps } from "../../types";
import { ToolbarButton } from "../toolbar-button";
import { LinkEditBlock } from "./link-edit-block";

const LinkEditPopover = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);

  const setLink = ({ url, text, openInNewTab }: LinkProps) => {
    editor
      .chain()
      .extendMarkRange("link")
      .insertContent({
        type: "text",
        text: text || url,
        marks: [
          {
            type: "link",
            attrs: {
              href: url,
              target: openInNewTab ? "_blank" : "",
            },
          },
        ],
      })
      .setLink({ href: url })
      .focus()
      .run();

    editor.commands.enter();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isActive={editor.isActive("link")}
          tooltip="Link"
          disabled={editor.isActive("codeBlock")}
        >
          <Link2Icon className="size-5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-80" align="start" side="bottom">
        <LinkEditBlock
          editor={editor}
          close={() => setOpen(false)}
          onSetLink={setLink}
        />
      </PopoverContent>
    </Popover>
  );
};

export { LinkEditPopover };
