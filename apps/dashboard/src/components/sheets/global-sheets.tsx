"use client";

import { AssistantModal } from "@/components/assistant/assistant-modal";
import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { uniqueCurrencies } from "@midday/location/currencies";
import { use } from "react";
import { CustomerCreateSheet } from "./customer-create-sheet";
import { CustomerEditSheet } from "./customer-edit-sheet";
import { TrackerCreateSheet } from "./tracker-create-sheet";
import { TrackerScheduleSheet } from "./tracker-schedule-sheet";
import { TrackerUpdateSheet } from "./tracker-update-sheet";
import { TransactionSheet } from "./transaction-sheet";

type Props = {
  currencyPromise: Promise<string>;
  countryCodePromise: Promise<string>;
};

export function GlobalSheets({ currencyPromise, countryCodePromise }: Props) {
  const currency = use(currencyPromise);
  const countryCode = use(countryCodePromise);

  return (
    <>
      <TrackerUpdateSheet defaultCurrency={currency} />
      <TrackerCreateSheet defaultCurrency={currency} />
      <TrackerScheduleSheet defaultCurrency={currency} />

      <CustomerCreateSheet />
      <CustomerEditSheet />
      <TransactionSheet />

      <AssistantModal />
      <ConnectTransactionsModal countryCode={countryCode} />
      <SelectBankAccountsModal />
      <ImportModal currencies={uniqueCurrencies} defaultCurrency={currency} />

      {/* <InvoiceCreateSheetServer teamId={userData?.team_id} />  */}
    </>
  );
}
