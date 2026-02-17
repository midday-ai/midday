"use client";

import { Dialog, DialogContent } from "@midday/ui/dialog";
import { useConnectParams } from "@/hooks/use-connect-params";
import { SelectBankAccountsContent } from "../select-bank-accounts-content";

export function SelectBankAccountsModal() {
  const { step, setParams } = useConnectParams();

  const isOpen = step === "account";

  const onClose = () => {
    setParams(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="p-4">
          <SelectBankAccountsContent
            enabled={isOpen}
            onClose={onClose}
            stickySubmit={true}
            accountsListClassName="min-h-[280px]"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
