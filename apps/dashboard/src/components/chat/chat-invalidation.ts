"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { isToolPart, normalizeToolPart } from "./chat-utils";

type TRPCProxy = ReturnType<typeof useTRPC>;
type InvalidationFn = (trpc: TRPCProxy, qc: QueryClient) => void;

function invalidateCustomers(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.customers.get.infiniteQueryKey() });
  qc.invalidateQueries({ queryKey: trpc.customers.get.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.customers.getById.queryKey() });
}

function invalidateTracker(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({
    queryKey: trpc.trackerProjects.get.infiniteQueryKey(),
  });
  qc.invalidateQueries({ queryKey: trpc.trackerEntries.byDate.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.trackerEntries.byRange.queryKey() });
  qc.invalidateQueries({
    queryKey: trpc.trackerEntries.getBillableHours.queryKey(),
  });
  qc.invalidateQueries({
    queryKey: trpc.trackerEntries.getTimerStatus.queryKey(),
  });
  qc.invalidateQueries({
    queryKey: trpc.trackerEntries.getCurrentTimer.queryKey(),
  });
}

function invalidateTransactions(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({
    queryKey: trpc.transactions.get.infiniteQueryKey(),
  });
  qc.invalidateQueries({ queryKey: trpc.transactions.getById.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.reports.revenue.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.reports.profit.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.reports.expense.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.reports.spending.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.reports.taxSummary.queryKey() });
  qc.invalidateQueries({
    queryKey: trpc.reports.revenueForecast.queryKey(),
  });
  qc.invalidateQueries({ queryKey: trpc.overview.summary.queryKey() });
}

function invalidateInvoices(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.invoice.getById.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.get.infiniteQueryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.invoiceSummary.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoice.paymentStatus.queryKey() });
}

function invalidateInvoiceProducts(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.invoiceProducts.get.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoiceProducts.getById.queryKey() });
}

function invalidateInvoiceRecurring(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.invoiceRecurring.get.queryKey() });
  qc.invalidateQueries({ queryKey: trpc.invoiceRecurring.list.queryKey() });
  qc.invalidateQueries({
    queryKey: trpc.invoiceRecurring.getUpcoming.queryKey(),
  });
}

function invalidateCategories(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({
    queryKey: trpc.transactionCategories.get.queryKey(),
  });
}

function invalidateTags(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.tags.get.queryKey() });
}

function invalidateInbox(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.inbox.get.infiniteQueryKey() });
  qc.invalidateQueries({ queryKey: trpc.inbox.getById.queryKey() });
}

function invalidateDocuments(trpc: TRPCProxy, qc: QueryClient) {
  qc.invalidateQueries({ queryKey: trpc.documents.get.infiniteQueryKey() });
}

const TOOL_INVALIDATION_MAP: Record<string, InvalidationFn> = {
  customers_create: invalidateCustomers,
  customers_update: invalidateCustomers,
  customers_delete: invalidateCustomers,

  tracker_projects_create: invalidateTracker,
  tracker_projects_update: invalidateTracker,
  tracker_projects_delete: invalidateTracker,
  tracker_entries_create: invalidateTracker,
  tracker_entries_update: invalidateTracker,
  tracker_entries_delete: invalidateTracker,
  tracker_timer_start: invalidateTracker,
  tracker_timer_stop: invalidateTracker,

  transactions_create: invalidateTransactions,
  transactions_create_bulk: invalidateTransactions,
  transactions_update: invalidateTransactions,
  transactions_update_bulk: invalidateTransactions,
  transactions_delete: invalidateTransactions,
  transactions_delete_bulk: invalidateTransactions,

  invoices_create: invalidateInvoices,
  invoices_update: invalidateInvoices,
  invoices_update_draft: invalidateInvoices,
  invoices_delete: invalidateInvoices,
  invoices_send: invalidateInvoices,
  invoices_mark_paid: invalidateInvoices,
  invoices_cancel: invalidateInvoices,
  invoices_duplicate: invalidateInvoices,
  invoices_create_from_tracker: (trpc, qc) => {
    invalidateInvoices(trpc, qc);
    invalidateTracker(trpc, qc);
  },

  invoice_products_create: invalidateInvoiceProducts,
  invoice_products_update: invalidateInvoiceProducts,
  invoice_products_delete: invalidateInvoiceProducts,

  invoice_recurring_create: invalidateInvoiceRecurring,
  invoice_recurring_delete: invalidateInvoiceRecurring,
  invoice_recurring_pause: invalidateInvoiceRecurring,
  invoice_recurring_resume: invalidateInvoiceRecurring,

  categories_create: invalidateCategories,
  categories_update: invalidateCategories,
  categories_delete: invalidateCategories,

  tags_create: invalidateTags,
  tags_update: invalidateTags,
  tags_delete: invalidateTags,

  inbox_update: invalidateInbox,
  inbox_delete: invalidateInbox,
  inbox_match_transaction: (trpc, qc) => {
    invalidateInbox(trpc, qc);
    invalidateTransactions(trpc, qc);
  },
  inbox_unmatch_transaction: (trpc, qc) => {
    invalidateInbox(trpc, qc);
    invalidateTransactions(trpc, qc);
  },
  inbox_confirm_match: (trpc, qc) => {
    invalidateInbox(trpc, qc);
    invalidateTransactions(trpc, qc);
  },
  inbox_decline_match: invalidateInbox,

  documents_delete: invalidateDocuments,
  document_tags_create: invalidateDocuments,
  document_tags_delete: invalidateDocuments,
  document_tags_assign: invalidateDocuments,
  document_tags_unassign: invalidateDocuments,
};

export function useChatToolInvalidation(messages: UIMessage[]) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    let didInvalidate = false;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (!isToolPart(part as { type: string })) continue;
        const norm = normalizeToolPart(part as Record<string, unknown>);
        if (norm.state !== "output-available") continue;
        if (processedRef.current.has(norm.toolCallId)) continue;

        const invalidate = TOOL_INVALIDATION_MAP[norm.toolName];
        if (invalidate) {
          processedRef.current.add(norm.toolCallId);
          invalidate(trpc, queryClient);
          didInvalidate = true;
        }
      }
    }

    if (didInvalidate) {
      queryClient.invalidateQueries({
        queryKey: trpc.search.global.queryKey(),
      });
    }
  }, [messages, trpc, queryClient]);
}
