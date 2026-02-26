"use client";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { SubmitButton } from "@midday/ui/submit-button";
import { Textarea } from "@midday/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUnderwritingWizard } from "../wizard-context";
import {
  RECOMMENDATION_STYLES,
  RECOMMENDATION_LABELS,
  CONFIDENCE_LABELS,
} from "../../constants";

type Props = {
  merchantId: string;
};

function ReviewRow({
  label,
  value,
}: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-xs text-[#878787]">{label}</span>
      <span className="text-sm">{String(value)}</span>
    </div>
  );
}

function formatCurrency(n?: number | null) {
  if (n == null) return null;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export function StepReview({ merchantId }: Props) {
  const { state, prevStep, reset } = useUnderwritingWizard();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const applicationId = state.applicationId;

  const [decision, setDecision] = useState<
    "approved" | "declined" | "review_needed" | null
  >(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decisionSaved, setDecisionSaved] = useState(false);

  // Fetch application data
  const { data: application } = useQuery(
    trpc.underwritingApplications.getById.queryOptions(
      { id: applicationId! },
      { enabled: !!applicationId },
    ),
  );

  // Fetch score
  const { data: score } = useQuery(
    trpc.underwritingApplications.getScore.queryOptions(
      { applicationId: applicationId! },
      { enabled: !!applicationId },
    ),
  );

  // Fetch documents
  const { data: documents } = useQuery(
    trpc.underwritingApplications.getDocuments.queryOptions(
      { applicationId: applicationId! },
      { enabled: !!applicationId },
    ),
  );

  const updateMutation = useMutation(
    trpc.underwritingApplications.update.mutationOptions({
      onSuccess: () => {
        setDecisionSaved(true);
        queryClient.invalidateQueries({
          queryKey:
            trpc.underwritingApplications.getById.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.underwritingApplications.getByMerchant.queryKey(),
        });
      },
    }),
  );

  const scoringMutation = useMutation(
    trpc.underwritingApplications.runScoring.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey:
            trpc.underwritingApplications.getScore.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.underwritingApplications.getById.queryKey(),
        });
      },
    }),
  );

  const handleDecision = (d: "approved" | "declined" | "review_needed") => {
    if (!applicationId) return;

    const statusMap = {
      approved: "approved" as const,
      declined: "declined" as const,
      review_needed: "review_needed" as const,
    };

    updateMutation.mutate({
      id: applicationId,
      status: statusMap[d],
      decision: d,
      decisionNotes: decisionNotes || undefined,
    });
    setDecision(d);
  };

  if (!applicationId || !state.profile) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#878787]">
          Please complete all previous steps first.
        </p>
      </div>
    );
  }

  const profile = state.profile;

  // buyBoxResults is stored as { criteria: [...], passCount, totalCount, allPassed }
  const buyBoxData = score?.buyBoxResults as
    | {
        criteria: Array<{
          name: string;
          passed: boolean;
          actualValue: string | number;
          requiredValue: string | number;
        }>;
        passCount: number;
        totalCount: number;
        allPassed: boolean;
      }
    | null;
  const buyBoxCriteria = buyBoxData?.criteria ?? null;

  // bankAnalysis is an array of monthly data
  const bankAnalysis = score?.bankAnalysis as
    | Array<{
        month: string;
        deposits: number;
        payBurden: number;
        holdbackPct: number;
      }>
    | null;

  // extractedMetrics is a summary object
  const extractedMetrics = score?.extractedMetrics as
    | {
        avgDailyBalance: number;
        monthlyAvgRevenue: number;
        nsfCount: number;
        depositConsistency: number;
        revenueVolatility: number;
      }
    | null;

  // riskFlags is an array of { flag, severity, description }
  const riskFlags = score?.riskFlags as
    | Array<{
        flag: string;
        severity: "high" | "medium" | "low";
        description: string;
      }>
    | null;

  return (
    <div className="space-y-6">
      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Merchant Dossier */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Merchant Dossier</h3>

          <div className="border border-border p-4">
            <h4 className="text-xs text-[#878787] font-medium mb-2">
              Profile
            </h4>
            <div className="divide-y divide-border">
              <ReviewRow label="Merchant" value={profile.merchantName} />
              <ReviewRow
                label="Requested Min"
                value={formatCurrency(profile.requestedAmountMin)}
              />
              <ReviewRow
                label="Requested Max"
                value={formatCurrency(profile.requestedAmountMax)}
              />
              <ReviewRow label="Use of Funds" value={profile.useOfFunds} />
              <ReviewRow label="FICO Range" value={profile.ficoRange} />
              <ReviewRow
                label="Time in Business"
                value={
                  profile.timeInBusinessMonths
                    ? `${profile.timeInBusinessMonths} months`
                    : null
                }
              />
            </div>
          </div>

          {profile.brokerNotes && (
            <div className="border border-border p-4">
              <h4 className="text-xs text-[#878787] font-medium mb-2">
                Broker Notes
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {profile.brokerNotes}
              </p>
            </div>
          )}

          {profile.priorMcaHistory && (
            <div className="border border-border p-4">
              <h4 className="text-xs text-[#878787] font-medium mb-2">
                Prior MCA History
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {profile.priorMcaHistory}
              </p>
            </div>
          )}

          {/* Documents Summary */}
          <div className="border border-border p-4">
            <h4 className="text-xs text-[#878787] font-medium mb-2">
              Documents ({documents?.length ?? 0})
            </h4>
            {documents && documents.length > 0 ? (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Icons.Check className="size-3.5 text-green-600" />
                    <span>{doc.fileName}</span>
                    {doc.waived && (
                      <Badge variant="outline" className="text-[10px]">
                        Waived
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#878787]">No documents uploaded.</p>
            )}
          </div>
        </div>

        {/* Right: Scorecard */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Scorecard</h3>

          {!score ? (
            <div className="border border-border p-6 text-center space-y-3">
              <Icons.Time className="size-8 text-[#878787] mx-auto mb-2" />
              <p className="text-sm text-[#878787]">
                Scoring not yet available.
              </p>
              <p className="text-xs text-[#878787]">
                Run the AI scoring engine to analyze this application.
              </p>
              {scoringMutation.isError && (
                <p className="text-xs text-red-600">
                  {scoringMutation.error?.message || "Scoring failed. Please try again."}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={scoringMutation.isPending}
                onClick={() => {
                  if (applicationId) {
                    scoringMutation.mutate({ applicationId });
                  }
                }}
              >
                {scoringMutation.isPending ? "Scoring..." : "Run AI Scoring"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recommendation */}
              <div className="border border-border p-4">
                <h4 className="text-xs text-[#878787] font-medium mb-2">
                  Recommendation
                </h4>
                <div className="flex items-center gap-3">
                  {score.recommendation && (
                    <Badge
                      className={
                        RECOMMENDATION_STYLES[score.recommendation] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {RECOMMENDATION_LABELS[score.recommendation] ||
                        score.recommendation}
                    </Badge>
                  )}
                  {score.confidence != null && (
                    <span className="text-sm font-mono text-[#878787]">
                      {CONFIDENCE_LABELS[score.confidence] || score.confidence} confidence
                    </span>
                  )}
                </div>
              </div>

              {/* Buy Box Results */}
              {buyBoxCriteria && buyBoxCriteria.length > 0 && (
                <div className="border border-border p-4">
                  <h4 className="text-xs text-[#878787] font-medium mb-2">
                    Buy Box Criteria
                  </h4>
                  <div className="space-y-1">
                    {buyBoxCriteria.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm"
                      >
                        {item.passed ? (
                          <Icons.Check className="size-3.5 text-green-600" />
                        ) : (
                          <Icons.Close className="size-3.5 text-red-600" />
                        )}
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank Analysis Summary */}
              {bankAnalysis && bankAnalysis.length > 0 && (
                <div className="border border-border p-4">
                  <h4 className="text-xs text-[#878787] font-medium mb-2">
                    Bank Analysis
                  </h4>
                  <div className="divide-y divide-border">
                    {bankAnalysis.map((month, i) => (
                      <div key={i} className="py-1.5 grid grid-cols-4 gap-2 text-xs">
                        <span className="font-medium">{month.month}</span>
                        <span className="font-mono text-right">{formatCurrency(month.deposits)}</span>
                        <span className="font-mono text-right">{formatCurrency(month.payBurden)}</span>
                        <span className="font-mono text-right">{month.holdbackPct.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Metrics */}
              {extractedMetrics && (
                <div className="border border-border p-4">
                  <h4 className="text-xs text-[#878787] font-medium mb-2">
                    Key Metrics
                  </h4>
                  <div className="divide-y divide-border">
                    <ReviewRow
                      label="Avg Daily Balance"
                      value={formatCurrency(extractedMetrics.avgDailyBalance)}
                    />
                    <ReviewRow
                      label="Monthly Avg Revenue"
                      value={formatCurrency(extractedMetrics.monthlyAvgRevenue)}
                    />
                    <ReviewRow
                      label="NSF Count"
                      value={extractedMetrics.nsfCount}
                    />
                    <ReviewRow
                      label="Deposit Consistency"
                      value={`${(extractedMetrics.depositConsistency * 100).toFixed(0)}%`}
                    />
                  </div>
                </div>
              )}

              {/* Risk Flags */}
              {riskFlags && riskFlags.length > 0 && (
                <div className="border border-border p-4">
                  <h4 className="text-xs text-[#878787] font-medium mb-2">
                    Risk Flags
                  </h4>
                  <div className="space-y-1">
                    {riskFlags.map((flag, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-sm ${
                          flag.severity === "high"
                            ? "text-red-700"
                            : flag.severity === "medium"
                              ? "text-amber-700"
                              : "text-gray-600"
                        }`}
                      >
                        <Icons.Error className="size-3.5" />
                        <span>{flag.flag}: {flag.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Narrative */}
              {score.aiNarrative && (
                <div className="border border-border p-4">
                  <h4 className="text-xs text-[#878787] font-medium mb-2">
                    AI Analysis
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {score.aiNarrative}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decision Section */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-medium">Decision</h3>

        <Textarea
          rows={3}
          placeholder="Decision notes (optional)..."
          value={decisionNotes}
          onChange={(e) => setDecisionNotes(e.target.value)}
        />

        {updateMutation.isError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
            {updateMutation.error?.message ||
              "Failed to save decision. Please try again."}
          </div>
        )}

        {!decisionSaved ? (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
            >
              Back
            </Button>

            <div className="flex-1" />

            <Button
              type="button"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={updateMutation.isPending}
              onClick={() => handleDecision("review_needed")}
            >
              Request More Info
            </Button>

            <Button
              type="button"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
              disabled={updateMutation.isPending}
              onClick={() => handleDecision("declined")}
            >
              Decline
            </Button>

            <SubmitButton
              isSubmitting={updateMutation.isPending}
              disabled={updateMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleDecision("approved")}
            >
              Approve
            </SubmitButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Icons.Check className="size-4 text-green-600" />
              <span>
                Decision saved:{" "}
                <span className="font-medium capitalize">
                  {decision?.replace("_", " ")}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  router.push(`/merchants/${merchantId}`);
                }}
              >
                Back to Merchant
              </Button>

              {decision === "approved" && (
                <Link href={`/merchants/${merchantId}/deals/new`}>
                  <Button type="button">Create Deal</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
