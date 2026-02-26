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
import {
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  RECOMMENDATION_STYLES,
  RECOMMENDATION_LABELS,
  CONFIDENCE_LABELS,
} from "./underwriting/constants";

type Props = {
  merchantId: string;
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
              {extractedMetrics?.monthlyAvgRevenue != null && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#878787]">Monthly Avg Revenue</span>
                  <span className="font-mono">
                    <FormatAmount
                      amount={Number(extractedMetrics.monthlyAvgRevenue)}
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
