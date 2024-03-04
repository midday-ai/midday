import { CommandMenu } from "@/components/command-menu";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { HotKeys } from "@/components/hot-keys";
import { ConnectGoCardLessModal } from "@/components/modals/connect-gocardless-modal";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { Sidebar } from "@/components/sidebar";
import { getCountryCode } from "@midday/location";
import { getUser } from "@midday/supabase/cached-queries";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const countryCode = getCountryCode();

  if (!user?.data?.team) {
    redirect("/teams");
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-8 mr-10 mb-8">
        <Header />
        {children}
      </div>

      <ConnectTransactionsModal />
      <ConnectGoCardLessModal countryCode={countryCode} />
      <SelectBankAccountsModal countryCode={countryCode} />
      <ExportStatus />
      <CommandMenu />
      <HotKeys />
    </div>
  );
}
