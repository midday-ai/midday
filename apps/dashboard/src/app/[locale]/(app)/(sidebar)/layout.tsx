import { AI } from "@/actions/ai/chat";
import ChatAccessibilityButton from "@/components/accessibility-button/chat-accessibility-button";
import { AccessibilityWidget } from "@/components/accessibility-helper-widget";
import { FinancialAnalyticsDock } from "@/components/dock/financial-analytics-dock";
import { Header } from "@/components/header";
import { ExpenseViewModal } from "@/components/modals/expense/expense-view-modal";
import { IncomeViewModal } from "@/components/modals/income/income-view-modal";
import { OverviewViewModal } from "@/components/modals/overview/overview-view-modal";
import { SubscriptionViewModal } from "@/components/modals/subscription/subscription-view-modal";
import { TransactionViewModal } from "@/components/modals/transaction/transaction-view-modal";
import { Sidebar } from "@/components/sidebar";
import features from "@/config/enabled-features";
import { setupAnalytics } from "@midday/events/server";
import { getCountryCode } from "@midday/location";
import { currencies, uniqueCurrencies } from "@midday/location/src/currencies";
import { getUser, getUserSubscriptions } from "@midday/supabase/cached-queries";
import { nanoid } from "nanoid";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

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

  var user: any = null;
  try {
    user = await getUser();
    // Proceed with your logic for when a user is successfully retrieved
  } catch (error) {
    console.error("Error fetching user", error);
    redirect("/login");
  }

  // if no rows are returned (a user does not exist), redirect to the login page
  if (!user?.data || user?.error !== null) {
    redirect("/login");
  }

  const countryCode = getCountryCode();

  // Check if the payment feature flag is enabled
  if (features.isPaymentsEnabled) {
    const currentUserSubscription = await getUserSubscriptions(true); // Invalidate cache
    if (!currentUserSubscription?.data?.[0]?.status
    ) {
      redirect("/payment");
    }
  }

  // if the user does not have a team, redirect to the teams page
  if (!user?.data?.team) {
    redirect("/teams");
  }

  if (user) {
    await setupAnalytics({ userId: user.data.id });
  }

  return (
    <div className="relative">
      <AI initialAIState={{ user: user.data, messages: [], chatId: nanoid() }}>
        <Sidebar />

        <div className="mx-4 md:ml-[95px] md:mr-10 pb-8">
          {/* <Header /> */}
          {children}
          <AccessibilityWidget
            email={user.data.email as string}
            name={user.data.full_name as string}
            id={user.data.id as string}
            profilePicture={user.data.avatar_url as string}
          />
        </div>

        {/* This is used to make the header draggable on macOS */}
        <div className="hidden todesktop:block todesktop:[-webkit-app-region:drag] fixed top-0 w-full h-4 pointer-events-none" />

        <AssistantModal />
        <IncomeViewModal />
        <ExpenseViewModal />
        <SubscriptionViewModal />
        <TransactionViewModal />
        <OverviewViewModal />
        <ConnectTransactionsModal countryCode={countryCode} />
        <SelectBankAccountsModal />
        <ImportModal
          currencies={uniqueCurrencies}
          defaultCurrency={
            currencies[countryCode as keyof typeof currencies] || "USD"
          }
        />
        <ExportStatus />
        <HotKeys />
      </AI>
    </div>
  );
}
