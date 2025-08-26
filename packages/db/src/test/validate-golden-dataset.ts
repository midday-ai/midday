#!/usr/bin/env bun

/**
 * Golden Dataset Validation Script
 *
 * Validates the golden dataset and provides detailed analysis
 * Run with: bun run src/test/validate-golden-dataset.ts
 */

import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  isCrossCurrencyMatch,
} from "../utils/transaction-matching";
import {
  GOLDEN_DATASET,
  getDatasetStats,
  validateGoldenDataset,
} from "./golden-dataset";

console.log("🔍 Validating Golden Dataset...\n");

// 1. Validate dataset structure
const validation = validateGoldenDataset();
if (!validation.valid) {
  console.error("❌ Dataset validation failed:");
  for (const error of validation.errors) {
    console.error(`   ${error}`);
  }
  process.exit(1);
}

console.log("✅ Dataset structure validation passed\n");

// 2. Show dataset statistics
const stats = getDatasetStats();
console.log("📊 Dataset Statistics:");
console.log(`   Total cases: ${stats.total}`);
console.log("   By feedback:");
console.log(`     - Confirmed: ${stats.byFeedback.confirmed}`);
console.log(`     - Declined: ${stats.byFeedback.declined}`);
console.log(`     - Unmatched: ${stats.byFeedback.unmatched}`);
console.log("   By match type:");
for (const [type, count] of Object.entries(stats.byMatchType)) {
  console.log(`     - ${type}: ${count}`);
}
console.log("   By category:");
for (const [category, count] of Object.entries(stats.byCategory)) {
  console.log(`     - ${category}: ${count}`);
}
console.log("   Average confidence:");
console.log(
  `     - Confirmed: ${stats.avgConfidenceByFeedback.confirmed.toFixed(3)}`,
);
console.log(
  `     - Declined: ${stats.avgConfidenceByFeedback.declined.toFixed(3)}`,
);
console.log();

// 3. Test algorithm performance on golden dataset
console.log("🧪 Testing Algorithm Performance:");

let correctPredictions = 0;
let totalPredictions = 0;
const confidenceGaps: number[] = [];

GOLDEN_DATASET.forEach((goldenCase, index) => {
  const { inbox, transaction, expectedScores, userFeedback, id } = goldenCase;

  // Calculate actual scores
  const amountScore = calculateAmountScore(inbox, transaction);
  const currencyScore = calculateCurrencyScore(
    inbox.currency,
    transaction.currency,
  );
  const dateScore = calculateDateScore(inbox.date, transaction.date);
  const mockEmbeddingScore = expectedScores.embeddingScore;

  const actualConfidence =
    amountScore * 0.3 +
    currencyScore * 0.2 +
    dateScore * 0.2 +
    mockEmbeddingScore * 0.3;

  // Check prediction accuracy
  const predictedMatch = actualConfidence > 0.6;
  const actualMatch = userFeedback === "confirmed";

  if (predictedMatch === actualMatch) {
    correctPredictions++;
  } else {
    console.log(
      `   ⚠️  Mismatch in ${id}: predicted=${predictedMatch}, actual=${actualMatch}, confidence=${actualConfidence.toFixed(3)}`,
    );
  }

  totalPredictions++;

  // Track confidence gap from expected
  const confidenceGap = Math.abs(
    actualConfidence - expectedScores.confidenceScore,
  );
  confidenceGaps.push(confidenceGap);

  if (confidenceGap > 0.1) {
    console.log(
      `   📊 Large confidence gap in ${id}: actual=${actualConfidence.toFixed(3)}, expected=${expectedScores.confidenceScore.toFixed(3)}, gap=${confidenceGap.toFixed(3)}`,
    );
  }
});

const accuracy = correctPredictions / totalPredictions;
const avgConfidenceGap =
  confidenceGaps.reduce((a, b) => a + b, 0) / confidenceGaps.length;

console.log(
  `   Prediction accuracy: ${(accuracy * 100).toFixed(1)}% (${correctPredictions}/${totalPredictions})`,
);
console.log(`   Average confidence gap: ${avgConfidenceGap.toFixed(3)}`);

if (accuracy < 0.85) {
  console.log("   ❌ Algorithm accuracy below 85% - needs improvement");
  process.exit(1);
} else {
  console.log("   ✅ Algorithm accuracy acceptable");
}

if (avgConfidenceGap > 0.05) {
  console.log("   ⚠️  Large confidence gaps detected - review expected scores");
} else {
  console.log("   ✅ Confidence scores well-calibrated");
}

console.log();

// 4. Test cross-currency logic
console.log("💱 Testing Cross-Currency Logic:");

const crossCurrencyCases = GOLDEN_DATASET.filter(
  (item) => item.matchType === "cross_currency",
);
let crossCurrencyCorrect = 0;

for (const goldenCase of crossCurrencyCases) {
  const { inbox, transaction, id, userFeedback } = goldenCase;

  const isCrossMatch = isCrossCurrencyMatch(inbox, transaction);
  const shouldMatch = userFeedback === "confirmed";

  if (isCrossMatch === shouldMatch) {
    crossCurrencyCorrect++;
  } else {
    console.log(
      `   ⚠️  Cross-currency mismatch in ${id}: detected=${isCrossMatch}, should=${shouldMatch}`,
    );
  }
}

const crossCurrencyAccuracy = crossCurrencyCorrect / crossCurrencyCases.length;
console.log(
  `   Cross-currency accuracy: ${(crossCurrencyAccuracy * 100).toFixed(1)}% (${crossCurrencyCorrect}/${crossCurrencyCases.length})`,
);

if (crossCurrencyAccuracy < 0.9) {
  console.log("   ❌ Cross-currency logic needs improvement");
} else {
  console.log("   ✅ Cross-currency logic working well");
}

console.log();

// 5. Performance test
console.log("⚡ Performance Test:");

const start = performance.now();

// Run all scoring functions on all cases
for (const goldenCase of GOLDEN_DATASET) {
  const { inbox, transaction } = goldenCase;

  calculateAmountScore(inbox, transaction);
  calculateCurrencyScore(inbox.currency, transaction.currency);
  calculateDateScore(inbox.date, transaction.date);

  if (inbox.baseAmount && transaction.baseAmount) {
    isCrossCurrencyMatch(inbox, transaction);
  }
}

const duration = performance.now() - start;
const avgDuration = duration / GOLDEN_DATASET.length;

console.log(`   Total time: ${duration.toFixed(2)}ms`);
console.log(`   Average per case: ${avgDuration.toFixed(3)}ms`);

if (avgDuration > 1) {
  console.log("   ⚠️  Performance slower than expected");
} else {
  console.log("   ✅ Performance within acceptable limits");
}

console.log();

// 6. Summary and recommendations
console.log("📋 Summary:");
if (validation.valid && accuracy >= 0.85 && avgConfidenceGap <= 0.05) {
  console.log("✅ Golden dataset is healthy and algorithm performance is good");
  console.log("   Ready for production use and algorithm changes");
} else {
  console.log("⚠️  Issues detected - address before making algorithm changes:");
  if (!validation.valid) console.log("   - Fix dataset validation errors");
  if (accuracy < 0.85) console.log("   - Improve algorithm accuracy");
  if (avgConfidenceGap > 0.05)
    console.log("   - Calibrate expected confidence scores");
}

console.log("\n🎯 Next steps:");
console.log("   1. Run tests: bun run test:all-matching");
console.log("   2. Monitor performance: bun run test:performance");
console.log("   3. Update golden dataset as you get more real user feedback");
console.log("   4. Re-run validation after algorithm changes");

process.exit(0);
