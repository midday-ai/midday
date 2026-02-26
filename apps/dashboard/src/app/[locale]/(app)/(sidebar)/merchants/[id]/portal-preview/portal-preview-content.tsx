"use client";

import { BrandThemeProvider } from "@/components/brand-theme-provider";
import {
  DealStatusBadge,
  type DealStatus,
} from "@/components/deal-status-badge";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { formatAmount } from "@midday/utils/format";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type McaDeal = {
  id: string;
  dealCode: string;
  fundingAmount: number;
  factorRate: number;
  paybackAmount: number;
  dailyPayment: number | null;
  status: DealStatus | null;
  fundedAt: string | null;
  currentBalance: number;
  totalPaid: number | null;
  nsfCount: number | null;
  paidPercentage: number | null;
};

type McaData = {
  merchant: {
    id: string;
    name: string;
    email: string;
    teamId: string;
    team?: {
      name: string | null;
      logoUrl: string | null;
      branding: any;
    } | null;
  };
  deals: McaDeal[];
  summary: {
    totalDeals: number;
    totalFunded: number;
    totalPayback: number;
    totalPaid: number;
    totalOutstanding: number;
  };
};

type Merchant = {
  id: string;
  name: string;
  email: string;
  portalId?: string | null;
  portalEnabled?: boolean | null;
};

type Props = {
  merchant: Merchant;
  portalId: string;
  mcaData: McaData | null;
};

export function PortalPreviewContent({ merchant, portalId, mcaData }: Props) {
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const toggleDealExpansion = (dealId: string) => {
    setExpandedDealId(expandedDealId === dealId ? null : dealId);
  };

  const hasMcaDeals = mcaData && mcaData.deals && mcaData.deals.length > 0;
  const summary = mcaData?.summary;
  const deals = mcaData?.deals || [];
  const team = mcaData?.merchant?.team;

  const paidPercentage = summary && summary.totalPayback > 0
    ? Math.round((summary.totalPaid / summary.totalPayback) * 100)
    : 0;

  return (
    <BrandThemeProvider branding={team?.branding}>
      <div className="min-h-screen">
        {/* Admin Preview Banner */}
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Eye className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Admin Preview Mode
              </span>
              <span className="text-sm text-yellow-600">
                - This is how {merchant.name} sees their portal
              </span>
            </div>
            <Link href="/merchants">
              <Button variant="outline" size="sm">
                <Icons.ArrowLeft className="h-4 w-4 mr-1" />
                Back to Merchants
              </Button>
            </Link>
          </div>
        </div>

        {/* Portal Content */}
        <div className="dotted-bg">
          <div className="max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-10">
              {team?.logoUrl && (
                <div className="mb-6">
                  <Image
                    src={team.logoUrl}
                    alt={team.name || "Company logo"}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-serif tracking-tight">
                {merchant.name}
              </h1>
              {team?.name && (
                <p className="text-sm text-[#606060] mt-1">{team.name}</p>
              )}
            </div>

            {/* Content depends on whether we have MCA data */}
            {hasMcaDeals ? (
              <>
                {/* MCA Summary Cards */}
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
                  <h2 className="text-[16px] font-medium">MCA Deals</h2>
                  <Button variant="outline" size="sm" disabled className="text-xs opacity-50">
                    Request Payoff Letter
                  </Button>
                </div>

                {/* Deals Table */}
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
                            <DealStatusBadge status={deal.status} />
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
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-background border border-border py-16 text-center">
                <Icons.AlertCircle className="h-8 w-8 mx-auto text-[#606060] mb-4" />
                <p className="text-[#606060] mb-2">No MCA deals found</p>
                <p className="text-sm text-[#878787]">
                  This merchant has portal access enabled but no MCA deals yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-4 right-4 hidden md:block">
          <span className="text-[9px] text-[#878787]">
            Powered by <span className="text-primary">Abacus</span>
          </span>
        </div>
      </div>
    </BrandThemeProvider>
  );
}
