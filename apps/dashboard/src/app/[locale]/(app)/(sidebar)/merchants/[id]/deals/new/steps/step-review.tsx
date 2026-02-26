"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useWizard } from "../wizard-context";

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  bi_weekly: "Bi-Weekly",
  monthly: "Monthly",
  variable: "Variable",
};

const uccLabels: Record<string, string> = {
  filed: "Filed",
  pending: "Pending",
  not_filed: "Not Filed",
};

function SectionHeader({
  title,
  onEdit,
}: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs text-[#878787] hover:text-primary flex items-center gap-1"
      >
        <Icons.Edit className="size-3" />
        Edit
      </button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-xs text-[#878787]">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

export function StepReview({ merchantId }: { merchantId: string }) {
  const { state, setStep, prevStep, reset } = useWizard();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.mcaDeals.createWithBankAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.mcaDeals.list.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.mcaDeals.stats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getMcaDeals.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.merchants.getMcaDealStats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getDeals.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getDealStats.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.brokers.getCommissions.queryKey(),
        });
        reset();
        router.push(`/merchants/${merchantId}`);
      },
    }),
  );

  const { merchant, bankAccount, dealTerms } = state;

  if (!merchant || !dealTerms) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#878787]">
          Please complete all previous steps first.
        </p>
      </div>
    );
  }

  const handleCreate = () => {
    const bankAccountInput =
      bankAccount && bankAccount.mode === "new"
        ? {
            mode: "new" as const,
            bankName: bankAccount.bankName,
            routingNumber: bankAccount.routingNumber,
            accountNumber: bankAccount.accountNumber,
            accountType: bankAccount.accountType,
          }
        : bankAccount && bankAccount.mode === "existing"
          ? {
              mode: "existing" as const,
              existingBankAccountId: bankAccount.existingBankAccountId,
            }
          : undefined;

    createMutation.mutate({
      merchantId: merchant.merchantId,
      dealCode: dealTerms.dealCode,
      fundingAmount: dealTerms.fundingAmount,
      factorRate: dealTerms.factorRate,
      paybackAmount: dealTerms.paybackAmount,
      dailyPayment: dealTerms.dailyPayment,
      paymentFrequency: dealTerms.paymentFrequency,
      fundedAt: dealTerms.fundedAt,
      expectedPayoffDate: dealTerms.expectedPayoffDate,
      brokerId: merchant.brokerId,
      commissionPercentage: merchant.commissionPercentage,
      startDate: dealTerms.startDate,
      maturityDate: dealTerms.maturityDate,
      firstPaymentDate: dealTerms.firstPaymentDate,
      holdbackPercentage: dealTerms.holdbackPercentage,
      uccFilingStatus: dealTerms.uccFilingStatus,
      personalGuarantee: dealTerms.personalGuarantee,
      defaultTerms: dealTerms.defaultTerms,
      curePeriodDays: dealTerms.curePeriodDays,
      bankAccount: bankAccountInput,
    });
  };

  const formatDate = (d?: string) =>
    d ? format(new Date(d), "MMM d, yyyy") : null;

  const formatCurrency = (n?: number) =>
    n != null
      ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : null;

  return (
    <div className="space-y-4">
      {/* Merchant */}
      <div className="border border-border p-4">
        <SectionHeader
          title="Merchant & Broker"
          onEdit={() => setStep("merchant")}
        />
        <div className="divide-y divide-border">
          <ReviewRow label="Merchant" value={merchant.merchantName} />
          {merchant.brokerId && (
            <ReviewRow
              label="Commission"
              value={
                merchant.commissionPercentage != null
                  ? `${merchant.commissionPercentage}%`
                  : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Bank Account */}
      <div className="border border-border p-4">
        <SectionHeader
          title="Bank Account"
          onEdit={() => setStep("bank-account")}
        />
        <div className="divide-y divide-border">
          {bankAccount?.mode === "new" && (
            <>
              <ReviewRow label="Bank Name" value={bankAccount.bankName} />
              <ReviewRow
                label="Routing"
                value={`****${bankAccount.routingNumber.slice(-4)}`}
              />
              <ReviewRow
                label="Account"
                value={`****${bankAccount.accountNumber.slice(-4)}`}
              />
              <ReviewRow
                label="Type"
                value={
                  bankAccount.accountType === "checking"
                    ? "Checking"
                    : "Savings"
                }
              />
            </>
          )}
          {bankAccount?.mode === "existing" && (
            <ReviewRow label="Linked Account" value="Existing team account" />
          )}
          {(!bankAccount || bankAccount.mode === "skip") && (
            <ReviewRow label="Status" value="Skipped" />
          )}
        </div>
      </div>

      {/* Deal Terms */}
      <div className="border border-border p-4">
        <SectionHeader
          title="Deal Terms"
          onEdit={() => setStep("deal-terms")}
        />
        <div className="divide-y divide-border">
          <ReviewRow label="Deal Code" value={dealTerms.dealCode} />
          <ReviewRow
            label="Funding"
            value={formatCurrency(dealTerms.fundingAmount)}
          />
          <ReviewRow label="Factor Rate" value={String(dealTerms.factorRate)} />
          <ReviewRow
            label="Payback"
            value={formatCurrency(dealTerms.paybackAmount)}
          />
          <ReviewRow
            label="Payment"
            value={
              dealTerms.dailyPayment
                ? `${formatCurrency(dealTerms.dailyPayment)} ${frequencyLabels[dealTerms.paymentFrequency] || dealTerms.paymentFrequency}`
                : null
            }
          />
          <ReviewRow label="Funded" value={formatDate(dealTerms.fundedAt)} />
          <ReviewRow
            label="Start Date"
            value={formatDate(dealTerms.startDate)}
          />
          <ReviewRow
            label="First Payment"
            value={formatDate(dealTerms.firstPaymentDate)}
          />
          <ReviewRow
            label="Maturity"
            value={formatDate(dealTerms.maturityDate)}
          />
          <ReviewRow
            label="Expected Payoff"
            value={formatDate(dealTerms.expectedPayoffDate)}
          />
          <ReviewRow
            label="Holdback"
            value={
              dealTerms.holdbackPercentage != null
                ? `${dealTerms.holdbackPercentage}%`
                : null
            }
          />
          <ReviewRow
            label="UCC Filing"
            value={
              dealTerms.uccFilingStatus
                ? uccLabels[dealTerms.uccFilingStatus]
                : null
            }
          />
          <ReviewRow
            label="Personal Guarantee"
            value={dealTerms.personalGuarantee ? "Yes" : null}
          />
          <ReviewRow
            label="Cure Period"
            value={
              dealTerms.curePeriodDays
                ? `${dealTerms.curePeriodDays} days`
                : null
            }
          />
          {dealTerms.defaultTerms && (
            <div className="py-1.5">
              <span className="text-xs text-[#878787] block mb-1">
                Default Terms
              </span>
              <p className="text-sm whitespace-pre-wrap">
                {dealTerms.defaultTerms}
              </p>
            </div>
          )}
        </div>
      </div>

      {createMutation.isError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {createMutation.error?.message || "Failed to create deal. Please try again."}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={prevStep}>
          Back
        </Button>
        <SubmitButton
          isSubmitting={createMutation.isPending}
          disabled={createMutation.isPending}
          onClick={handleCreate}
        >
          Create Deal
        </SubmitButton>
      </div>
    </div>
  );
}
