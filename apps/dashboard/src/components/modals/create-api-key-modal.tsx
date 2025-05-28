"use client";

import { ApiKeyForm } from "@/components/forms/api-key-form";
import { Button } from "@midday/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useState } from "react";
import { CopyInput } from "../copy-input";

type CreateApiKeyModalProps = {
  onOpenChange: (open: boolean) => void;
};

export function CreateApiKeyModal({ onOpenChange }: CreateApiKeyModalProps) {
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);

    setTimeout(() => {
      setCreatedKey(null);
    }, 1000);
  };

  if (createdKey) {
    return (
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              For security reasons, the key will only be shown once. Please copy
              and store it in a secure location.
            </DialogDescription>
          </DialogHeader>

          <CopyInput value={createdKey} />

          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-[455px]">
      <div className="p-4 space-y-4">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for your team.
          </DialogDescription>
        </DialogHeader>

        <ApiKeyForm onSuccess={setCreatedKey} />
      </div>
    </DialogContent>
  );
}
