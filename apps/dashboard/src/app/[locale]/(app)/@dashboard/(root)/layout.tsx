import { CommandMenu } from "@/components/command-menu";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { HotKeys } from "@/components/hot-keys";
import { MobileOverview } from "@/components/mobile-overlay";
import { ConnectGoCardLessModal } from "@/components/modals/connect-gocardless-modal";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportCSVModal } from "@/components/modals/import-csv-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { Sidebar } from "@/components/sidebar";
import { getCountryCode, isEUCountry } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const countryCode = getCountryCode();
  const isEU = isEUCountry(countryCode);

  if (!user?.data?.team) {
    redirect("/teams");
  }

  return (
    <div className="flex">
      <MobileOverview />
      <Sidebar />

      <div className="flex-1 ml-8 mr-10 mb-8">
        <Header />
        {children}
      </div>

      <ConnectTransactionsModal isEU={isEU} />
      <ConnectGoCardLessModal countryCode={countryCode} />
      <SelectBankAccountsModal countryCode={countryCode} />
      <ImportCSVModal />
      <ExportStatus />
      <CommandMenu />
      <HotKeys />
    </div>
  );
}
