"use client";

import { ApiKeyForm } from "@/components/forms/api-key-form";
import { useTokenModalStore } from "@/store/token-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";

export function EditApiKeyModal() {
  const { setData, data, type } = useTokenModalStore();

  return (
    <Dialog open={type === "edit"} onOpenChange={() => setData(undefined)}>
      <DialogContent
        className="max-w-[455px]"
        onOpenAutoFocus={(evt) => evt.preventDefault()}
      >
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
          </DialogHeader>

          <ApiKeyForm onSuccess={() => setData(undefined)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
