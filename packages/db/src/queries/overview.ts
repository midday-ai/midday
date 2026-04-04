import { formatISO } from "date-fns";
import type { Database } from "../client";
import { getCashBalance } from "./bank-accounts";
import { getInboxByStatus } from "./inbox-matching";
import { getInvoiceSummary } from "./invoices";
import { getRunway } from "./reports";
import { getBillableHours } from "./tracker-entries";
import { getTransactionsReadyForExportCount } from "./transactions";

export type OverviewSummary = {
  openInvoices: {
    count: number;
    totalAmount: number;
    currency: string;
  };
  unbilledTime: {
    totalDuration: number;
    totalAmount: number;
    projectCount: number;
    currency: string;
  };
  inboxPending: {
    count: number;
  };
  transactionsToReview: {
    count: number;
  };
  cashBalance: {
    totalBalance: number;
    currency: string;
    accountCount: number;
  };
  runway: number;
};

export type GetOverviewSummaryParams = {
  teamId: string;
  currency?: string;
};

export async function getOverviewSummary(
  db: Database,
  params: GetOverviewSummaryParams,
): Promise<OverviewSummary> {
  const { teamId, currency } = params;
  const today = formatISO(new Date(), { representation: "date" });

  const [openInv, billable, pendingInbox, reviewCount, cash, runwayResult] =
    await Promise.all([
      getInvoiceSummary(db, {
        teamId,
        statuses: ["draft", "scheduled", "unpaid"],
      }),
      getBillableHours(db, { teamId, date: today, view: "month" }),
      getInboxByStatus(db, { teamId, status: "pending" }),
      getTransactionsReadyForExportCount(db, teamId),
      getCashBalance(db, { teamId, currency }),
      getRunway(db, { teamId, currency }),
    ]);

  return {
    openInvoices: {
      count: openInv.invoiceCount,
      totalAmount: openInv.totalAmount,
      currency: openInv.currency,
    },
    unbilledTime: {
      totalDuration: billable.totalDuration,
      totalAmount: billable.totalAmount,
      projectCount: billable.projectBreakdown.length,
      currency: billable.currency,
    },
    inboxPending: {
      count: pendingInbox.length,
    },
    transactionsToReview: {
      count: reviewCount,
    },
    cashBalance: {
      totalBalance: cash.totalBalance,
      currency: cash.currency,
      accountCount: cash.accountCount,
    },
    runway: runwayResult.months,
  };
}
