"use client";

import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useState } from "react";
import { FilePreview } from "../file-preview";

export function FileModal({ src, type }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpen(false)}>
      <DialogContent>
        <FilePreview src={src} type={type} className="w-[500px] h-[500px]" />
      </DialogContent>
    </Dialog>
  );
}
