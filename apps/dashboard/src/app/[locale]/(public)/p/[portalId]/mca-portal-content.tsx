"use client";

import { BrandThemeProvider } from "@/components/brand-theme-provider";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Spinner } from "@midday/ui/spinner";
import { formatAmount } from "@midday/utils/format";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Image from "next/image";
import { useState } from "react";

type Props = {
  portalId: string;
};

type DealStatus = "active" | "paid_off" | "defaulted" | "paused" | "late" | "in_collections";

const statusColors: Record<DealStatus, string> = {
  active: "bg-green-100 text-green-800",
  paid_off: "bg-blue-100 text-blue-800",
  defaulted: "bg-red-100 text-red-800",
  paused: "bg-yellow-100 text-yellow-800",
  late: "bg-orange-100 text-orange-800",
  in_collections: "bg-red-100 text-red-800",
};

const statusLabels: Record<DealStatus, string> = {
  active: "Active",
  paid_off: "Paid Off",
  defaulted: "Default",
  paused: "Paused",
  late: "Late",
  in_collections: "Collections",
};

function DealStatusBadge({ status }: { status: DealStatus | null }) {
  const safeStatus = (status || "active") as DealStatus;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[safeStatus] || statusColors.active}`}
    >
      {statusLabels[safeStatus] || "Active"}
    </span>
  );
}

export function McaPortalContent({ portalId }: Props) {
  const trpc = useTRPC();
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);

  // Fetch portal data including MCA deals
  const { data: portalData } = useSuspenseQuery(
    trpc.merchantPortal.getPortalData.queryOptions({ portalId }),
  );

  if (!portalData) {
    return (
      <div className="min-h-screen dotted-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-2">Portal Not Found</h1>
          <p className="text-[#606060]">This portal link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  const { customer, deals, summary } = portalData;

  const handleRequestPayoff = async () => {
    setShowVerificationForm(true);
  };

  const handleVerifyEmail = async () => {
    if (!verificationEmail) return;
    setIsVerifying(true);
    // TODO: Call verification API
    // For now, just show a message
    setTimeout(() => {
      setIsVerifying(false);
      alert("Verification email sent! Check your inbox.");
    }, 1000);
  };

  const toggleDealExpansion = (dealId: string) => {
    setExpandedDealId(expandedDealId === dealId ? null : dealId);
  };

  // Calculate paid percentage for summary
  const paidPercentage = summary && summary.totalPayback > 0
    ? Math.round((summary.totalPaid / summary.totalPayback) * 100)
    : 0;

  return (
    <BrandThemeProvider branding={customer.team?.branding as any}>
      <div className="min-h-screen dotted-bg">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10">
            {customer.team?.logoUrl && (
              <div className="mb-6">
                <Image
                  src={customer.team.logoUrl}
                  alt={customer.team.name || "Company logo"}
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl font-serif tracking-tight">
              {customer.name}
            </h1>
            {customer.team?.name && (
              <p className="text-sm text-[#606060] mt-1">{customer.team.name}</p>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            <div className="bg-background border border-border px-4 py-3">
              <div className="text-[12px] text-[#606060] mb-2">Total Outstanding</div>
              <div className="text-[18px] font-medium">
                {formatAmount({
                  amount: summary?.totalOutstanding || 0,
                  currency: "USD",
                })}
              </div>
            </div>
            <div className="bg-background border border-border px-4 py-3">
              <div className="text-[12px] text-[#606060] mb-2">Total Paid</div>
              <div className="text-[18px] font-medium">
                {formatAmount({
                  amount: summary?.totalPaid || 0,
                  currency: "USD",
                })}
              </div>
            </div>
            <div className="bg-background border border-border px-4 py-3">
              <div className="text-[12px] text-[#606060] mb-2">Paid %</div>
              <div className="text-[18px] font-medium">{paidPercentage}%</div>
            </div>
            <div className="bg-background border border-border px-4 py-3">
              <div className="text-[12px] text-[#606060] mb-2">Active Deals</div>
              <div className="text-[18px] font-medium">
                {deals.filter((d) => d.status === "active").length}
              </div>
            </div>
          </div>

          {/* MCA Deals Section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[16px] font-medium">Your MCA Deals</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestPayoff}
              className="text-xs"
            >
              Request Payoff Letter
            </Button>
          </div>

          {/* Verification Form (shown when requesting payoff) */}
          {showVerificationForm && (
            <div className="bg-background border border-border p-4 mb-6">
              <p className="text-sm mb-3">
                To request a payoff letter, please verify your email address:
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={verificationEmail}
                  onChange={(e) => setVerificationEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-3 py-2 text-sm border border-border rounded"
                />
                <Button
                  onClick={handleVerifyEmail}
                  disabled={isVerifying || !verificationEmail}
                >
                  {isVerifying ? (
                    <Spinner size={16} className="mr-2" />
                  ) : null}
                  Verify
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationForm(false)}
                className="text-xs text-[#606060] mt-2 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Deals Table */}
          {deals.length > 0 ? (
            <div className="bg-background border border-border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_100px_100px_100px_80px_32px] gap-2 px-3 py-3 bg-muted/50 border-b border-border text-[12px] font-medium text-[#606060] items-center">
                <div>Deal</div>
                <div className="text-right">Funded</div>
                <div className="text-right">Balance</div>
                <div className="text-right">Paid %</div>
                <div className="text-center">Status</div>
                <div />
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {deals.map((deal) => (
                  <div key={deal.id}>
                    {/* Deal Row */}
                    <div
                      className="grid grid-cols-[1fr_100px_100px_100px_80px_32px] gap-2 px-3 py-3 hover:bg-muted/50 transition-colors group items-center cursor-pointer"
                      onClick={() => toggleDealExpansion(deal.id)}
                    >
                      <div>
                        <div className="text-[13px] font-medium">{deal.dealCode}</div>
                        {deal.fundedAt && (
                          <div className="text-[11px] text-[#606060]">
                            Funded{" "}
                            {format(
                              new TZDate(deal.fundedAt, "UTC"),
                              "MMM d, yyyy",
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-[12px] text-right">
                        {formatAmount({
                          amount: deal.fundingAmount,
                          currency: "USD",
                        })}
                      </div>
                      <div className="text-[12px] text-right font-medium">
                        {formatAmount({
                          amount: deal.currentBalance,
                          currency: "USD",
                        })}
                      </div>
                      <div className="text-[12px] text-right">
                        {deal.paidPercentage || 0}%
                      </div>
                      <div className="text-center">
                        <DealStatusBadge status={deal.status as DealStatus} />
                      </div>
                      <div className="flex items-center justify-center">
                        <Icons.ChevronDown
                          className={`h-4 w-4 text-[#606060] transition-transform ${
                            expandedDealId === deal.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Deal Details */}
                    {expandedDealId === deal.id && (
                      <div className="px-4 py-4 bg-muted/30 border-t border-border">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-[#606060] text-[11px] mb-1">
                              Factor Rate
                            </div>
                            <div className="font-medium">{deal.factorRate}x</div>
                          </div>
                          <div>
                            <div className="text-[#606060] text-[11px] mb-1">
                              Payback Amount
                            </div>
                            <div className="font-medium">
                              {formatAmount({
                                amount: deal.paybackAmount,
                                currency: "USD",
                              })}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#606060] text-[11px] mb-1">
                              Daily Payment
                            </div>
                            <div className="font-medium">
                              {deal.dailyPayment
                                ? formatAmount({
                                    amount: deal.dailyPayment,
                                    currency: "USD",
                                  })
                                : "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-[#606060] text-[11px] mb-1">
                              Total Paid
                            </div>
                            <div className="font-medium">
                              {formatAmount({
                                amount: deal.totalPaid || 0,
                                currency: "USD",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* NSF Warning */}
                        {deal.nsfCount && deal.nsfCount > 0 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <Icons.AlertCircle className="inline h-3 w-3 mr-1" />
                            {deal.nsfCount} NSF payment(s) recorded
                          </div>
                        )}

                        {/* View Payments Button - TODO: Implement payment history view */}
                        <div className="mt-4">
                          <Button variant="outline" size="sm" className="text-xs">
                            View Payment History
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-background border border-border py-16 text-center">
              <p className="text-[#606060]">No MCA deals yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 right-4 hidden md:block">
          <a
            href="https://abacuslabs.co?utm_source=merchant-portal"
            target="_blank"
            rel="noreferrer"
            className="text-[9px] text-[#878787]"
          >
            Powered by <span className="text-primary">abacus</span>
          </a>
        </div>
      </div>
    </BrandThemeProvider>
  );
}
