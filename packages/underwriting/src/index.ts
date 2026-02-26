// ============================================================================
// @midday/underwriting — AI Scoring Engine
// ============================================================================

// Orchestrator
export {
  scoreUnderwritingApplication,
  type UnderwritingScoreResult,
  type ScoringDependencies,
} from "./scoring/score-application";

// Buy box
export {
  checkBuyBox,
  type BuyBoxConfig,
  type BuyBoxCriterion,
  type BuyBoxResult,
  type MerchantMetrics,
} from "./scoring/buy-box-check";

// Bank statement parser (Stage 1)
export { parseBankStatements } from "./scoring/bank-statement-parser";

// Risk analyzer (Stage 2)
export { analyzeRisk, type RiskAnalyzerParams } from "./scoring/risk-analyzer";

// Schemas & types
export {
  bankStatementExtractionSchema,
  riskAnalysisSchema,
  type BankStatementExtraction,
  type RiskAnalysis,
} from "./scoring/schemas";
