"use client";

import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useToast } from "@midday/ui/use-toast";
import Link from "next/link";
import { useState } from "react";
import { CopyInput } from "./copy-input";

export function ShareReport() {
  const [isOpen, setOpen] = useState(false);
  const { toast, dismiss } = useToast();

  const handleOnClose = () => {
    setOpen(false);

    const { id } = toast({
      title: "Report published",
      description: "Your report is ready to share.",
      variant: "success",
      footer: (
        <div className="mt-4 space-x-2 flex w-full">
          <CopyInput
            value="https://go.midday.ai/mj8hf2w"
            className="border-[#2C2C2C] w-full"
          />

          <Link href="/report/mj8hf2w" onClick={() => dismiss(id)}>
            <Button>View</Button>
          </Link>
        </div>
      ),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Share
      </Button>

      <DialogContent className="sm:max-w-[425px]">
        <div className="p-4 space-y-8">
          <DialogHeader>
            <DialogTitle>Share report</DialogTitle>
            <DialogDescription>
              Publish the chosen profit/loss period by simply sharing this URL.
            </DialogDescription>

            <CopyInput value="https://go.midday.ai/mj8hf2w" />
          </DialogHeader>

          <DialogFooter>
            <Button className="w-full" onClick={handleOnClose}>
              Publish
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
