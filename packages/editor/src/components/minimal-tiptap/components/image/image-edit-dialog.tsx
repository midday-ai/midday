import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { ImageIcon } from "@radix-ui/react-icons";
import type { Editor } from "@tiptap/core";

import { ToolbarButton } from "../toolbar-button";
import { ImageEditBlock } from "./image-edit-block";

const ImageEditDialog = ({ editor }: { editor: Editor }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ToolbarButton
          isActive={editor.isActive("image")}
          tooltip="Image"
          aria-label="Image"
        >
          <ImageIcon className="size-5" />
        </ToolbarButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select image</DialogTitle>
        </DialogHeader>
        <ImageEditBlock editor={editor} close={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export { ImageEditDialog };
