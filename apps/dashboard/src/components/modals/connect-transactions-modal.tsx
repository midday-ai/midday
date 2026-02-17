"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useTeamQuery } from "@/hooks/use-team";
import { BankSearchContent } from "../bank-search-content";

export function ConnectTransactionsModal() {
  const { step, setParams } = useConnectParams();
  const { data: team } = useTeamQuery();

  const isOpen = step === "connect";

  const handleOnClose = () => {
    setParams({
      step: null,
      countryCode: null,
      search: null,
      ref: null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent>
        <div className="p-4">
          <DialogHeader>
            <DialogTitle>Connect bank account</DialogTitle>

            <DialogDescription>
              We work with a variety of banking providers to support as many
              banks as possible. If you can't find yours,{" "}
              <button
                type="button"
                className="underline"
                onClick={() => setParams({ step: "import" })}
              >
                manual import
              </button>{" "}
              is available as an alternative.
            </DialogDescription>

            <div className="pt-4">
              <BankSearchContent
                enabled={isOpen}
                defaultCountryCode={team?.countryCode ?? ""}
              />
            </div>
          </DialogHeader>
        </div>
      </DialogContent>
    </Dialog>
  );
}
