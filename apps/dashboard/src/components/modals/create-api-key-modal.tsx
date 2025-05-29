"use client";

import { ApiKeyForm } from "@/components/forms/api-key-form";
import { useTokenModalStore } from "@/store/token-modal";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { CopyInput } from "../copy-input";

export function CreateApiKeyModal() {
  const { setData, createdKey, type, setCreatedKey } = useTokenModalStore();

  let content = null;

  if (createdKey) {
    content = (
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
          <Button onClick={() => setData(undefined)} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </div>
    );
  } else {
    content = (
      <div className="p-4 space-y-4">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for your team.
          </DialogDescription>
        </DialogHeader>

        <ApiKeyForm
          onSuccess={(key) => {
            if (key) {
              setCreatedKey(key);
            }
          }}
        />
      </div>
    );
  }

  return (
    <Dialog
      open={type === "create"}
      onOpenChange={() => {
        setData(undefined);
        setTimeout(() => {
          setCreatedKey(undefined);
        }, 500);
      }}
    >
      <DialogContent className="max-w-[455px]">{content}</DialogContent>
    </Dialog>
  );
}
