"use client";

import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { formatAmount } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useState } from "react";

type Deal = {
  id: string;
  dealCode: string;
  status: string | null;
};

type Props = {
  portalId: string;
  deals: Deal[];
  statusFilter: string;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  status: string | null;
  paymentType: string | null;
  description: string | null;
  balanceBefore: number | null;
  balanceAfter: number | null;
  nsfAt: string | null;
  nsfFee: number | null;
};

const statusStyles: Record<string, string> = {
  completed: "text-[#00C969] bg-[#DDF1E4] dark:bg-[#00C969]/10",
  returned: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
  pending: "text-[#FFD02B] bg-[#FFD02B]/10 dark:bg-[#FFD02B]/10",
  failed: "text-[#FF3638] bg-[#FF3638]/10 dark:bg-[#FF3638]/10",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  returned: "Returned",
  pending: "Pending",
  failed: "Failed",
};

export function PaymentHistoryList({ portalId, deals, statusFilter }: Props) {
  const trpc = useTRPC();
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id || "");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(
    null,
  );

  const { data: payments = [] } = useSuspenseQuery(
    trpc.merchantPortal.getMcaPayments.queryOptions({
      portalId,
      dealId: selectedDealId,
    }),
  );

  // Filter by status
  const filteredPayments = statusFilter === "all"
    ? payments
    : payments.filter((p: Payment) => p.status === statusFilter);

  // Group payments by month
  const monthlyGroups = groupByMonth(filteredPayments);

  return (
    <div className="space-y-4">
      {/* Deal selector (if multiple deals) */}
      {deals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {deals.map((deal) => (
            <button
              key={deal.id}
              type="button"
              onClick={() => setSelectedDealId(deal.id)}
              className={`px-3 py-2 text-sm rounded-lg border whitespace-nowrap min-h-[44px] transition-colors ${
                selectedDealId === deal.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {deal.dealCode}
            </button>
          ))}
        </div>
      )}

      {/* Payment list */}
      {monthlyGroups.length === 0 ? (
        <div className="text-center py-12 text-[#606060]">
          <Icons.ReceiptLong className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No payments found</p>
        </div>
      ) : (
        monthlyGroups.map(({ month, payments: monthPayments, total }) => (
          <div key={month}>
            {/* Monthly summary */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-medium text-[#606060]">
                {month}
              </h3>
              <span className="text-xs text-[#606060]">
                {monthPayments.length} payment{monthPayments.length !== 1 ? "s" : ""},{" "}
                <span className="font-mono">
                  {formatAmount({ amount: total, currency: "USD" })}
                </span>
              </span>
            </div>

            {/* Payment rows */}
            <div className="border border-border rounded-lg overflow-hidden bg-background divide-y divide-border">
              {monthPayments.map((payment: Payment) => (
                <div key={payment.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPaymentId(
                        expandedPaymentId === payment.id
                          ? null
                          : payment.id,
                      )
                    }
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors min-h-[52px] text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full flex-shrink-0",
                          payment.status === "completed"
                            ? "bg-[#00C969]"
                            : payment.status === "returned"
                              ? "bg-[#FF3638]"
                              : "bg-[#FFD02B]",
                        )}
                      />
                      <div className="min-w-0">
                        <div className="text-sm">
                          {format(parseISO(payment.paymentDate), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-mono font-medium">
                          {formatAmount({
                            amount: payment.amount,
                            currency: "USD",
                          })}
                        </div>
                        <div
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[11px]",
                            statusStyles[payment.status || "pending"],
                          )}
                        >
                          <span className="line-clamp-1 truncate inline-block">
                            {statusLabels[payment.status || "pending"]}
                          </span>
                        </div>
                      </div>
                      <Icons.ChevronDown
                        className={cn(
                          "h-4 w-4 text-[#606060] transition-transform",
                          expandedPaymentId === payment.id && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedPaymentId === payment.id && (
                    <div className="px-4 py-3 bg-muted/30 border-t border-border text-sm space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-[#606060] block">
                            Payment Type
                          </span>
                          <span className="capitalize">
                            {payment.paymentType || "ACH"}
                          </span>
                        </div>
                        {payment.balanceAfter != null && (
                          <div>
                            <span className="text-[11px] text-[#606060] block">
                              Balance After
                            </span>
                            <span className="font-mono">
                              {formatAmount({
                                amount: payment.balanceAfter,
                                currency: "USD",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                      {payment.description && (
                        <div>
                          <span className="text-[11px] text-[#606060] block">
                            Description
                          </span>
                          <span>{payment.description}</span>
                        </div>
                      )}
                      {payment.nsfAt && (
                        <div className="p-2 bg-red-50 rounded border border-red-200 text-red-800 text-xs">
                          <Icons.AlertCircle className="inline h-3 w-3 mr-1" />
                          Returned on{" "}
                          {format(parseISO(payment.nsfAt), "MMM d, yyyy")}
                          {payment.nsfFee
                            ? ` — $${payment.nsfFee} NSF fee`
                            : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function groupByMonth(payments: Payment[]) {
  const groups: Map<string, { payments: Payment[]; total: number }> =
    new Map();

  for (const payment of payments) {
    const month = format(parseISO(payment.paymentDate), "MMMM yyyy");
    const existing = groups.get(month);
    if (existing) {
      existing.payments.push(payment);
      if (payment.status === "completed") {
        existing.total += payment.amount;
      }
    } else {
      groups.set(month, {
        payments: [payment],
        total: payment.status === "completed" ? payment.amount : 0,
      });
    }
  }

  return Array.from(groups.entries()).map(([month, data]) => ({
    month,
    ...data,
  }));
}

export function PaymentHistoryListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="border border-border rounded-lg overflow-hidden bg-background divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
