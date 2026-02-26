"use client";

import {
  PaymentHistoryList,
  PaymentHistoryListSkeleton,
} from "@/components/portal/payment-history-list";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, use, useState } from "react";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "returned", label: "Returned" },
  { value: "pending", label: "Pending" },
];

export default function PaymentsPage({
  params,
}: {
  params: Promise<{ portalId: string }>;
}) {
  const { portalId } = use(params);

  return (
    <Suspense fallback={<PaymentHistoryListSkeleton />}>
      <PaymentsContent portalId={portalId} />
    </Suspense>
  );
}

function PaymentsContent({ portalId }: { portalId: string }) {
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-serif">Payment History</h1>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusFilters.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap min-h-[36px] transition-colors ${
              statusFilter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <PaymentHistoryList
        portalId={portalId}
        deals={portalData.deals}
        statusFilter={statusFilter}
      />
    </div>
  );
}
