"use client";

import { useTRPC } from "@/trpc/client";
import { TZDate } from "@date-fns/tz";
import { Badge } from "@midday/ui/badge";
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
import { BankAnalysisTable } from "./bank-analysis-table";
import { BuyBoxChecklist } from "./buy-box-checklist";
import { RiskFlags } from "./risk-flags";
import {
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  RECOMMENDATION_STYLES,
  RECOMMENDATION_LABELS,
  CONFIDENCE_LABELS,
} from "../constants";

const DOC_STATUS_STYLES: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (n: number | null | undefined) => {
  if (n == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  merchantId: string;
  applicationId: string;
  merchant: {
    id: string;
    name: string | null;
    email: string;
    website: string | null;
  };
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnderwritingDetail({
  merchantId,
  applicationId,
  merchant,
}: Props) {
  const trpc = useTRPC();

  const { data: application } = useQuery(
    trpc.underwritingApplications.getById.queryOptions({ id: applicationId }),
  );

  const { data: documents } = useQuery(
    trpc.underwritingApplications.getDocuments.queryOptions({ applicationId }),
  );

  const { data: score } = useQuery(
    trpc.underwritingApplications.getScore.queryOptions({ applicationId }),
  );

  if (!application) {
    return (
      <div className="p-6">
        <p className="text-sm text-[#878787]">Loading application...</p>
      </div>
    );
  }

  // Cast JSONB fields
  const bankAnalysis = score?.bankAnalysis as
    | Array<{
        month: string;
        deposits: number;
        payBurden: number;
        holdbackPct: number;
      }>
    | null;

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

  const riskFlags = score?.riskFlags as
    | Array<{
        flag: string;
        severity: "high" | "medium" | "low";
        description: string;
      }>
    | null;

  return (
    <div className="p-6 space-y-6">
      {/* ================================================================= */}
      {/* A. Header */}
      {/* ================================================================= */}
      <div>
        <Link
          href={`/merchants/${merchantId}`}
          className="inline-flex items-center gap-1 text-sm text-[#606060] hover:text-primary transition-colors mb-4"
        >
          <Icons.ArrowBack className="size-4" />
          Back to Merchant
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-serif tracking-tight">
                Underwriting &mdash; {application.merchantName ?? merchant.name}
              </h1>
              <p className="text-sm text-[#606060]">{merchant.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              className={
                STATUS_BADGE_STYLES[application.status] ??
                "bg-gray-100 text-gray-600 border-gray-200"
              }
            >
              {STATUS_LABELS[application.status] ?? application.status}
            </Badge>
            {application.decisionDate && (
              <span className="text-xs text-[#878787]">
                Decided{" "}
                {format(
                  new TZDate(application.decisionDate, "UTC"),
                  "MMM d, yyyy",
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* B. Merchant Profile */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Merchant Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <ProfileField
              label="Business Name"
              value={application.merchantName}
            />
            <ProfileField
              label="Industry"
              value={application.merchantIndustry}
            />
            <ProfileField label="State" value={application.merchantState} />
            <ProfileField
              label="Time in Business"
              value={
                application.timeInBusinessMonths != null
                  ? `${application.timeInBusinessMonths} months`
                  : null
              }
            />
            <ProfileField label="FICO Range" value={application.ficoRange} />
            <ProfileField
              label="Requested Amount"
              value={
                application.requestedAmountMin != null ||
                application.requestedAmountMax != null
                  ? `${formatCurrency(application.requestedAmountMin)} - ${formatCurrency(application.requestedAmountMax)}`
                  : null
              }
            />
            <ProfileField
              label="Use of Funds"
              value={application.useOfFunds}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* C. Broker Notes & Prior History */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Broker Notes &amp; Prior History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {application.brokerNotes || application.priorMcaHistory ? (
            <>
              {application.brokerNotes && (
                <div>
                  <h4 className="text-xs text-[#878787] font-medium mb-1">
                    Broker Notes
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {application.brokerNotes}
                  </p>
                </div>
              )}
              {application.priorMcaHistory && (
                <div>
                  <h4 className="text-xs text-[#878787] font-medium mb-1">
                    Prior MCA History
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {application.priorMcaHistory}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[#878787]">No notes provided</p>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* D. Documents */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Documents ({documents?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Icons.Description className="size-4 text-[#878787]" />
                    <div>
                      <span className="text-sm">{doc.fileName}</span>
                      {doc.documentType && (
                        <span className="ml-2 text-xs text-[#878787]">
                          {doc.documentType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#878787]">
                      {format(
                        new TZDate(doc.uploadedAt, "UTC"),
                        "MMM d, yyyy",
                      )}
                    </span>
                    <Badge
                      className={
                        DOC_STATUS_STYLES[doc.processingStatus] ??
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    >
                      {doc.processingStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#878787]">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* E. Bank Analysis */}
      {/* ================================================================= */}
      {score && Array.isArray(bankAnalysis) && bankAnalysis.length > 0 && (
        <BankAnalysisTable data={bankAnalysis} />
      )}

      {/* ================================================================= */}
      {/* F. Buy Box Checklist */}
      {/* ================================================================= */}
      {score && buyBoxCriteria && buyBoxCriteria.length > 0 && (
        <BuyBoxChecklist results={buyBoxCriteria} />
      )}

      {/* ================================================================= */}
      {/* G. Risk Flags */}
      {/* ================================================================= */}
      {score && Array.isArray(riskFlags) && riskFlags.length > 0 && (
        <RiskFlags flags={riskFlags} />
      )}

      {/* ================================================================= */}
      {/* H. AI Summary */}
      {/* ================================================================= */}
      {score?.aiNarrative && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">AI Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
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
            <p className="text-sm whitespace-pre-wrap">{score.aiNarrative}</p>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* I. Decision History */}
      {/* ================================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Decision History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.decision ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <ProfileField
                  label="Decision"
                  value={
                    <Badge
                      className={
                        STATUS_BADGE_STYLES[application.decision] ??
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    >
                      {STATUS_LABELS[application.decision] ??
                        application.decision}
                    </Badge>
                  }
                />
                <ProfileField
                  label="Decision Date"
                  value={
                    application.decisionDate
                      ? format(
                          new TZDate(application.decisionDate, "UTC"),
                          "MMM d, yyyy 'at' h:mm a",
                        )
                      : null
                  }
                />
                <ProfileField
                  label="Decided By"
                  value={application.decidedBy ?? "Unknown"}
                />
              </div>
              {application.decisionNotes && (
                <div>
                  <h4 className="text-xs text-[#878787] font-medium mb-1">
                    Notes
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {application.decisionNotes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#878787]">
              <Icons.Time className="size-4" />
              <span>Pending decision</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Profile field helper
// ---------------------------------------------------------------------------

function ProfileField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null | React.ReactNode;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div>
      <dt className="text-xs text-[#878787] mb-0.5">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
