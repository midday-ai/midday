"use client";

import { Card, CardContent } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Skeleton } from "@midday/ui/skeleton";
import { formatAmount } from "@midday/utils/format";
import { format, parseISO } from "date-fns";
import { useState } from "react";

export type DealForCard = {
  id: string;
  dealCode: string;
  fundingAmount: number;
  factorRate: number;
  paybackAmount: number;
  dailyPayment: number | null;
  paymentFrequency: string | null;
  status: string | null;
  fundedAt: string | null;
  expectedPayoffDate: string | null;
  currentBalance: number;
  totalPaid: number | null;
  nsfCount: number | null;
  holdbackPercentage: number | null;
  startDate: string | null;
  maturityDate: string | null;
};

type Props = {
  deal: DealForCard;
};

export function DealCard({ deal }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const costOfFunding = deal.paybackAmount - deal.fundingAmount;

  const frequencyLabel =
    deal.paymentFrequency === "weekly"
      ? "Every week"
      : deal.paymentFrequency === "monthly"
        ? "Every month"
        : "Every business day";

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Plain English deal breakdown */}
        <div className="space-y-4">
          <DetailRow
            label="Amount You Received"
            value={formatAmount({
              amount: deal.fundingAmount,
              currency: "USD",
            })}
          />
          <DetailRow
            label="Total You Pay Back"
            value={formatAmount({
              amount: deal.paybackAmount,
              currency: "USD",
            })}
          />
          <DetailRow
            label="Cost of Funding"
            value={formatAmount({ amount: costOfFunding, currency: "USD" })}
            muted
          />
          {deal.dailyPayment && (
            <DetailRow
              label={
                deal.paymentFrequency === "weekly"
                  ? "Weekly Payment"
                  : deal.paymentFrequency === "monthly"
                    ? "Monthly Payment"
                    : "Daily Payment"
              }
              value={formatAmount({
                amount: deal.dailyPayment,
                currency: "USD",
              })}
            />
          )}
          <DetailRow label="Payment Frequency" value={frequencyLabel} />
          {deal.fundedAt && (
            <DetailRow
              label="Started"
              value={format(parseISO(deal.fundedAt), "MMMM d, yyyy")}
            />
          )}
          {deal.expectedPayoffDate && (
            <DetailRow
              label="Expected Payoff"
              value={format(
                parseISO(deal.expectedPayoffDate),
                "MMMM d, yyyy",
              )}
            />
          )}
        </div>

        {/* Remaining balance summary */}
        <div className="p-4 bg-muted/50 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Remaining Balance
            </span>
            <span className="text-lg font-bold font-mono">
              {formatAmount({
                amount: deal.currentBalance,
                currency: "USD",
              })}
            </span>
          </div>
          {deal.totalPaid != null && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Total Paid</span>
              <span className="text-sm font-mono text-muted-foreground">
                {formatAmount({
                  amount: deal.totalPaid,
                  currency: "USD",
                })}
              </span>
            </div>
          )}
        </div>

        {/* NSF warning */}
        {deal.nsfCount != null && deal.nsfCount > 0 && (
          <div className="p-3 bg-[#FF3638]/10 border border-[#FF3638]/20 rounded-lg text-sm text-[#FF3638] flex items-start gap-2">
            <Icons.AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {deal.nsfCount} returned payment
              {deal.nsfCount > 1 ? "s" : ""} on record
            </span>
          </div>
        )}

        {/* Advanced details toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-primary hover:underline min-h-[44px]"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Details
          <Icons.ChevronDown
            className={`h-4 w-4 transition-transform ${
              showAdvanced ? "rotate-180" : ""
            }`}
          />
        </button>

        {showAdvanced && (
          <div className="space-y-3 p-4 border border-border bg-muted/30">
            <DetailRow
              label="Factor Rate"
              value={`${deal.factorRate}x`}
            />
            {deal.holdbackPercentage != null && (
              <DetailRow
                label="Holdback Percentage"
                value={`${deal.holdbackPercentage}%`}
              />
            )}
            <DetailRow label="Deal Code" value={deal.dealCode} />
            {deal.startDate && (
              <DetailRow
                label="Contract Start Date"
                value={format(parseISO(deal.startDate), "MMMM d, yyyy")}
              />
            )}
            {deal.maturityDate && (
              <DetailRow
                label="Contract Maturity Date"
                value={format(parseISO(deal.maturityDate), "MMMM d, yyyy")}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${muted ? "text-muted-foreground" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function DealCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
