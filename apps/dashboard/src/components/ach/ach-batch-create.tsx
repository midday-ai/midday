"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  onComplete: (batchId: string) => void;
  onCancel: () => void;
};

export function AchBatchCreate({ onComplete, onCancel }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("PAYMENT");
  const [selectedDealIds, setSelectedDealIds] = useState<string[]>([]);

  // Step 1: Load upcoming payments (active deals with expected collections)
  const { data: upcomingData } = useSuspenseQuery(
    trpc.achBatches.getUpcomingPayments.queryOptions({
      effectiveDate,
    }),
  );

  const upcomingPayments = upcomingData?.data ?? [];

  const toggleDeal = (dealId: string) => {
    setSelectedDealIds((prev) =>
      prev.includes(dealId)
        ? prev.filter((id) => id !== dealId)
        : [...prev, dealId],
    );
  };

  const toggleAll = () => {
    if (selectedDealIds.length === upcomingPayments.length) {
      setSelectedDealIds([]);
    } else {
      setSelectedDealIds(upcomingPayments.map((p) => p.dealId));
    }
  };

  const selectedPayments = upcomingPayments.filter((p) =>
    selectedDealIds.includes(p.dealId),
  );
  const totalAmount = selectedPayments.reduce(
    (sum, p) => sum + p.dailyPayment,
    0,
  );

  const createMutation = useMutation(
    trpc.achBatches.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.achBatches.getAll.queryKey(),
        });
        toast({
          title: "ACH batch created",
          description: `Batch ${result.batchNumber} with ${selectedDealIds.length} items`,
          variant: "success",
        });
        onComplete(result.id);
      },
    }),
  );

  const validateMutation = useMutation(
    trpc.achBatches.validate.mutationOptions({
      onSuccess: (result) => {
        if (result.errors?.length > 0) {
          toast({
            title: "Validation issues found",
            description: `${result.errors.length} issue(s) — review before submitting`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Validation passed",
            variant: "success",
          });
          setStep(3);
        }
      },
    }),
  );

  const handleCreate = () => {
    createMutation.mutate({
      effectiveDate,
      description,
      dealIds: selectedDealIds,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Create ACH Batch</h2>
          <p className="text-sm text-muted-foreground">
            Step {step} of 3 — {step === 1 ? "Select Payments" : step === 2 ? "Review Items" : "Confirm & Generate"}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? "bg-primary" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 10))}
                maxLength={10}
                placeholder="PAYMENT"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={selectedDealIds.length === upcomingPayments.length && upcomingPayments.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Deal Code</TableHead>
                <TableHead>Daily Payment</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Account (last 4)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingPayments.map((p) => (
                <TableRow key={p.dealId}>
                  <TableCell>
                    <Checkbox
                      checked={selectedDealIds.includes(p.dealId)}
                      onCheckedChange={() => toggleDeal(p.dealId)}
                    />
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {p.merchantName}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {p.dealCode}
                  </TableCell>
                  <TableCell className="text-sm font-mono tabular-nums">
                    ${p.dailyPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {p.paymentFrequency || "daily"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.accountLast4 ? `****${p.accountLast4}` : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {upcomingPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                    No active deals with upcoming payments for this date
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-medium">{selectedDealIds.length} items</span>
              <span className="text-muted-foreground ml-4">Total: </span>
              <span className="font-mono font-medium">
                ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Button
              disabled={selectedDealIds.length === 0}
              onClick={() => setStep(2)}
            >
              Next: Review
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg border p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Effective Date: </span>
                <span className="font-medium">{effectiveDate}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Items: </span>
                <span className="font-medium">{selectedPayments.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total: </span>
                <span className="font-mono font-medium">
                  ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Deal Code</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedPayments.map((p) => (
                <TableRow key={p.dealId}>
                  <TableCell className="text-sm">{p.merchantName}</TableCell>
                  <TableCell className="text-sm font-mono">{p.dealCode}</TableCell>
                  <TableCell className="text-sm font-mono tabular-nums">
                    ${p.dailyPayment.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">&#9989;</div>
          <h3 className="text-lg font-medium">Batch Created Successfully</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You can now validate and generate the NACHA file.
          </p>
        </div>
      )}
    </div>
  );
}
