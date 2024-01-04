import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { ConnectBankModal } from "@/components/modals/connect-bank-modal";
import { SelectAccountModal } from "@/components/modals/select-account-modal";
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

      <ConnectBankModal countryCode={countryCode} />
      <SelectAccountModal countryCode={countryCode} />
      <ExportStatus />
    </div>
  );
}
