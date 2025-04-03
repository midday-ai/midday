import { AssistantModal } from "@/components/assistant/assistant-modal";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { getCountryCode, getCurrency } from "@midday/location";
import { uniqueCurrencies } from "@midday/location/currencies";
import { getUser } from "@midday/supabase/cached-queries";
import { Suspense } from "react";
import { CustomerCreateSheet } from "./customer-create-sheet";
import { CustomerEditSheet } from "./customer-edit-sheet";
import { InvoiceCreateSheetServer } from "./invoice-create-sheet.server";
import { TrackerSheetsServer } from "./tracker-sheets.server";
import { TransactionSheet } from "./transaction-sheet";

export async function GlobalSheets() {
  const currency = await getCurrency();
  const countryCode = await getCountryCode();
  const { data: userData } = await getUser();

  return (
    <>
      <Suspense fallback={null}>
        <TrackerSheetsServer
          teamId={userData?.team_id}
          userId={userData?.id}
          timeFormat={userData?.time_format}
          defaultCurrency={currency}
        />
      </Suspense>

      <CustomerCreateSheet />
      <CustomerEditSheet />
      <TransactionSheet />

      <AssistantModal />
      <ConnectTransactionsModal countryCode={countryCode} />
      <SelectBankAccountsModal />
      <ImportModal currencies={uniqueCurrencies} defaultCurrency={currency} />

      <Suspense fallback={null}>
        {/* We preload the invoice data (template, invoice number etc) */}
        <InvoiceCreateSheetServer teamId={userData?.team_id} />
      </Suspense>
    </>
  );
}
