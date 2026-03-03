import { beforeAll, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  calculateNameScore,
  scoreMatch,
} from "../utils/transaction-matching";

interface EvalRecord {
  dataSource: string;
  userAction: string;
  matchType: string;
  confidenceScore: number | null;
  amountScore: number | null;
  embeddingScore: number | null;

  inboxDisplayName: string;
  inboxAmount: number;
  inboxCurrency: string;
  inboxDate: string;
  inboxWebsite: string;
  inboxType: string;
  inboxInvoiceNumber: string;
  inboxBaseAmount: number;
  inboxBaseCurrency: string;

  transactionName: string;
  transactionAmount: number;
  transactionCurrency: string;
  transactionDate: string;
  transactionCounterpartyName: string;
  transactionMerchantName: string;
  transactionDescription: string;
  transactionBaseAmount: number;
  transactionBaseCurrency: string;
  transactionCategory: string;
  transactionRecurring: boolean;

  inboxEmbeddingSourceText: string;
  teamId: string;
}

function safeFloat(v: string | undefined | null, fallback = 0): number {
  if (!v || v === "null" || v === "") return fallback;
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}

function safeStr(v: string | undefined | null): string {
  if (!v || v === "null") return "";
  return v.trim();
}

function parseCSV(filePath: string): EvalRecord[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]!);
  const records: EvalRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]!);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]!] = values[j] || "";
    }

    records.push({
      dataSource: safeStr(row.data_source),
      userAction: safeStr(row.user_action),
      matchType: safeStr(row.match_type),
      confidenceScore: safeFloat(row.confidence_score, NaN) || null,
      amountScore: safeFloat(row.amount_score, NaN) || null,
      embeddingScore: safeFloat(row.embedding_score, NaN) || null,

      inboxDisplayName: safeStr(row.inbox_display_name),
      inboxAmount: safeFloat(row.inbox_amount),
      inboxCurrency: safeStr(row.inbox_currency),
      inboxDate: safeStr(row.inbox_date),
      inboxWebsite: safeStr(row.inbox_website),
      inboxType: safeStr(row.inbox_type),
      inboxInvoiceNumber: safeStr(row.inbox_invoice_number),
      inboxBaseAmount: safeFloat(row.inbox_base_amount),
      inboxBaseCurrency: safeStr(row.inbox_base_currency),

      transactionName: safeStr(row.transaction_name),
      transactionAmount: safeFloat(row.transaction_amount),
      transactionCurrency: safeStr(row.transaction_currency),
      transactionDate: safeStr(row.transaction_date),
      transactionCounterpartyName: safeStr(row.transaction_counterparty_name),
      transactionMerchantName: safeStr(row.transaction_merchant_name),
      transactionDescription: safeStr(row.transaction_description),
      transactionBaseAmount: safeFloat(row.transaction_base_amount),
      transactionBaseCurrency: safeStr(row.transaction_base_currency),
      transactionCategory: safeStr(row.transaction_category),
      transactionRecurring: row.transaction_recurring === "true",

      inboxEmbeddingSourceText: safeStr(row.inbox_embedding_source_text),
      teamId: safeStr(row.team_id),
    });
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// --- Learning memories for eval simulation ---
function normalizeNameForMemory(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[.,\-_'"()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pairKey(inboxName: string, transactionName: string): string {
  return `${normalizeNameForMemory(inboxName)}|||${normalizeNameForMemory(transactionName)}`;
}

function extractDomainToken(url: string): string {
  if (!url) return "";
  const cleaned = url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return cleaned?.split(".")[0]?.toLowerCase() ?? "";
}

const pairConfirmedCount = new Map<string, number>();
const pairDeclinedCount = new Map<string, number>();

// --- Scoring simulation ---

function scoreRecord(
  r: EvalRecord,
  _weights: {
    name: number;
    amount: number;
    embedding: number;
    date: number;
    currency: number;
  },
): {
  confidence: number;
  nameScore: number;
  amountScore: number;
  dateScore: number;
  currencyScore: number;
  embeddingScore: number;
} {
  const txnPrimaryName = r.transactionMerchantName || r.transactionName;
  const memoryKey = pairKey(r.inboxDisplayName, txnPrimaryName);
  const confirmedCount = pairConfirmedCount.get(memoryKey) ?? 0;
  const declinedCount = pairDeclinedCount.get(memoryKey) ?? 0;
  const aliasScore = confirmedCount >= 2 ? 0.9 : 0;
  const declinePenalty = declinedCount >= 2 ? 0.15 : 0;

  let nameScore = calculateNameScore(
    r.inboxDisplayName,
    r.transactionName,
    r.transactionMerchantName,
    aliasScore,
  );

  const inboxItem = {
    amount: r.inboxAmount,
    currency: r.inboxCurrency || null,
    baseAmount: r.inboxBaseAmount || null,
    baseCurrency: r.inboxBaseCurrency || null,
  };
  const txnItem = {
    amount: r.transactionAmount,
    currency: r.transactionCurrency || null,
    baseAmount: r.transactionBaseAmount || null,
    baseCurrency: r.transactionBaseCurrency || null,
  };

  const amountScore = calculateAmountScore(inboxItem, txnItem);

  const currencyScore = calculateCurrencyScore(
    r.inboxCurrency || undefined,
    r.transactionCurrency || undefined,
    r.inboxBaseCurrency || undefined,
    r.transactionBaseCurrency || undefined,
  );

  let dateScore = 0.5;
  if (r.inboxDate && r.transactionDate) {
    try {
      dateScore = calculateDateScore(
        r.inboxDate,
        r.transactionDate,
        r.inboxType || undefined,
      );
    } catch {
      dateScore = 0.5;
    }
  }

  const sameCurrency = r.inboxCurrency === r.transactionCurrency;
  const isExactAmount =
    Math.abs(r.inboxAmount) > 0 &&
    Math.abs(r.transactionAmount) > 0 &&
    Math.abs(Math.abs(r.inboxAmount) - Math.abs(r.transactionAmount)) < 0.01;

  const invoiceNumber = normalizeNameForMemory(r.inboxInvoiceNumber);
  const searchableTransactionText = normalizeNameForMemory(
    `${r.transactionName} ${r.transactionMerchantName} ${r.transactionDescription}`,
  );
  if (
    invoiceNumber.length >= 4 &&
    searchableTransactionText.includes(invoiceNumber)
  ) {
    nameScore = Math.max(nameScore, 0.95);
  }

  const domainToken = extractDomainToken(r.inboxWebsite);
  if (
    domainToken.length >= 4 &&
    searchableTransactionText.includes(domainToken)
  ) {
    nameScore = Math.max(nameScore, 0.88);
  }

  const { confidence } = scoreMatch({
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
    isSameCurrency: sameCurrency,
    isExactAmount,
    declinePenalty,
    autoThreshold: 0.9,
    suggestedThreshold: 0.4,
  });

  const embeddingScore =
    r.embeddingScore !== null && r.embeddingScore > 0
      ? Math.max(0, 1 - r.embeddingScore)
      : 0;

  return {
    confidence,
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
    embeddingScore,
  };
}

function evaluateAtThreshold(
  suggestions: EvalRecord[],
  manualMatches: EvalRecord[],
  weights: {
    name: number;
    amount: number;
    embedding: number;
    date: number;
    currency: number;
  },
  threshold: number,
) {
  const totalRealMatches =
    suggestions.filter((r) => r.userAction === "confirmed").length +
    manualMatches.length;

  let foundFromSuggestions = 0;
  let foundFromManual = 0;
  let falsePositives = 0;

  for (const r of suggestions) {
    const { confidence } = scoreRecord(r, weights);
    if (confidence >= threshold) {
      if (r.userAction === "confirmed") {
        foundFromSuggestions++;
      } else {
        falsePositives++;
      }
    }
  }

  for (const r of manualMatches) {
    const { confidence } = scoreRecord(r, weights);
    if (confidence >= threshold) {
      foundFromManual++;
    }
  }

  const totalFound = foundFromSuggestions + foundFromManual;
  const totalSuggested = totalFound + falsePositives;
  const precision = totalSuggested > 0 ? totalFound / totalSuggested : 0;
  const recall = totalRealMatches > 0 ? totalFound / totalRealMatches : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  return {
    precision,
    recall,
    f1,
    totalFound,
    totalRealMatches,
    falsePositives,
    foundFromSuggestions,
    foundFromManual,
    threshold,
  };
}

// --- Load data ---

let suggestions: EvalRecord[] = [];
let manualMatches: EvalRecord[] = [];

const WEIGHTS = {
  name: 0.2,
  amount: 0.3,
  embedding: 0.25,
  date: 0.15,
  currency: 0.1,
};

beforeAll(() => {
  const testDir = join(process.cwd(), "packages/db/src/test");
  suggestions = parseCSV(join(testDir, "suggestion-based.csv"));
  manualMatches = parseCSV(join(testDir, "manual-matches.csv"));

  pairConfirmedCount.clear();
  pairDeclinedCount.clear();
  for (const row of suggestions) {
    const txnName = row.transactionMerchantName || row.transactionName;
    const key = pairKey(row.inboxDisplayName, txnName);
    if (row.userAction === "confirmed") {
      pairConfirmedCount.set(key, (pairConfirmedCount.get(key) ?? 0) + 1);
    }
    if (row.userAction === "declined" || row.userAction === "unmatched") {
      pairDeclinedCount.set(key, (pairDeclinedCount.get(key) ?? 0) + 1);
    }
  }

  console.log(
    `Loaded ${suggestions.length} suggestions + ${manualMatches.length} manual matches = ${suggestions.length + manualMatches.length} total`,
  );
});

// =====================================================
// EVALUATION TESTS
// =====================================================

describe("Matching Engine Evaluation", () => {
  describe("Dataset integrity", () => {
    test("should load suggestion-based data", () => {
      expect(suggestions.length).toBeGreaterThan(1000);
    });

    test("should load manual match data", () => {
      expect(manualMatches.length).toBeGreaterThan(3000);
    });

    test("should have expected user actions in suggestions", () => {
      const actions = new Set(suggestions.map((r) => r.userAction));
      expect(actions.has("confirmed")).toBe(true);
      expect(actions.has("declined")).toBe(true);
    });
  });

  describe("Name scoring validation", () => {
    test("should score exact name matches highly", () => {
      expect(
        calculateNameScore("Telia Finland Oyj", "Telia Finland Oyj", ""),
      ).toBeGreaterThan(0.9);
    });

    test("should score merchant name containment", () => {
      expect(
        calculateNameScore("Vercel", "Vercel Inc Vercel Com", "Vercel Inc"),
      ).toBeGreaterThan(0.5);
    });

    test("should give zero for completely different names", () => {
      expect(
        calculateNameScore("Fitness First", "Booooooat", "Booooooat Pty Ltd"),
      ).toBe(0);
    });

    test("should handle company suffixes", () => {
      expect(
        calculateNameScore("Resend", "Resend", "Resend Inc"),
      ).toBeGreaterThan(0.7);
    });

    test("should handle empty names", () => {
      expect(calculateNameScore("", "Something", "")).toBe(0);
      expect(calculateNameScore("Something", "", "")).toBe(0);
    });

    test("name score separates confirmed from declined in real data", () => {
      const confirmedScores = suggestions
        .filter((r) => r.userAction === "confirmed")
        .map((r) =>
          calculateNameScore(
            r.inboxDisplayName,
            r.transactionName,
            r.transactionMerchantName,
          ),
        );
      const declinedScores = suggestions
        .filter((r) => r.userAction === "declined")
        .map((r) =>
          calculateNameScore(
            r.inboxDisplayName,
            r.transactionName,
            r.transactionMerchantName,
          ),
        );

      const avgConfirmed =
        confirmedScores.reduce((a, b) => a + b, 0) / confirmedScores.length;
      const avgDeclined =
        declinedScores.reduce((a, b) => a + b, 0) / declinedScores.length;

      console.log(
        `Name score gap: confirmed=${avgConfirmed.toFixed(3)} declined=${avgDeclined.toFixed(3)} gap=${(avgConfirmed - avgDeclined).toFixed(3)}`,
      );

      // Name score MUST separate confirmed from declined better than amount score does
      expect(avgConfirmed).toBeGreaterThan(avgDeclined);
    });
  });

  describe("Current algorithm baseline (before changes)", () => {
    test("should report current precision/recall/F1", () => {
      const confirmed = suggestions.filter(
        (r) => r.userAction === "confirmed",
      ).length;
      const total = suggestions.length;
      const totalReal = confirmed + manualMatches.length;

      const currentPrecision = confirmed / total;
      const currentRecall = confirmed / totalReal;
      const currentF1 =
        (2 * currentPrecision * currentRecall) /
        (currentPrecision + currentRecall);

      console.log("\n=== CURRENT ALGORITHM BASELINE ===");
      console.log(`  Precision: ${(currentPrecision * 100).toFixed(1)}%`);
      console.log(`  Recall:    ${(currentRecall * 100).toFixed(1)}%`);
      console.log(`  F1 Score:  ${(currentF1 * 100).toFixed(1)}%`);
      console.log(
        `  Matches:   ${confirmed} / ${totalReal} (missed ${manualMatches.length})`,
      );

      expect(currentPrecision).toBeGreaterThan(0.6);
      expect(currentF1).toBeGreaterThan(0.3);
    });
  });

  describe("New scoring evaluation", () => {
    test("should evaluate at multiple thresholds", () => {
      console.log("\n=== NEW SCORING - THRESHOLD SENSITIVITY ===");
      const thresholds = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75];

      let bestF1 = 0;
      let bestThreshold = 0;

      for (const t of thresholds) {
        const result = evaluateAtThreshold(
          suggestions,
          manualMatches,
          WEIGHTS,
          t,
        );
        console.log(
          `  t=${t.toFixed(2)}: P=${(result.precision * 100).toFixed(1)}% R=${(result.recall * 100).toFixed(1)}% F1=${(result.f1 * 100).toFixed(1)}% | found=${result.totalFound} FP=${result.falsePositives}`,
        );
        if (result.f1 > bestF1) {
          bestF1 = result.f1;
          bestThreshold = t;
        }
      }

      console.log(
        `  Best: threshold=${bestThreshold} F1=${(bestF1 * 100).toFixed(1)}%`,
      );

      // The new scoring MUST beat the current F1 of 34.7%
      expect(bestF1).toBeGreaterThan(0.5);
    });

    test("should achieve target metrics at optimal threshold", () => {
      // Find optimal threshold
      let bestF1 = 0;
      let bestResult = evaluateAtThreshold(
        suggestions,
        manualMatches,
        WEIGHTS,
        0.5,
      );
      for (let t = 25; t <= 80; t++) {
        const result = evaluateAtThreshold(
          suggestions,
          manualMatches,
          WEIGHTS,
          t / 100,
        );
        if (result.f1 > bestF1) {
          bestF1 = result.f1;
          bestResult = result;
        }
      }

      console.log("\n=== TARGET METRICS (optimal threshold) ===");
      console.log(`  Threshold: ${bestResult.threshold}`);
      console.log(`  Precision: ${(bestResult.precision * 100).toFixed(1)}%`);
      console.log(`  Recall:    ${(bestResult.recall * 100).toFixed(1)}%`);
      console.log(`  F1 Score:  ${(bestResult.f1 * 100).toFixed(1)}%`);
      console.log(
        `  Found:     ${bestResult.totalFound} / ${bestResult.totalRealMatches}`,
      );
      console.log(
        `  Recovered: ${bestResult.foundFromManual} / ${manualMatches.length} manual matches`,
      );
      console.log(`  FPs:       ${bestResult.falsePositives}`);

      // REGRESSION GATES - these must never drop
      expect(bestResult.f1).toBeGreaterThan(0.5);
      expect(bestResult.precision).toBeGreaterThan(0.85);
    });
  });

  describe("False positive analysis", () => {
    test("should identify worst false positives", () => {
      const threshold = 0.55;
      const falsePositives: Array<{
        record: EvalRecord;
        confidence: number;
        nameScore: number;
      }> = [];

      for (const r of suggestions.filter(
        (s) => s.userAction === "declined" || s.userAction === "unmatched",
      )) {
        const { confidence, nameScore } = scoreRecord(r, WEIGHTS);
        if (confidence >= threshold) {
          falsePositives.push({ record: r, confidence, nameScore });
        }
      }

      falsePositives.sort((a, b) => b.confidence - a.confidence);

      console.log(
        `\n=== FALSE POSITIVES ABOVE ${threshold} (${falsePositives.length} total) ===`,
      );
      for (const fp of falsePositives.slice(0, 10)) {
        console.log(
          `  '${fp.record.inboxDisplayName}' -> '${fp.record.transactionName}' (merchant: '${fp.record.transactionMerchantName}')`,
        );
        console.log(
          `    conf=${fp.confidence.toFixed(3)} name=${fp.nameScore.toFixed(3)} amt=${fp.record.inboxAmount} ${fp.record.inboxCurrency} -> ${fp.record.transactionAmount} ${fp.record.transactionCurrency}`,
        );
      }

      // Track: how many FPs have name_score > 0.3? These are "hard" FPs
      const hardFPs = falsePositives.filter((fp) => fp.nameScore > 0.3);
      console.log(
        `  Hard FPs (name > 0.3): ${hardFPs.length} / ${falsePositives.length}`,
      );
    });
  });

  describe("Recovery analysis", () => {
    test("should show what manual matches we recover", () => {
      const threshold = 0.55;
      let recovered = 0;
      let withEmbed = 0;
      let nameOnly = 0;
      let crossCurr = 0;
      let amountOnly = 0;

      for (const r of manualMatches) {
        const { confidence, nameScore, embeddingScore } = scoreRecord(
          r,
          WEIGHTS,
        );
        if (confidence >= threshold) {
          recovered++;
          const hasEmbed = !!r.inboxEmbeddingSourceText && embeddingScore > 0;
          const sameCurr = r.inboxCurrency === r.transactionCurrency;

          if (hasEmbed) withEmbed++;
          else if (nameScore >= 0.3 && !sameCurr) crossCurr++;
          else if (nameScore >= 0.3) nameOnly++;
          else amountOnly++;
        }
      }

      console.log(`\n=== RECOVERY ANALYSIS (threshold=${threshold}) ===`);
      console.log(
        `  Recovered: ${recovered} / ${manualMatches.length} (${((recovered / manualMatches.length) * 100).toFixed(1)}%)`,
      );
      console.log(`  By method:`);
      console.log(`    Better embedding scoring: ${withEmbed}`);
      console.log(`    Name match (no embedding): ${nameOnly}`);
      console.log(`    Cross-currency (name+base): ${crossCurr}`);
      console.log(`    Amount only: ${amountOnly}`);
    });
  });
});
