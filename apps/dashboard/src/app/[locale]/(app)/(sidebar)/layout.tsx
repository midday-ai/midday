import { AI } from "@/actions/ai/chat";
import { AssistantModal } from "@/components/assistant/assistant-modal";
import { DefaultSettings } from "@/components/default-settings.server";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { HotKeys } from "@/components/hot-keys";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import { TrialEnded } from "@/components/trial-ended.server";
import { UserProvider } from "@/store/user/provider";
import { setupAnalytics } from "@midday/events/server";
import { getCountryCode, getCurrency } from "@midday/location";
import { uniqueCurrencies } from "@midday/location/currencies";
import { getUser } from "@midday/supabase/cached-queries";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const countryCode = await getCountryCode();
  const currency = await getCurrency();

  if (!user?.data?.team) {
    redirect("/teams");
  }

  if (user) {
    await setupAnalytics({ userId: user.data.id });
  }

  return (
    <UserProvider data={user.data}>
      <div className="relative">
        <AI
          initialAIState={{ user: user.data, messages: [], chatId: nanoid() }}
        >
          <Sidebar />

          <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
            <Header />
            {children}
          </div>

          {/* This is used to make the header draggable on macOS */}
          <div className="hidden todesktop:block todesktop:[-webkit-app-region:drag] fixed top-0 w-full h-4 pointer-events-none" />

          <AssistantModal />
          <ConnectTransactionsModal countryCode={countryCode} />
          <SelectBankAccountsModal />
          <ImportModal
            currencies={uniqueCurrencies}
            defaultCurrency={currency}
          />
          <ExportStatus />
          <HotKeys />

          <Suspense>
            <GlobalSheets defaultCurrency={currency} />
          </Suspense>

          <Suspense>
            <TrialEnded
              createdAt={user.data.team?.created_at}
              plan={user.data.team?.plan}
              teamId={user.data.team?.id}
            />
          </Suspense>

          <Suspense>
            {/* Set default user timezone and locale */}
            <DefaultSettings />
          </Suspense>
        </AI>
      </div>
    </UserProvider>
  );
}
