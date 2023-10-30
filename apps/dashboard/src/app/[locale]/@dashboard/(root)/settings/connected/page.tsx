import { ConnectedAccounts } from "@/components/connected-accounts";
import ConnectBankModal from "@/components/modals/connect-bank-modal";
import SelectAccountModal from "@/components/modals/select-account-modal";
import { getCountryCode } from "@midday/location";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connected Accounts | Midday",
};

export default function Connected() {
  const countryCode = getCountryCode();

  return (
    <div className="flex flex-col space-y-12">
      <ConnectedAccounts />
      <ConnectBankModal countryCode={countryCode} />
      <SelectAccountModal countryCode={countryCode} />
    </div>
  );
}
