import { BaseCurrency } from "@/components/base-currency/base-currency";
import { ConnectedAccounts } from "@/components/connected-accounts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Midday",
};

export default function Page() {
  return (
    <div className="space-y-12">
      <ConnectedAccounts />
      <BaseCurrency />
    </div>
  );
}
