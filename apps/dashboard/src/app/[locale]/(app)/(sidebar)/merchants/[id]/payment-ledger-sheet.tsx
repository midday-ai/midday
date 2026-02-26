"use client";

import {
  DealStatusBadge,
  type DealStatus,
} from "@/components/deal-status-badge";
import {
  DisclosureStatusBadge,
} from "@/components/disclosure-status-badge";
import { FormatAmount } from "@/components/format-amount";
import { useDisclosureParams } from "@/hooks/use-disclosure-params";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

type Deal = {
  id: string;
  dealCode: string;
  fundingAmount: number;
  factorRate: number;
  paybackAmount: number;
  dailyPayment: number | null;
  status: string | null;
  currentBalance: number;
  totalPaid: number | null;
  nsfCount: number | null;
  paidPercentage: number | null;
};

type Props = {
  dealId: string | null;
  dealCode: string | null;
  deal: Deal | null;
  onClose: () => void;
};

const paymentStatusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  returned: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

const paymentStatusLabels: Record<string, string> = {
  completed: "Cleared",
  pending: "Pending",
  returned: "Returned",
  failed: "Failed",
};

export function PaymentLedgerSheet({ dealId, dealCode, deal, onClose }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { open: openDisclosure } = useDisclosureParams();
  const isOpen = Boolean(dealId);

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    ...trpc.merchants.getMcaPayments.queryOptions({ dealId: dealId! }),
    enabled: Boolean(dealId),
  });

  const { data: paymentStats, isLoading: statsLoading } = useQuery({
    ...trpc.merchants.getMcaPaymentStats.queryOptions({ dealId: dealId! }),
    enabled: Boolean(dealId),
  });

  const { data: disclosures, isLoading: disclosuresLoading } = useQuery({
    ...trpc.disclosures.getByDeal.queryOptions({ dealId: dealId! }),
    enabled: Boolean(dealId),
  });

  const generateMutation = useMutation(
    trpc.disclosures.generate.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.disclosures.getByDeal.queryKey({ dealId: dealId! }),
        });
        toast({
          title: "Disclosure generation started",
          description: "The PDF will be available shortly.",
          duration: 3000,
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to generate disclosure",
          description: error.message,
          variant: "destructive",
          duration: 5000,
        });
      },
    }),
  );

  return (
    <Sheet open={isOpen} onOpenChange={() => onClose()}>
      <SheetContent
        style={{ maxWidth: 720 }}
        className="overflow-y-auto pb-8"
      >
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl font-serif">
              {dealCode || "Deal"}
            </SheetTitle>
            {deal && (
              <DealStatusBadge
                status={deal.status as DealStatus | null}
              />
            )}
          </div>
        </SheetHeader>

        {/* Deal Summary */}
        {deal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-muted/30 border border-border px-3 py-2">
              <div className="text-[11px] text-[#606060] mb-1">Funded</div>
              <div className="text-[14px] font-medium">
                <FormatAmount amount={deal.fundingAmount} currency="USD" />
              </div>
            </div>
            <div className="bg-muted/30 border border-border px-3 py-2">
              <div className="text-[11px] text-[#606060] mb-1">Payback</div>
              <div className="text-[14px] font-medium">
                <FormatAmount amount={deal.paybackAmount} currency="USD" />
              </div>
            </div>
            <div className="bg-muted/30 border border-border px-3 py-2">
              <div className="text-[11px] text-[#606060] mb-1">Balance</div>
              <div className="text-[14px] font-medium">
                <FormatAmount amount={deal.currentBalance} currency="USD" />
              </div>
            </div>
            <div className="bg-muted/30 border border-border px-3 py-2">
              <div className="text-[11px] text-[#606060] mb-1">Paid %</div>
              <div className="text-[14px] font-medium">
                {deal.paidPercentage ?? 0}%
              </div>
            </div>
          </div>
        )}

        {/* Payment Stats */}
        {statsLoading ? (
          <Skeleton className="h-12 mb-4" />
        ) : paymentStats ? (
          <div className="flex items-center gap-4 mb-4 text-xs text-[#606060]">
            <span>
              {paymentStats.totalPayments} total payments
            </span>
            <span className="text-[#878787]">|</span>
            <span className="text-green-700">
              {paymentStats.completedPayments} cleared
            </span>
            {paymentStats.returnedPayments > 0 && (
              <>
                <span className="text-[#878787]">|</span>
                <span className="text-red-700">
                  {paymentStats.returnedPayments} returned
                </span>
              </>
            )}
            {paymentStats.totalNsfFees > 0 && (
              <>
                <span className="text-[#878787]">|</span>
                <span className="text-red-700">
                  <FormatAmount
                    amount={paymentStats.totalNsfFees}
                    currency="USD"
                  />{" "}
                  in NSF fees
                </span>
              </>
            )}
          </div>
        ) : null}

        {/* NSF Warning */}
        {deal && deal.nsfCount != null && deal.nsfCount > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
            <Icons.AlertCircle className="size-4 shrink-0" />
            <span>
              {deal.nsfCount} NSF payment(s) recorded on this deal
            </span>
          </div>
        )}

        {/* Disclosures Section */}
        <div className="mb-6 border-b border-border pb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[14px] font-medium">Disclosures</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (dealId) {
                  generateMutation.mutate({ dealId });
                }
              }}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                "Generating..."
              ) : (
                <>
                  <Icons.Add className="size-3 mr-1" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {disclosuresLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : disclosures && disclosures.length > 0 ? (
            <div className="border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px] font-medium text-[#606060]">
                      State
                    </TableHead>
                    <TableHead className="text-[11px] font-medium text-[#606060]">
                      Version
                    </TableHead>
                    <TableHead className="text-[11px] font-medium text-[#606060] text-center">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-medium text-[#606060]">
                      Generated
                    </TableHead>
                    <TableHead className="text-[11px] font-medium text-[#606060] text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disclosures.map((disclosure) => (
                    <TableRow key={disclosure.id} className="text-[12px]">
                      <TableCell className="font-medium">
                        {disclosure.stateCode}
                      </TableCell>
                      <TableCell className="text-[#606060]">
                        {disclosure.templateVersion}
                      </TableCell>
                      <TableCell className="text-center">
                        <DisclosureStatusBadge status={disclosure.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {disclosure.generatedAt
                          ? format(
                              new TZDate(disclosure.generatedAt, "UTC"),
                              "MMM d, yyyy",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => openDisclosure(disclosure.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-6 text-center border border-border">
              <p className="text-xs text-[#606060]">
                No disclosures generated for this deal
              </p>
            </div>
          )}
        </div>

        {/* Payment Table */}
        <div className="text-[14px] font-medium mb-3">Payment History</div>

        {paymentsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : payments && payments.length > 0 ? (
          <div className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-[11px] font-medium text-[#606060]">
                    Date
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-[#606060]">
                    Description
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-[#606060] text-right">
                    Amount
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-[#606060] text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-[#606060] text-right">
                    Balance
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-[#606060] text-right">
                    NSF Fee
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="text-[12px]">
                    <TableCell className="whitespace-nowrap">
                      {payment.paymentDate
                        ? format(
                            new TZDate(payment.paymentDate, "UTC"),
                            "MMM d, yyyy",
                          )
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payment.description || "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        payment.status === "returned" || payment.status === "failed"
                          ? "text-red-600"
                          : "text-[#00C969]"
                      }`}
                    >
                      <FormatAmount
                        amount={payment.amount}
                        currency="USD"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                          paymentStatusColors[payment.status ?? ""] ||
                          paymentStatusColors.pending
                        }`}
                      >
                        {paymentStatusLabels[payment.status ?? ""] || payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.balanceAfter != null ? (
                        <FormatAmount
                          amount={payment.balanceAfter}
                          currency="USD"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.nsfFee != null && payment.nsfFee > 0 ? (
                        <span className="text-red-600 font-medium">
                          +<FormatAmount
                            amount={payment.nsfFee}
                            currency="USD"
                          />
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center border border-border">
            <Icons.AlertCircle className="h-6 w-6 mx-auto text-[#606060] mb-3" />
            <p className="text-sm text-[#606060]">No payments recorded</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
