import { Pool } from "pg";
import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  calculateNameScore,
  scoreMatch,
} from "../utils/transaction-matching";

type EvalRecord = {
  suggestionId: string;
  inboxId: string;
  transactionId: string;
  dataSource: "suggestion_based" | "manual_match";
  userAction: "confirmed" | "declined" | "unmatched";
  matchType: string;
  confidenceScore: number | null;
  amountScore: number | null;
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
  teamId: string;
};

function toEvalRecord(row: Record<string, unknown>): EvalRecord {
  return {
    suggestionId: String(row.suggestion_id ?? ""),
    inboxId: String(row.inbox_id ?? ""),
    transactionId: String(row.transaction_id ?? ""),
    dataSource:
      (row.data_source as EvalRecord["dataSource"]) ?? "suggestion_based",
    userAction: (row.user_action as EvalRecord["userAction"]) ?? "unmatched",
    matchType: String(row.match_type ?? ""),
    confidenceScore:
      row.confidence_score === null ? null : Number(row.confidence_score ?? 0),
    amountScore:
      row.amount_score === null ? null : Number(row.amount_score ?? 0),
    inboxDisplayName: String(row.inbox_display_name ?? ""),
    inboxAmount: Number(row.inbox_amount ?? 0),
    inboxCurrency: String(row.inbox_currency ?? ""),
    inboxDate: String(row.inbox_date ?? ""),
    inboxWebsite: String(row.inbox_website ?? ""),
    inboxType: String(row.inbox_type ?? ""),
    inboxInvoiceNumber: String(row.inbox_invoice_number ?? ""),
    inboxBaseAmount: Number(row.inbox_base_amount ?? 0),
    inboxBaseCurrency: String(row.inbox_base_currency ?? ""),
    transactionName: String(row.transaction_name ?? ""),
    transactionAmount: Number(row.transaction_amount ?? 0),
    transactionCurrency: String(row.transaction_currency ?? ""),
    transactionDate: String(row.transaction_date ?? ""),
    transactionCounterpartyName: String(
      row.transaction_counterparty_name ?? "",
    ),
    transactionMerchantName: String(row.transaction_merchant_name ?? ""),
    transactionDescription: String(row.transaction_description ?? ""),
    transactionBaseAmount: Number(row.transaction_base_amount ?? 0),
    transactionBaseCurrency: String(row.transaction_base_currency ?? ""),
    transactionCategory: String(row.transaction_category ?? ""),
    transactionRecurring: Boolean(row.transaction_recurring),
    teamId: String(row.team_id ?? ""),
  };
}

function parseArgs(argv: string[]) {
  const options: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1]?.startsWith("--")
      ? "true"
      : (argv[i + 1] ?? "true");
    options[key] = value;
    if (value !== "true") i++;
  }
  return {
    teamId: options["team-id"] ?? null,
    days: Number.parseInt(options.days ?? "180", 10),
    fromDaysAgo: Number.parseInt(
      options["from-days-ago"] ?? options.days ?? "180",
      10,
    ),
    toDaysAgo: Number.parseInt(options["to-days-ago"] ?? "0", 10),
    suggestionLimit: Number.parseInt(
      options["suggestion-limit"] ?? "20000",
      10,
    ),
    manualLimit: Number.parseInt(options["manual-limit"] ?? "20000", 10),
    thresholdMin: Number.parseFloat(options["threshold-min"] ?? "0.25"),
    thresholdMax: Number.parseFloat(options["threshold-max"] ?? "0.80"),
    thresholdStep: Number.parseFloat(options["threshold-step"] ?? "0.01"),
    fixedThreshold:
      options["fixed-threshold"] !== undefined
        ? Number.parseFloat(options["fixed-threshold"])
        : null,
    reviewLimit: Number.parseInt(options["review-limit"] ?? "10", 10),
    showReviewList: options["show-review-list"] === "true",
    statementTimeoutMs: Number.parseInt(
      options["statement-timeout-ms"] ?? "60000",
      10,
    ),
  };
}

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

function scoreRecord(
  r: EvalRecord,
  pairConfirmedCount: Map<string, number>,
  pairDeclinedCount: Map<string, number>,
) {
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

  const amountScore = calculateAmountScore(
    {
      amount: r.inboxAmount,
      currency: r.inboxCurrency || null,
      baseAmount: r.inboxBaseAmount || null,
      baseCurrency: r.inboxBaseCurrency || null,
    },
    {
      amount: r.transactionAmount,
      currency: r.transactionCurrency || null,
      baseAmount: r.transactionBaseAmount || null,
      baseCurrency: r.transactionBaseCurrency || null,
    },
  );

  const currencyScore = calculateCurrencyScore(
    r.inboxCurrency || undefined,
    r.transactionCurrency || undefined,
    r.inboxBaseCurrency || undefined,
    r.transactionBaseCurrency || undefined,
  );

  let dateScore = 0.5;
  try {
    if (r.inboxDate && r.transactionDate) {
      dateScore = calculateDateScore(
        r.inboxDate,
        r.transactionDate,
        r.inboxType,
      );
    }
  } catch {
    dateScore = 0.5;
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

  const confidence = scoreMatch({
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
    isSameCurrency: sameCurrency,
    isExactAmount,
    declinePenalty,
  });

  return { confidence, nameScore };
}

async function fetchRecords(
  pool: Pool,
  opts: ReturnType<typeof parseArgs>,
): Promise<{ suggestions: EvalRecord[]; manualMatches: EvalRecord[] }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(
      `SET LOCAL statement_timeout = '${opts.statementTimeoutMs}ms'`,
    );

    const teamFilterSuggestions = opts.teamId ? "AND s.team_id = $4" : "";
    const teamFilterManual = opts.teamId ? "AND i.team_id = $4" : "";
    const params = opts.teamId
      ? [opts.fromDaysAgo, opts.toDaysAgo, opts.suggestionLimit, opts.teamId]
      : [opts.fromDaysAgo, opts.toDaysAgo, opts.suggestionLimit];
    const manualParams = opts.teamId
      ? [opts.fromDaysAgo, opts.toDaysAgo, opts.manualLimit, opts.teamId]
      : [opts.fromDaysAgo, opts.toDaysAgo, opts.manualLimit];

    const suggestionsSql = `
      SELECT
        s.id::text AS suggestion_id,
        i.id::text AS inbox_id,
        t.id::text AS transaction_id,
        'suggestion_based'::text AS data_source,
        s.status::text AS user_action,
        COALESCE(s.match_type, '')::text AS match_type,
        s.confidence_score::float8 AS confidence_score,
        s.amount_score::float8 AS amount_score,
        COALESCE(i.display_name, '')::text AS inbox_display_name,
        COALESCE(i.amount, 0)::float8 AS inbox_amount,
        COALESCE(i.currency, '')::text AS inbox_currency,
        COALESCE(i.date::text, '')::text AS inbox_date,
        COALESCE(i.website, '')::text AS inbox_website,
        COALESCE(i.type::text, '')::text AS inbox_type,
        COALESCE(i.invoice_number, '')::text AS inbox_invoice_number,
        COALESCE(i.base_amount, 0)::float8 AS inbox_base_amount,
        COALESCE(i.base_currency, '')::text AS inbox_base_currency,
        COALESCE(t.name, '')::text AS transaction_name,
        COALESCE(t.amount, 0)::float8 AS transaction_amount,
        COALESCE(t.currency, '')::text AS transaction_currency,
        COALESCE(t.date::text, '')::text AS transaction_date,
        COALESCE(t.counterparty_name, '')::text AS transaction_counterparty_name,
        COALESCE(t.merchant_name, '')::text AS transaction_merchant_name,
        COALESCE(t.description, '')::text AS transaction_description,
        COALESCE(t.base_amount, 0)::float8 AS transaction_base_amount,
        COALESCE(t.base_currency, '')::text AS transaction_base_currency,
        COALESCE(t.category::text, '')::text AS transaction_category,
        COALESCE(t.recurring, false)::boolean AS transaction_recurring,
        s.team_id::text AS team_id
      FROM transaction_match_suggestions s
      JOIN inbox i ON i.id = s.inbox_id
      JOIN transactions t ON t.id = s.transaction_id
      WHERE s.status IN ('confirmed', 'declined', 'unmatched')
        AND s.created_at <= NOW() - ($2::int || ' days')::interval
        AND s.created_at > NOW() - ($1::int || ' days')::interval
        ${teamFilterSuggestions}
      ORDER BY s.created_at DESC
      LIMIT $3::int
    `;

    const manualSql = `
      SELECT
        ''::text AS suggestion_id,
        i.id::text AS inbox_id,
        t.id::text AS transaction_id,
        'manual_match'::text AS data_source,
        'confirmed'::text AS user_action,
        'manual'::text AS match_type,
        NULL::float8 AS confidence_score,
        NULL::float8 AS amount_score,
        COALESCE(i.display_name, '')::text AS inbox_display_name,
        COALESCE(i.amount, 0)::float8 AS inbox_amount,
        COALESCE(i.currency, '')::text AS inbox_currency,
        COALESCE(i.date::text, '')::text AS inbox_date,
        COALESCE(i.website, '')::text AS inbox_website,
        COALESCE(i.type::text, '')::text AS inbox_type,
        COALESCE(i.invoice_number, '')::text AS inbox_invoice_number,
        COALESCE(i.base_amount, 0)::float8 AS inbox_base_amount,
        COALESCE(i.base_currency, '')::text AS inbox_base_currency,
        COALESCE(t.name, '')::text AS transaction_name,
        COALESCE(t.amount, 0)::float8 AS transaction_amount,
        COALESCE(t.currency, '')::text AS transaction_currency,
        COALESCE(t.date::text, '')::text AS transaction_date,
        COALESCE(t.counterparty_name, '')::text AS transaction_counterparty_name,
        COALESCE(t.merchant_name, '')::text AS transaction_merchant_name,
        COALESCE(t.description, '')::text AS transaction_description,
        COALESCE(t.base_amount, 0)::float8 AS transaction_base_amount,
        COALESCE(t.base_currency, '')::text AS transaction_base_currency,
        COALESCE(t.category::text, '')::text AS transaction_category,
        COALESCE(t.recurring, false)::boolean AS transaction_recurring,
        i.team_id::text AS team_id
      FROM inbox i
      JOIN transactions t ON t.id = i.transaction_id
      WHERE i.transaction_id IS NOT NULL
        AND COALESCE(i.status::text, '') <> 'deleted'
        AND i.created_at <= NOW() - ($2::int || ' days')::interval
        AND i.created_at > NOW() - ($1::int || ' days')::interval
        ${teamFilterManual}
        AND NOT EXISTS (
          SELECT 1
          FROM transaction_match_suggestions s
          WHERE s.inbox_id = i.id
            AND s.transaction_id = i.transaction_id
        )
      ORDER BY i.created_at DESC
      LIMIT $3::int
    `;

    const suggestionsRows = await client.query(suggestionsSql, params);
    const manualRows = await client.query(manualSql, manualParams);

    await client.query("ROLLBACK");
    return {
      suggestions: suggestionsRows.rows.map((row) =>
        toEvalRecord(row as Record<string, unknown>),
      ),
      manualMatches: manualRows.rows.map((row) =>
        toEvalRecord(row as Record<string, unknown>),
      ),
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}

function evaluateAtThreshold(
  suggestions: EvalRecord[],
  manualMatches: EvalRecord[],
  threshold: number,
  pairConfirmedCount: Map<string, number>,
  pairDeclinedCount: Map<string, number>,
) {
  const totalRealMatches =
    suggestions.filter((r) => r.userAction === "confirmed").length +
    manualMatches.length;

  let foundFromSuggestions = 0;
  let foundFromManual = 0;
  let falsePositives = 0;
  for (const r of suggestions) {
    const { confidence } = scoreRecord(
      r,
      pairConfirmedCount,
      pairDeclinedCount,
    );
    if (confidence >= threshold) {
      if (r.userAction === "confirmed") foundFromSuggestions++;
      else falsePositives++;
    }
  }
  for (const r of manualMatches) {
    const { confidence } = scoreRecord(
      r,
      pairConfirmedCount,
      pairDeclinedCount,
    );
    if (confidence >= threshold) foundFromManual++;
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
    threshold,
    precision,
    recall,
    f1,
    totalFound,
    totalRealMatches,
    falsePositives,
    foundFromSuggestions,
    foundFromManual,
  };
}

function printReviewList(
  suggestions: EvalRecord[],
  threshold: number,
  pairConfirmedCount: Map<string, number>,
  pairDeclinedCount: Map<string, number>,
  reviewLimit: number,
) {
  const scored = suggestions.map((record) => ({
    record,
    ...scoreRecord(record, pairConfirmedCount, pairDeclinedCount),
  }));

  const likelyFalsePositives = scored
    .filter(
      (x) =>
        (x.record.userAction === "declined" ||
          x.record.userAction === "unmatched") &&
        x.confidence >= threshold,
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, reviewLimit);

  const likelyFalseNegatives = scored
    .filter(
      (x) => x.record.userAction === "confirmed" && x.confidence < threshold,
    )
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, reviewLimit);

  console.log("");
  console.log("Review list (easy confirm)");
  console.log(
    "Use suggestion_id/inbox_id/transaction_id to open and verify each pair in the app.",
  );

  console.log("");
  console.log(
    `A) Likely false positives (label declined/unmatched, score >= ${threshold.toFixed(3)})`,
  );
  if (likelyFalsePositives.length === 0) {
    console.log("  None");
  } else {
    for (const item of likelyFalsePositives) {
      const r = item.record;
      console.log(
        `  - suggestion_id=${r.suggestionId} inbox_id=${r.inboxId} transaction_id=${r.transactionId} conf=${item.confidence.toFixed(3)}`,
      );
      console.log(
        `    inbox='${r.inboxDisplayName}' ${r.inboxAmount} ${r.inboxCurrency} | txn='${r.transactionMerchantName || r.transactionName}' ${r.transactionAmount} ${r.transactionCurrency}`,
      );
    }
  }

  console.log("");
  console.log(
    `B) Likely false negatives (label confirmed, score < ${threshold.toFixed(3)})`,
  );
  if (likelyFalseNegatives.length === 0) {
    console.log("  None");
  } else {
    for (const item of likelyFalseNegatives) {
      const r = item.record;
      console.log(
        `  - suggestion_id=${r.suggestionId} inbox_id=${r.inboxId} transaction_id=${r.transactionId} conf=${item.confidence.toFixed(3)}`,
      );
      console.log(
        `    inbox='${r.inboxDisplayName}' ${r.inboxAmount} ${r.inboxCurrency} | txn='${r.transactionMerchantName || r.transactionName}' ${r.transactionAmount} ${r.transactionCurrency}`,
      );
    }
  }
}

async function main() {
  if (Bun.argv.includes("--help") || Bun.argv.includes("-h")) {
    console.log("DB-only matching evaluation (read-only)");
    console.log("Usage:");
    console.log("  bun run eval:matching:db [options]");
    console.log("Options:");
    console.log("  --team-id <uuid>              Limit evaluation to one team");
    console.log(
      "  --days <n>                    Lookback window in days (default: 180)",
    );
    console.log(
      "  --from-days-ago <n>           Window start (older bound, default: --days)",
    );
    console.log(
      "  --to-days-ago <n>             Window end (recent bound, default: 0)",
    );
    console.log(
      "  --suggestion-limit <n>        Max suggestion rows (default: 20000)",
    );
    console.log(
      "  --manual-limit <n>            Max manual rows (default: 20000)",
    );
    console.log(
      "  --threshold-min <n>           Min threshold (default: 0.25)",
    );
    console.log(
      "  --threshold-max <n>           Max threshold (default: 0.80)",
    );
    console.log(
      "  --threshold-step <n>          Threshold step (default: 0.01)",
    );
    console.log(
      "  --fixed-threshold <n>         Evaluate only this threshold (no sweep)",
    );
    console.log(
      "  --show-review-list true       Print top mismatches for manual verification",
    );
    console.log(
      "  --review-limit <n>            Number of rows per review section (default: 10)",
    );
    console.log(
      "  --statement-timeout-ms <n>    DB statement timeout (default: 60000)",
    );
    console.log("");
    console.log("Required env:");
    console.log("  DATABASE_PRIMARY_URL or DATABASE_URL");
    return;
  }

  const opts = parseArgs(Bun.argv.slice(2));
  if (opts.fromDaysAgo <= opts.toDaysAgo) {
    throw new Error("--from-days-ago must be greater than --to-days-ago");
  }
  const dbUrl = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_PRIMARY_URL or DATABASE_URL is required");
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl:
      process.env.NODE_ENV === "development"
        ? false
        : { rejectUnauthorized: false },
    max: 2,
  });

  try {
    const { suggestions, manualMatches } = await fetchRecords(pool, opts);
    const pairConfirmedCount = new Map<string, number>();
    const pairDeclinedCount = new Map<string, number>();

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

    console.log("Matching eval (DB read-only)");
    console.log(
      `Loaded ${suggestions.length} suggestion rows + ${manualMatches.length} manual rows`,
    );
    console.log(
      `Scope: window=(${opts.fromDaysAgo}d -> ${opts.toDaysAgo}d)${opts.teamId ? ` teamId=${opts.teamId}` : " all-teams"}`,
    );

    if (opts.fixedThreshold !== null) {
      const fixed = evaluateAtThreshold(
        suggestions,
        manualMatches,
        opts.fixedThreshold,
        pairConfirmedCount,
        pairDeclinedCount,
      );
      console.log("Fixed threshold result");
      console.log(`  Threshold: ${fixed.threshold.toFixed(3)}`);
      console.log(`  Precision: ${(fixed.precision * 100).toFixed(1)}%`);
      console.log(`  Recall:    ${(fixed.recall * 100).toFixed(1)}%`);
      console.log(`  F1:        ${(fixed.f1 * 100).toFixed(1)}%`);
      console.log(
        `  Found:     ${fixed.totalFound} / ${fixed.totalRealMatches}`,
      );
      console.log(`  FalsePos:  ${fixed.falsePositives}`);
      console.log(`  Suggested: ${fixed.foundFromSuggestions}`);
      console.log(`  Manual:    ${fixed.foundFromManual}`);
      if (opts.showReviewList) {
        printReviewList(
          suggestions,
          fixed.threshold,
          pairConfirmedCount,
          pairDeclinedCount,
          opts.reviewLimit,
        );
      }
    } else {
      let best: ReturnType<typeof evaluateAtThreshold> | null = null;

      for (
        let t = opts.thresholdMin;
        t <= opts.thresholdMax + 1e-9;
        t += opts.thresholdStep
      ) {
        const threshold = Math.round(t * 10000) / 10000;
        const result = evaluateAtThreshold(
          suggestions,
          manualMatches,
          threshold,
          pairConfirmedCount,
          pairDeclinedCount,
        );
        if (!best || result.f1 > best.f1) best = result;
      }

      if (!best) {
        console.log("No results");
        return;
      }

      console.log("Best threshold result");
      console.log(`  Threshold: ${best.threshold.toFixed(3)}`);
      console.log(`  Precision: ${(best.precision * 100).toFixed(1)}%`);
      console.log(`  Recall:    ${(best.recall * 100).toFixed(1)}%`);
      console.log(`  F1:        ${(best.f1 * 100).toFixed(1)}%`);
      console.log(`  Found:     ${best.totalFound} / ${best.totalRealMatches}`);
      console.log(`  FalsePos:  ${best.falsePositives}`);
      console.log(`  Suggested: ${best.foundFromSuggestions}`);
      console.log(`  Manual:    ${best.foundFromManual}`);
      if (opts.showReviewList) {
        printReviewList(
          suggestions,
          best.threshold,
          pairConfirmedCount,
          pairDeclinedCount,
          opts.reviewLimit,
        );
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("matching-eval-db failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
