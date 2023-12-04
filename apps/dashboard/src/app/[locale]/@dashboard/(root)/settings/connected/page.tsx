import { ConnectedAccounts } from "@/components/connected-accounts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Accounts | Midday",
};

export default function Connected() {
  return (
    <div className="flex flex-col space-y-12">
      <ConnectedAccounts />
    </div>
  );
}
