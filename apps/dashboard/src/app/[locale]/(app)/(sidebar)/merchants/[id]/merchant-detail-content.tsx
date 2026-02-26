"use client";

import {
  DealStatusBadge,
  type DealStatus,
} from "@/components/deal-status-badge";
import { FormatAmount } from "@/components/format-amount";
import { RiskBadge } from "@/components/risk-badge";
import { RiskScoreCard } from "@/components/risk-score-card";
import { useTRPC } from "@/trpc/client";
import { getWebsiteLogo } from "@/utils/logos";
import { TZDate } from "@date-fns/tz";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MerchantCollectionsSection } from "@/components/collections/merchant-collections-section";
import { PaymentLedgerSheet } from "./payment-ledger-sheet";

type Merchant = {
  id: string;
  name: string | null;
  email: string;
  website: string | null;
  portalEnabled: boolean | null;
  portalId: string | null;
};

type Props = {
  merchantId: string;
  merchant: Merchant;
};

export function MerchantDetailContent({ merchantId, merchant }: Props) {
  const trpc = useTRPC();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealCode, setSelectedDealCode] = useState<string | null>(null);

  const { data: deals } = useQuery(
    trpc.merchants.getMcaDeals.queryOptions({ merchantId }),
  );

  const { data: stats } = useQuery(
    trpc.merchants.getMcaDealStats.queryOptions({ merchantId }),
  );

  const dealIds = deals?.map((d) => d.id) ?? [];
  const { data: riskScores } = useQuery(
    trpc.risk.getScores.queryOptions({ dealIds }),
  );
  const riskScoreMap = new Map(
    (riskScores ?? []).map((s) => [s.dealId, s]),
  );

  const collectionRate =
    stats && stats.totalPayback > 0
      ? Math.round((stats.totalPaid / stats.totalPayback) * 100)
      : 0;

  const logoSrc = merchant.website ? getWebsiteLogo(merchant.website) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/merchants"
          className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors mb-4"
        >
          <Icons.ArrowBack className="size-4" />
          Back to Merchants
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              {logoSrc && (
                <Image
                  src={logoSrc}
                  alt={merchant.name || ""}
                  width={40}
                  height={40}
                  className="object-contain"
                />
              )}
              <AvatarFallback className="text-lg">
                {merchant.name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-serif tracking-tight">
                {merchant.name}
              </h1>
              <p className="text-sm text-[#606060]">{merchant.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/merchants/${merchantId}/deals/new`}>
              <Button variant="outline" size="sm">
                <Icons.Add className="size-4 mr-1" />
                New Deal
              </Button>
            </Link>
            {merchant.portalEnabled && merchant.portalId && (
              <Link href={`/merchants/${merchantId}/portal-preview`}>
                <Button variant="outline" size="sm">
                  <Icons.Visibility className="size-4 mr-1" />
                  Portal Preview
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Active Deals</div>
          <div className="text-[18px] font-medium">
            {stats?.activeDeals ?? 0}
          </div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">
            Total Outstanding
          </div>
          <div className="text-[18px] font-medium">
            <FormatAmount
              amount={stats?.totalOutstanding ?? 0}
              currency="USD"
            />
          </div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Total Repaid</div>
          <div className="text-[18px] font-medium">
            <FormatAmount amount={stats?.totalPaid ?? 0} currency="USD" />
          </div>
        </div>
        <div className="bg-background border border-border px-4 py-3">
          <div className="text-[12px] text-[#606060] mb-2">Collection Rate</div>
          <div className="text-[18px] font-medium">{collectionRate}%</div>
        </div>
      </div>

      {/* Deals Table */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-medium">MCA Deals</h2>
          <span className="text-xs text-[#606060]">
            {stats?.totalDeals ?? 0} total deals
          </span>
        </div>

        {deals && deals.length > 0 ? (
          <div className="bg-background border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[12px] font-medium text-[#606060]">
                    Deal
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Funded
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Payback
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Paid %
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-right">
                    Daily
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                    NSFs
                  </TableHead>
                  <TableHead className="text-[12px] font-medium text-[#606060] text-center">
                    Risk
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedDealId(deal.id);
                      setSelectedDealCode(deal.dealCode);
                    }}
                  >
                    <TableCell>
                      <div>
                        <div className="text-[13px] font-medium">
                          {deal.dealCode}
                        </div>
                        {deal.fundedAt && (
                          <div className="text-[11px] text-[#606060]">
                            {format(
                              new TZDate(deal.fundedAt, "UTC"),
                              "MMM d, yyyy",
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <DealStatusBadge
                        status={deal.status as DealStatus | null}
                      />
                    </TableCell>
                    <TableCell className="text-[12px] text-right">
                      <FormatAmount
                        amount={deal.fundingAmount}
                        currency="USD"
                      />
                    </TableCell>
                    <TableCell className="text-[12px] text-right">
                      <FormatAmount
                        amount={deal.paybackAmount}
                        currency="USD"
                      />
                    </TableCell>
                    <TableCell className="text-[12px] text-right font-medium">
                      <FormatAmount
                        amount={deal.currentBalance}
                        currency="USD"
                      />
                    </TableCell>
                    <TableCell className="text-[12px] text-right">
                      {deal.paidPercentage ?? 0}%
                    </TableCell>
                    <TableCell className="text-[12px] text-right">
                      {deal.dailyPayment ? (
                        <FormatAmount
                          amount={deal.dailyPayment}
                          currency="USD"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {deal.nsfCount && deal.nsfCount > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {deal.nsfCount}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#878787]">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {riskScoreMap.get(deal.id) ? (
                        <RiskBadge
                          score={riskScoreMap.get(deal.id)!.overallScore}
                          band={
                            riskScoreMap.get(deal.id)!.band as
                              | "low"
                              | "medium"
                              | "high"
                          }
                          previousScore={
                            riskScoreMap.get(deal.id)!.previousScore
                          }
                          compact
                        />
                      ) : (
                        <span className="text-[12px] text-[#878787]">
                          &mdash;
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-background border border-border py-16 text-center">
            <Icons.AlertCircle className="h-8 w-8 mx-auto text-[#606060] mb-4" />
            <p className="text-[#606060] mb-2">No MCA deals found</p>
            <p className="text-sm text-[#878787]">
              This merchant has no MCA deals on record.
            </p>
          </div>
        )}
      </div>

      {/* Collections Cases */}
      <MerchantCollectionsSection merchantId={merchantId} />

      {/* Risk Score for selected deal */}
      {selectedDealId && <RiskScoreCard dealId={selectedDealId} />}

      {/* Payment Ledger Sheet */}
      <PaymentLedgerSheet
        dealId={selectedDealId}
        dealCode={selectedDealCode}
        deal={deals?.find((d) => d.id === selectedDealId) ?? null}
        onClose={() => {
          setSelectedDealId(null);
          setSelectedDealCode(null);
        }}
      />
    </div>
  );
}
