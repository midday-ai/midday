"use client";

import { FormatAmount } from "@/components/format-amount";
import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";

type Props = {
  merchantId: string;
};

const STATUS_BADGE_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
  review_needed: "bg-amber-50 text-amber-700 border-amber-200",
  in_review: "bg-amber-50 text-amber-700 border-amber-200",
  scoring: "bg-amber-50 text-amber-700 border-amber-200",
  pending_documents: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  declined: "Declined",
  review_needed: "Review Needed",
  in_review: "In Review",
  scoring: "Scoring",
  pending_documents: "Pending Documents",
};

const RECOMMENDATION_STYLES: Record<string, string> = {
  approve: "bg-green-100 text-green-800 border-green-200",
  decline: "bg-red-100 text-red-800 border-red-200",
  review_needed: "bg-amber-50 text-amber-700 border-amber-200",
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  approve: "Approve",
  decline: "Decline",
  review_needed: "Review Needed",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function UnderwritingSummaryCard({ merchantId }: Props) {
  const trpc = useTRPC();

  const { data: application, isLoading } = useQuery(
    trpc.underwritingApplications.getByMerchant.queryOptions({ merchantId }),
  );

  const { data: score } = useQuery(
    trpc.underwritingApplications.getScore.queryOptions(
      { applicationId: application?.id! },
      { enabled: !!application?.id },
    ),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Underwriting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 flex items-center justify-center">
            <span className="text-xs text-[#878787]">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No underwriting application exists
  if (!application) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Underwriting</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#878787] mb-3">
            No underwriting on file
          </p>
          <Link href={`/merchants/${merchantId}/underwriting/new`}>
            <Button variant="outline" size="sm">
              <Icons.Add className="size-4 mr-1" />
              Start Underwriting
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Application exists — show summary
  const extractedMetrics = score?.extractedMetrics as Record<
    string,
    unknown
  > | null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Underwriting</CardTitle>
          <Badge
            className={
              STATUS_BADGE_STYLES[application.status] ??
              "bg-gray-100 text-gray-600 border-gray-200"
            }
          >
            {STATUS_LABELS[application.status] ?? application.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Decision date */}
        {application.decisionDate && (
          <div className="flex justify-between text-xs">
            <span className="text-[#878787]">Decision Date</span>
            <span>
              {format(
                new TZDate(application.decisionDate, "UTC"),
                "MMM d, yyyy",
              )}
            </span>
          </div>
        )}

        {/* Score details */}
        {score && (
          <>
            {/* Recommendation + confidence */}
            <div className="flex items-center gap-2">
              {score.recommendation && (
                <Badge
                  className={
                    RECOMMENDATION_STYLES[score.recommendation] ??
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {RECOMMENDATION_LABELS[score.recommendation] ??
                    score.recommendation}
                </Badge>
              )}
              {score.confidence && (
                <span className="text-xs text-[#878787]">
                  {CONFIDENCE_LABELS[score.confidence] ?? score.confidence}{" "}
                  confidence
                </span>
              )}
            </div>

            {/* Key metrics */}
            <div className="divide-y divide-border text-xs">
              {extractedMetrics?.monthlyAvgDeposits != null && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#878787]">Monthly Avg Deposits</span>
                  <span className="font-mono">
                    <FormatAmount
                      amount={Number(extractedMetrics.monthlyAvgDeposits)}
                      currency="USD"
                    />
                  </span>
                </div>
              )}
              {application.ficoRange && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#878787]">FICO Range</span>
                  <span className="font-mono">{application.ficoRange}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* View Full Underwriting link */}
        <div className="pt-1">
          <Link
            href={`/merchants/${merchantId}/underwriting/${application.id}`}
            className="text-xs text-primary hover:underline"
          >
            View Full Underwriting
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
