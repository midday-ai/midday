import { BaseCurrency } from "@/components/base-currency/base-currency";
import { ConnectedAccounts } from "@/components/connected-accounts";
import { Alert, AlertDescription, AlertTitle } from "@midday/ui/alert";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Midday",
};

export default function Page() {
  return (
    <div className="space-y-12">
      <Alert>
        <AlertTitle className="mb-1">Temporary Sync Issue</AlertTitle>
        <AlertDescription className="text-sm text-[#606060]">
          If you currently experience any issues with missing transactions, try
          syncing one account at a time by disabling all accounts except one and
          then pressing sync. We are working on a permanent fix, sorry for the
          inconvenience.
        </AlertDescription>
      </Alert>
      <ConnectedAccounts />
      <BaseCurrency />
    </div>
  );
}
