"use client";

import { ConnectTransactionsModal } from "@/components/modals/connect-transactions-modal";
import { ImportModal } from "@/components/modals/import-modal";
import { SelectBankAccountsModal } from "@/components/modals/select-bank-accounts";
import { SearchModal } from "@/components/search/search-modal";
import { CategoryCreateSheet } from "@/components/sheets/category-create-sheet";
import { CategoryEditSheet } from "@/components/sheets/category-edit-sheet";
import { BrokerCreateSheet } from "@/components/sheets/broker-create-sheet";
import { SyndicatorCreateSheet } from "@/components/sheets/syndicator-create-sheet";
import { MerchantCreateSheet } from "@/components/sheets/merchant-create-sheet";
import { DealCreateSheet } from "@/components/sheets/deal-create-sheet";
import { MerchantDetailsSheet } from "@/components/sheets/merchant-details-sheet";
import { MerchantEditSheet } from "@/components/sheets/merchant-edit-sheet";
import { DocumentSheet } from "@/components/sheets/document-sheet";
import { EditRecurringSheet } from "@/components/sheets/edit-recurring-sheet";
import { InboxDetailsSheet } from "@/components/sheets/inbox-details-sheet";
import { InvoiceDetailsSheet } from "@/components/sheets/invoice-details-sheet";
import { InvoiceSheet } from "@/components/sheets/invoice-sheet";
import { ProductCreateSheet } from "@/components/sheets/product-create-sheet";
import { ProductEditSheet } from "@/components/sheets/product-edit-sheet";
import { TransactionCreateSheet } from "@/components/sheets/transaction-create-sheet";
import { TransactionEditSheet } from "@/components/sheets/transaction-edit-sheet";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { DisclosurePreviewSheet } from "@/components/sheets/disclosure-preview-sheet";

export function GlobalSheets() {
  return (
    <>
      <CategoryCreateSheet />
      <CategoryEditSheet />

      <MerchantCreateSheet />
      <MerchantDetailsSheet />
      <MerchantEditSheet />

      <BrokerCreateSheet />
      <SyndicatorCreateSheet />

      <DealCreateSheet />

      <ProductCreateSheet />
      <ProductEditSheet />

      <TransactionSheet />
      <TransactionCreateSheet />
      <TransactionEditSheet />

      <SelectBankAccountsModal />

      <SearchModal />

      <DocumentSheet />
      <InboxDetailsSheet />

      <ImportModal />
      <ConnectTransactionsModal />

      <InvoiceDetailsSheet />
      <InvoiceSheet />
      <EditRecurringSheet />

      <DisclosurePreviewSheet />
    </>
  );
}
