"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { toast } from "@midday/ui/use-toast";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

const WIZARD_STEPS = [
  {
    id: "review",
    title: "Review Auto-Matches",
    description: "Confirm or reject auto-matched transactions",
  },
  {
    id: "discrepancies",
    title: "Fix Discrepancies",
    description: "Resolve unmatched transactions one by one",
  },
  {
    id: "ach",
    title: "Generate ACH Batch",
    description: "Create today's payment collection file",
  },
  {
    id: "export",
    title: "Export Report",
    description: "Generate daily reconciliation report",
  },
  {
    id: "done",
    title: "Done",
    description: "Review your session summary",
  },
] as const;

type WizardStep = (typeof WIZARD_STEPS)[number]["id"];

export function WizardMode() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("review");
  const [startTime] = useState(Date.now());

  const { data: stats } = useSuspenseQuery(
    trpc.reconciliation.getStats.queryOptions(),
  );

  const bulkConfirmMutation = useMutation(
    trpc.reconciliation.bulkConfirmMatches.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.reconciliation.getStats.queryKey(),
        });
        toast({
          title: `${result.confirmed} matches confirmed`,
          variant: "success",
        });
        setCurrentStep("discrepancies");
      },
    }),
  );

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === currentStep);
  const progress = ((stepIndex + 1) / WIZARD_STEPS.length) * 100;

  const elapsedMinutes = Math.round((Date.now() - startTime) / 60000);

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Step {stepIndex + 1} of {WIZARD_STEPS.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {elapsedMinutes}m elapsed
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {WIZARD_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                "text-xs",
                idx <= stepIndex
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white dark:bg-gray-950 border rounded-lg p-6">
        {currentStep === "review" && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">&#9989;</div>
            <h3 className="text-xl font-semibold">
              {stats?.autoMatched ?? 0} Auto-Matched Transactions
            </h3>
            <p className="text-muted-foreground">
              The matching engine has automatically reconciled these
              transactions with high confidence ({">"}90%). Review and confirm
              them all at once.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/reconciliation?tab=feed")}
              >
                Review Individually
              </Button>
              <Button
                onClick={() => bulkConfirmMutation.mutate({})}
                disabled={bulkConfirmMutation.isPending}
              >
                {bulkConfirmMutation.isPending
                  ? "Confirming..."
                  : `Confirm All ${stats?.autoMatched ?? 0}`}
              </Button>
            </div>
          </div>
        )}

        {currentStep === "discrepancies" && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">&#128270;</div>
            <h3 className="text-xl font-semibold">
              {stats?.unmatched ?? 0} Unmatched Transactions
            </h3>
            <p className="text-muted-foreground">
              These transactions could not be auto-matched. Review each one
              and either match manually, flag for review, or exclude.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("ach")}
              >
                Skip for Now
              </Button>
              <Button
                onClick={() =>
                  router.push("/reconciliation?tab=discrepancies")
                }
              >
                Open Discrepancy Queue
              </Button>
            </div>
          </div>
        )}

        {currentStep === "ach" && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">&#127974;</div>
            <h3 className="text-xl font-semibold">Generate ACH Batch</h3>
            <p className="text-muted-foreground">
              Create today's NACHA file for payment collection from your
              active deals.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("export")}
              >
                Skip
              </Button>
              <Button
                onClick={() => router.push("/reconciliation/ach")}
              >
                Open ACH Generator
              </Button>
            </div>
          </div>
        )}

        {currentStep === "export" && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">&#128196;</div>
            <h3 className="text-xl font-semibold">Export Report</h3>
            <p className="text-muted-foreground">
              Generate your daily reconciliation report from your saved
              templates.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("done")}
              >
                Skip
              </Button>
              <Button
                onClick={() => router.push("/reconciliation/exports")}
              >
                Open Export Center
              </Button>
            </div>
          </div>
        )}

        {currentStep === "done" && (
          <div className="text-center space-y-4">
            <div className="text-5xl mb-2">&#127881;</div>
            <h3 className="text-xl font-semibold">All Done!</h3>
            <p className="text-muted-foreground">
              Today's reconciliation is complete. Here's your summary:
            </p>
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold tabular-nums text-emerald-600">
                  {stats?.autoMatched ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Auto-matched
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold tabular-nums text-blue-600">
                  {stats?.manualMatched ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Manual matches
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-2xl font-bold tabular-nums">
                  {elapsedMinutes}m
                </div>
                <div className="text-xs text-muted-foreground">
                  Time spent
                </div>
              </div>
            </div>
            <Button onClick={() => router.push("/reconciliation")}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
