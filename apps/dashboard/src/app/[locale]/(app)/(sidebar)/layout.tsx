import { AI } from "@/actions/ai/chat";
import { AssistantModal } from "@/components/assistant/assistant-modal";
import { DefaultSettings } from "@/components/default-settings.server";
import { ExportStatus } from "@/components/export-status";
import { Header } from "@/components/header";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import { TrialEnded } from "@/components/trial-ended.server";
import { HydrateClient, getQueryClient, trpc } from "@/trpc/server";
import { setupAnalytics } from "@midday/events/server";
import { getCountryCode, getCurrency } from "@midday/location";
import { uniqueCurrencies } from "@midday/location/currencies";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  // NOTE: Right now we want to fetch the user and hydrate the client
  // Next steps would be to prefetch and suspense
  const user = await queryClient.fetchQuery(trpc.user.me.queryOptions());
  const countryCode = await getCountryCode();
  const currency = await getCurrency();

  if (!user?.team) {
    redirect("/teams");
  }

  if (user) {
    await setupAnalytics({ userId: user.id });
  }

  return (
    <HydrateClient>
      <div className="relative">
        <AI initialAIState={{ user, messages: [], chatId: nanoid() }}>
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

          <Suspense>
            <GlobalSheets defaultCurrency={currency} />
          </Suspense>

          <Suspense>
            <TrialEnded
              createdAt={user.team?.created_at}
              plan={user.team?.plan}
              teamId={user.team.id}
            />
          </Suspense>

          <Suspense>
            {/* Set default user timezone and locale */}
            <DefaultSettings />
          </Suspense>
        </AI>
      </div>
    </HydrateClient>
  );
}
