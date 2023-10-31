import { Header } from "@/components/header";
import { ConnectBankModal } from "@/components/modals/connect-bank-modal";
import { SelectAccountModal } from "@/components/modals/select-account-modal";
import { Sidebar } from "@/components/sidebar";
import { getCountryCode } from "@midday/location";

export default function Layout({ children }: { children: React.ReactNode }) {
  const countryCode = getCountryCode();

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-8 mr-10 mb-8">
        <Header />
        {children}
      </div>

      <ConnectBankModal countryCode={countryCode} />
      <SelectAccountModal countryCode={countryCode} />
    </div>
  );
}
