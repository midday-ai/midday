import { AI } from "@/actions/ai/chat";
import { DefaultSettings } from "@/components/default-settings.server";
import { Header } from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";
import { Sidebar } from "@/components/sidebar";
import { UserProvider } from "@/store/user/provider";
import { setupAnalytics } from "@midday/events/server";
import { getCountryCode, getCurrency } from "@midday/location";
import { uniqueCurrencies } from "@midday/location/currencies";
import { getUser } from "@midday/supabase/cached-queries";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { Suspense } from "react";

const AssistantModal = dynamic(
  () =>
    import("@/components/assistant/assistant-modal").then(
      (mod) => mod.AssistantModal,
    ),
  {
    ssr: false,
  },
);

const ExportStatus = dynamic(
  () => import("@/components/export-status").then((mod) => mod.ExportStatus),
  {
    ssr: false,
  },
);

const SelectBankAccountsModal = dynamic(
  () =>
    import("@/components/modals/select-bank-accounts").then(
      (mod) => mod.SelectBankAccountsModal,
    ),
  {
    ssr: false,
  },
);

const ImportModal = dynamic(
  () =>
    import("@/components/modals/import-modal").then((mod) => mod.ImportModal),
  {
    ssr: false,
  },
);

const HotKeys = dynamic(
  () => import("@/components/hot-keys").then((mod) => mod.HotKeys),
  {
    ssr: false,
  },
);

const ConnectTransactionsModal = dynamic(
  () =>
    import("@/components/modals/connect-transactions-modal").then(
      (mod) => mod.ConnectTransactionsModal,
    ),
  {
    ssr: false,
  },
);

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const countryCode = getCountryCode();
  const currency = getCurrency();

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
            {/* Set default user timezone and locale */}
            <DefaultSettings />
          </Suspense>
        </AI>
      </div>
    </UserProvider>
  );
}
