"use client";

import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { TrialEndedModal } from "@/components/modals/trial-ended-modal";
import { SearchModal } from "@/components/search/search-modal";
import { CategoryCreateSheet } from "@/components/sheets/category-create-sheet";
import { CategoryEditSheet } from "@/components/sheets/category-edit-sheet";
import { CustomerCreateSheet } from "@/components/sheets/customer-create-sheet";
import { CustomerEditSheet } from "@/components/sheets/customer-edit-sheet";
import { DocumentSheet } from "@/components/sheets/document-sheet";
import { InboxDetailsSheet } from "@/components/sheets/inbox-details-sheet";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { InvoiceSheet } from "@/components/sheets/invoice-sheet";
import { ProductCreateSheet } from "@/components/sheets/product-create-sheet";
import { ProductEditSheet } from "@/components/sheets/product-edit-sheet";
import { TrackerCreateSheet } from "@/components/sheets/tracker-create-sheet";
import { TrackerScheduleSheet } from "@/components/sheets/tracker-schedule-sheet";
import { TrackerUpdateSheet } from "@/components/sheets/tracker-update-sheet";
import { TransactionCreateSheet } from "@/components/sheets/transaction-create-sheet";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { uniqueCurrencies } from "@midday/location/currencies";
import { use } from "react";

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
      <TrackerScheduleSheet />

      <CategoryCreateSheet />
      <CategoryEditSheet />

      <CustomerCreateSheet />
      <CustomerEditSheet />

      <ProductCreateSheet defaultCurrency={currency} />
      <ProductEditSheet defaultCurrency={currency} />

      <TransactionSheet />
      <TransactionCreateSheet />

      <SelectBankAccountsModal />
      <TrialEndedModal />
      <SearchModal />

      <DocumentSheet />
      <InboxDetailsSheet />

      <ImportModal currencies={uniqueCurrencies} defaultCurrency={currency} />
      <ConnectTransactionsModal countryCode={countryCode} />

      <InvoiceDetailsSheet />
      <InvoiceSheet />
    </>
  );
}
