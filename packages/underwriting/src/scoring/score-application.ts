import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuyBoxResult } from "./buy-box-check";
import { checkBuyBox } from "./buy-box-check";
import { parseBankStatements } from "./bank-statement-parser";
import { analyzeRisk } from "./risk-analyzer";
import type { BankStatementExtraction, RiskAnalysis } from "./schemas";

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal Database type matching the Drizzle client pattern used in this codebase.
 * We accept `any` here since the actual Database type comes from @midday/db/client
 * and we don't want a hard dependency on the db package from this scoring library.
 */
// biome-ignore lint/suspicious/noExplicitAny: Database type is injected from caller
type Database = any;

export type UnderwritingScoreResult = {
  scoreId: string;
  applicationId: string;
  recommendation: string;
  confidence: string;
  buyBoxResult: BuyBoxResult;
  riskAnalysis: RiskAnalysis;
  bankExtraction: BankStatementExtraction;
};

// ============================================================================
// Query function types (to avoid hard import of @midday/db)
// These match the signatures in packages/db/src/queries/underwriting*.ts
// ============================================================================

type ApplicationRecord = {
  id: string;
  merchantId: string;
  teamId: string;
  status: string;
  requestedAmountMin: number | null;
  requestedAmountMax: number | null;
  useOfFunds: string | null;
  ficoRange: string | null;
  timeInBusinessMonths: number | null;
  brokerNotes: string | null;
  priorMcaHistory: string | null;
  merchantName: string | null;
  merchantIndustry: string | null;
};

type DocumentRecord = {
  id: string;
  filePath: string;
  fileName: string;
  documentType: string | null;
  processingStatus: string;
  waived: boolean;
};

type BuyBoxRecord = {
  minMonthlyRevenue: number | null;
  minTimeInBusiness: number | null;
  maxExistingPositions: number | null;
  minAvgDailyBalance: number | null;
  maxNsfCount: number | null;
  excludedIndustries: string[] | null;
  minCreditScore: number | null;
};

type ScoreRecord = {
  id: string;
  applicationId: string;
  teamId: string;
  recommendation: string | null;
  confidence: string | null;
};

// ============================================================================
// DB query dependencies — injected to keep this package independent
// ============================================================================

export type ScoringDependencies = {
  getUnderwritingApplicationById: (
    db: Database,
    params: { id: string; teamId: string },
  ) => Promise<ApplicationRecord | null>;
  getUnderwritingDocuments: (
    db: Database,
    params: { applicationId: string; teamId: string },
  ) => Promise<DocumentRecord[]>;
  getUnderwritingBuyBox: (
    db: Database,
    params: { teamId: string },
  ) => Promise<BuyBoxRecord | null>;
  createUnderwritingScore: (
    db: Database,
    params: {
      applicationId: string;
      teamId: string;
      recommendation?: string | null;
      confidence?: string | null;
      buyBoxResults?: unknown;
      bankAnalysis?: unknown;
      extractedMetrics?: unknown;
      riskFlags?: unknown;
      priorMcaFlags?: unknown;
      aiNarrative?: string | null;
    },
  ) => Promise<ScoreRecord>;
  updateUnderwritingApplication: (
    db: Database,
    params: { id: string; teamId: string; status?: string },
  ) => Promise<unknown>;
};

// ============================================================================
// Orchestrator
// ============================================================================

/**
 * Score an underwriting application through the full pipeline:
 *
 * 1. Fetch application, documents, and buy box criteria from DB
 * 2. Update application status to "scoring"
 * 3. Download bank statement PDFs from Supabase Storage
 * 4. Run buy box check (rule-based)
 * 5. Stage 1: Parse bank statements with Gemini
 * 6. Stage 2: Analyze risk with Claude
 * 7. Save score to database
 * 8. Update application status based on result
 * 9. Return the complete score
 */
export async function scoreUnderwritingApplication(
  applicationId: string,
  teamId: string,
  db: Database,
  supabase: SupabaseClient,
  deps: ScoringDependencies,
): Promise<UnderwritingScoreResult> {
  // -----------------------------------------------------------------------
  // 1. Fetch application + documents + buy box criteria
  // -----------------------------------------------------------------------
  const [application, documents, buyBoxConfig] = await Promise.all([
    deps.getUnderwritingApplicationById(db, { id: applicationId, teamId }),
    deps.getUnderwritingDocuments(db, { applicationId, teamId }),
    deps.getUnderwritingBuyBox(db, { teamId }),
  ]);

  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  // -----------------------------------------------------------------------
  // 2. Update application status to "scoring"
  // -----------------------------------------------------------------------
  await deps.updateUnderwritingApplication(db, {
    id: applicationId,
    teamId,
    status: "scoring",
  });

  try {
    // -------------------------------------------------------------------
    // 3. Download bank statement PDFs from Supabase Storage
    // -------------------------------------------------------------------
    const bankStatementDocs = documents.filter(
      (doc) =>
        !doc.waived &&
        doc.filePath &&
        (doc.documentType === "bank_statements" ||
          doc.fileName.toLowerCase().includes("bank") ||
          doc.fileName.toLowerCase().endsWith(".pdf")),
    );

    const pdfBuffers: { fileName: string; buffer: Buffer }[] = [];

    for (const doc of bankStatementDocs) {
      const { data, error } = await supabase.storage
        .from("vault")
        .download(doc.filePath);

      if (error) {
        console.error(
          `[Scoring] Failed to download ${doc.fileName}:`,
          error.message,
        );
        continue;
      }

      if (data) {
        const arrayBuffer = await data.arrayBuffer();
        pdfBuffers.push({
          fileName: doc.fileName,
          buffer: Buffer.from(arrayBuffer),
        });
      }
    }

    // -------------------------------------------------------------------
    // 4. Run buy box check
    // -------------------------------------------------------------------
    const buyBoxResult = checkBuyBox(
      {
        minMonthlyRevenue: buyBoxConfig?.minMonthlyRevenue ?? null,
        minTimeInBusiness: buyBoxConfig?.minTimeInBusiness ?? null,
        maxExistingPositions: buyBoxConfig?.maxExistingPositions ?? null,
        minAvgDailyBalance: buyBoxConfig?.minAvgDailyBalance ?? null,
        maxNsfCount: buyBoxConfig?.maxNsfCount ?? null,
        excludedIndustries: buyBoxConfig?.excludedIndustries ?? null,
        minCreditScore: buyBoxConfig?.minCreditScore ?? null,
      },
      {
        monthlyAvgRevenue: undefined, // Will be populated after bank parsing
        timeInBusinessMonths: application.timeInBusinessMonths ?? undefined,
        existingPositions: undefined, // Will be detected from bank statements
        avgDailyBalance: undefined, // Will be populated after bank parsing
        nsfCount: undefined, // Will be populated after bank parsing
        industry: application.merchantIndustry ?? undefined,
        creditScore: undefined, // Could be derived from ficoRange in the future
      },
    );

    // -------------------------------------------------------------------
    // 5. Stage 1: Parse bank statements with Gemini
    // -------------------------------------------------------------------
    let bankExtraction: BankStatementExtraction = {
      months: [],
      accountHolder: undefined,
      bankName: undefined,
      accountType: undefined,
      suspectedMcaPayments: [],
    };

    if (pdfBuffers.length > 0) {
      bankExtraction = await parseBankStatements(pdfBuffers);
    }

    // Re-run buy box with extracted metrics if we have bank data
    let finalBuyBoxResult = buyBoxResult;
    if (bankExtraction.months.length > 0) {
      const months = bankExtraction.months;
      const totalDeposits = months.reduce((s, m) => s + m.totalDeposits, 0);
      const avgMonthlyRevenue = totalDeposits / months.length;
      const totalNsfs = months.reduce((s, m) => s + m.nsfCount, 0);
      const avgDailyBalance =
        months.reduce((s, m) => s + m.avgDailyBalance, 0) / months.length;
      const existingPositions =
        bankExtraction.suspectedMcaPayments?.length ?? 0;

      finalBuyBoxResult = checkBuyBox(
        {
          minMonthlyRevenue: buyBoxConfig?.minMonthlyRevenue ?? null,
          minTimeInBusiness: buyBoxConfig?.minTimeInBusiness ?? null,
          maxExistingPositions: buyBoxConfig?.maxExistingPositions ?? null,
          minAvgDailyBalance: buyBoxConfig?.minAvgDailyBalance ?? null,
          maxNsfCount: buyBoxConfig?.maxNsfCount ?? null,
          excludedIndustries: buyBoxConfig?.excludedIndustries ?? null,
          minCreditScore: buyBoxConfig?.minCreditScore ?? null,
        },
        {
          monthlyAvgRevenue: avgMonthlyRevenue,
          timeInBusinessMonths: application.timeInBusinessMonths ?? undefined,
          existingPositions,
          avgDailyBalance,
          nsfCount: totalNsfs,
          industry: application.merchantIndustry ?? undefined,
          creditScore: undefined,
        },
      );
    }

    // -------------------------------------------------------------------
    // 6. Stage 2: Analyze risk with Claude
    // -------------------------------------------------------------------
    const riskAnalysis = await analyzeRisk({
      extraction: bankExtraction,
      buyBoxResult: finalBuyBoxResult,
      requestedAmountMin: application.requestedAmountMin ?? undefined,
      requestedAmountMax: application.requestedAmountMax ?? undefined,
      brokerNotes: application.brokerNotes ?? undefined,
      priorMcaHistory: application.priorMcaHistory ?? undefined,
      ficoRange: application.ficoRange ?? undefined,
      timeInBusinessMonths: application.timeInBusinessMonths ?? undefined,
      industry: application.merchantIndustry ?? undefined,
    });

    // -------------------------------------------------------------------
    // 7. Save score to database
    // -------------------------------------------------------------------
    const score = await deps.createUnderwritingScore(db, {
      applicationId,
      teamId,
      recommendation: riskAnalysis.recommendation,
      confidence: riskAnalysis.confidence,
      buyBoxResults: finalBuyBoxResult,
      bankAnalysis: riskAnalysis.bankAnalysis,
      extractedMetrics: riskAnalysis.extractedMetrics,
      riskFlags: riskAnalysis.riskFlags,
      priorMcaFlags: riskAnalysis.priorMcaFlags,
      aiNarrative: riskAnalysis.aiNarrative,
    });

    // -------------------------------------------------------------------
    // 8. Update application status based on result
    // -------------------------------------------------------------------
    const statusMap: Record<string, string> = {
      approve: "approved",
      decline: "declined",
      review_needed: "review_needed",
    };

    const newStatus =
      statusMap[riskAnalysis.recommendation] ?? "review_needed";

    await deps.updateUnderwritingApplication(db, {
      id: applicationId,
      teamId,
      status: newStatus,
    });

    // -------------------------------------------------------------------
    // 9. Return the complete score
    // -------------------------------------------------------------------
    return {
      scoreId: score.id,
      applicationId,
      recommendation: riskAnalysis.recommendation,
      confidence: riskAnalysis.confidence,
      buyBoxResult: finalBuyBoxResult,
      riskAnalysis,
      bankExtraction,
    };
  } catch (error) {
    // On failure, revert status to in_review so it can be retried
    await deps.updateUnderwritingApplication(db, {
      id: applicationId,
      teamId,
      status: "in_review",
    });
    throw error;
  }
}
