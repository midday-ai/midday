import { ConnectedAccounts } from "@/components/connected-accounts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accounts | Solomon AI",
};

export default function Page() {
  return (
    <div className="space-y-12">
      <ConnectedAccounts />
    </div>
  );
}
