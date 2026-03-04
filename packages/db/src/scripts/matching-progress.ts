#!/usr/bin/env bun
/**
 * Matching Progress CLI
 *
 * Run regularly against production data (read-only) to track whether
 * matching quality is improving. Each run is saved to a local history
 * file so you can see trends over time.
 *
 * Usage:
 *   bun run eval:progress --live --team-id <uuid>   # evaluate against real inbox/transaction data
 *   bun run eval:progress --live --team-id <uuid> --sweep
 *   bun run eval:progress                           # legacy: evaluate against suggestion history
 *   bun run eval:progress --history                 # just print past runs
 *
 * Requires: DATABASE_PRIMARY_URL or DATABASE_URL
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import {
  calculateAmountScore,
  calculateCurrencyScore,
  calculateDateScore,
  calculateNameScore,
  scoreMatch,
} from "../utils/transaction-matching";

// ─── ANSI helpers ───────────────────────────────────────

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;

// ─── Types ──────────────────────────────────────────────

type EvalRecord = {
  suggestionId: string;
  inboxId: string;
  transactionId: string;
  dataSource: "suggestion_based" | "manual_match";
  userAction: "confirmed" | "declined" | "unmatched";
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
  transactionMerchantName: string;
  transactionDescription: string;
  transactionBaseAmount: number;
  transactionBaseCurrency: string;
  oldConfidenceScore: number | null;
  teamId: string;
};

type ScoredRecord = EvalRecord & {
  confidence: number;
  nameScore: number;
};

type RunSnapshot = {
  runId: number;
  timestamp: string;
  gitHash: string;
  suggestedThreshold: number;
  autoThreshold: number;
  precision: number;
  recall: number;
  f1: number;
  falsePositives: number;
  falseNegatives: number;
  totalRealMatches: number;
  totalPairs: number;
  autoPrecision: number;
  autoMatchCount: number;
  autoFalsePositives: number;
  avgConfidenceConfirmed: number;
  avgConfidenceDeclined: number;
  bestThreshold: number;
  bestF1: number;
  scope: {
    teamId: string | null;
    fromDaysAgo: number;
    toDaysAgo: number;
    suggestionCount: number;
    manualCount: number;
  };
};

// ─── Arg parsing ────────────────────────────────────────

function parseArgs() {
  const argv = Bun.argv.slice(2);
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      booleans.add(key);
    } else {
      flags[key] = next;
      i++;
    }
  }

  return {
    teamId: flags["team-id"] ?? null,
    fromDaysAgo: Number.parseInt(
      flags["from-days-ago"] ?? flags.days ?? "180",
      10,
    ),
    toDaysAgo: Number.parseInt(flags["to-days-ago"] ?? "0", 10),
    suggestionLimit: Number.parseInt(flags["suggestion-limit"] ?? "20000", 10),
    manualLimit: Number.parseInt(flags["manual-limit"] ?? "20000", 10),
    suggestedThreshold: flags.threshold
      ? Number.parseFloat(flags.threshold)
      : 0.6,
    autoThreshold: flags["auto-threshold"]
      ? Number.parseFloat(flags["auto-threshold"])
      : 0.9,
    sweep: booleans.has("sweep"),
    historyOnly: booleans.has("history"),
    noSave: booleans.has("no-save"),
    errorCount: Number.parseInt(flags.errors ?? "5", 10),
    help: booleans.has("help") || booleans.has("h"),
    live: booleans.has("live"),
    limit: Number.parseInt(flags.limit ?? "500", 10),
  };
}

// ─── History persistence ────────────────────────────────

const HISTORY_PATH = join(
  // @ts-expect-error
  dirname(fileURLToPath(new URL(".", import.meta.url))),
  ".matching-eval-history.json",
);

function loadHistory(): RunSnapshot[] {
  if (!existsSync(HISTORY_PATH)) return [];
  try {
    return JSON.parse(readFileSync(HISTORY_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function saveHistory(history: RunSnapshot[]) {
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function getGitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

// ─── DB fetch (read-only) ───────────────────────────────

function toRecord(row: Record<string, unknown>): EvalRecord {
  return {
    suggestionId: String(row.suggestion_id ?? ""),
    inboxId: String(row.inbox_id ?? ""),
    transactionId: String(row.transaction_id ?? ""),
    dataSource:
      (row.data_source as EvalRecord["dataSource"]) ?? "suggestion_based",
    userAction: (row.user_action as EvalRecord["userAction"]) ?? "unmatched",
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
    transactionMerchantName: String(row.transaction_merchant_name ?? ""),
    transactionDescription: String(row.transaction_description ?? ""),
    transactionBaseAmount: Number(row.transaction_base_amount ?? 0),
    transactionBaseCurrency: String(row.transaction_base_currency ?? ""),
    oldConfidenceScore:
      row.confidence_score === null ? null : Number(row.confidence_score ?? 0),
    teamId: String(row.team_id ?? ""),
  };
}

async function fetchRecords(
  pool: Pool,
  opts: ReturnType<typeof parseArgs>,
): Promise<{ suggestions: EvalRecord[]; manualMatches: EvalRecord[] }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '90s'");

    const teamFilter = opts.teamId ? "AND s.team_id = $4" : "";
    const teamFilterManual = opts.teamId ? "AND i.team_id = $4" : "";
    const params = opts.teamId
      ? [opts.fromDaysAgo, opts.toDaysAgo, opts.suggestionLimit, opts.teamId]
      : [opts.fromDaysAgo, opts.toDaysAgo, opts.suggestionLimit];
    const manualParams = opts.teamId
      ? [opts.fromDaysAgo, opts.toDaysAgo, opts.manualLimit, opts.teamId]
      : [opts.fromDaysAgo, opts.toDaysAgo, opts.manualLimit];

    const suggestionsResult = await client.query(
      `SELECT
        s.id::text AS suggestion_id,
        i.id::text AS inbox_id,
        t.id::text AS transaction_id,
        'suggestion_based'::text AS data_source,
        s.status::text AS user_action,
        s.confidence_score::float8 AS confidence_score,
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
        COALESCE(t.merchant_name, '')::text AS transaction_merchant_name,
        COALESCE(t.description, '')::text AS transaction_description,
        COALESCE(t.base_amount, 0)::float8 AS transaction_base_amount,
        COALESCE(t.base_currency, '')::text AS transaction_base_currency,
        s.team_id::text AS team_id
      FROM transaction_match_suggestions s
      JOIN inbox i ON i.id = s.inbox_id
      JOIN transactions t ON t.id = s.transaction_id
      WHERE s.status IN ('confirmed', 'declined', 'unmatched')
        AND s.created_at <= NOW() - ($2::int || ' days')::interval
        AND s.created_at > NOW() - ($1::int || ' days')::interval
        ${teamFilter}
      ORDER BY s.created_at DESC
      LIMIT $3::int`,
      params,
    );

    const manualResult = await client.query(
      `SELECT
        ''::text AS suggestion_id,
        i.id::text AS inbox_id,
        t.id::text AS transaction_id,
        'manual_match'::text AS data_source,
        'confirmed'::text AS user_action,
        NULL::float8 AS confidence_score,
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
        COALESCE(t.merchant_name, '')::text AS transaction_merchant_name,
        COALESCE(t.description, '')::text AS transaction_description,
        COALESCE(t.base_amount, 0)::float8 AS transaction_base_amount,
        COALESCE(t.base_currency, '')::text AS transaction_base_currency,
        i.team_id::text AS team_id
      FROM inbox i
      JOIN transactions t ON t.id = i.transaction_id
      WHERE i.transaction_id IS NOT NULL
        AND COALESCE(i.status::text, '') <> 'deleted'
        AND i.created_at <= NOW() - ($2::int || ' days')::interval
        AND i.created_at > NOW() - ($1::int || ' days')::interval
        ${teamFilterManual}
        AND NOT EXISTS (
          SELECT 1 FROM transaction_match_suggestions s
          WHERE s.inbox_id = i.id AND s.transaction_id = i.transaction_id
        )
      ORDER BY i.created_at DESC
      LIMIT $3::int`,
      manualParams,
    );

    await client.query("ROLLBACK");

    return {
      suggestions: suggestionsResult.rows.map((r) =>
        toRecord(r as Record<string, unknown>),
      ),
      manualMatches: manualResult.rows.map((r) =>
        toRecord(r as Record<string, unknown>),
      ),
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// ─── Scoring ────────────────────────────────────────────

function normalizeName(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[.,\-_'"()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pairKey(inboxName: string, txnName: string): string {
  return `${normalizeName(inboxName)}|||${normalizeName(txnName)}`;
}

function extractDomainToken(url: string): string {
  if (!url) return "";
  const cleaned = url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
  return cleaned?.split(".")[0]?.toLowerCase() ?? "";
}

function buildPairCounts(suggestions: EvalRecord[]) {
  const confirmed = new Map<string, number>();
  const declined = new Map<string, number>();

  for (const r of suggestions) {
    const key = pairKey(
      r.inboxDisplayName,
      r.transactionMerchantName || r.transactionName,
    );
    if (r.userAction === "confirmed") {
      confirmed.set(key, (confirmed.get(key) ?? 0) + 1);
    } else {
      declined.set(key, (declined.get(key) ?? 0) + 1);
    }
  }

  return { confirmed, declined };
}

function scoreRecord(
  r: EvalRecord,
  pairConfirmed: Map<string, number>,
  pairDeclined: Map<string, number>,
): ScoredRecord {
  const txnPrimary = r.transactionMerchantName || r.transactionName;
  const key = pairKey(r.inboxDisplayName, txnPrimary);
  const confirmedCount = pairConfirmed.get(key) ?? 0;
  const declinedCount = pairDeclined.get(key) ?? 0;
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

  const isSameCurrency = r.inboxCurrency === r.transactionCurrency;
  const isExactAmount =
    Math.abs(r.inboxAmount) > 0 &&
    Math.abs(r.transactionAmount) > 0 &&
    Math.abs(Math.abs(r.inboxAmount) - Math.abs(r.transactionAmount)) < 0.01;

  const invoiceNumber = normalizeName(r.inboxInvoiceNumber);
  const searchable = normalizeName(
    `${r.transactionName} ${r.transactionMerchantName} ${r.transactionDescription}`,
  );
  if (invoiceNumber.length >= 4 && searchable.includes(invoiceNumber)) {
    nameScore = Math.max(nameScore, 0.95);
  }
  const domain = extractDomainToken(r.inboxWebsite);
  if (domain.length >= 4 && searchable.includes(domain)) {
    nameScore = Math.max(nameScore, 0.88);
  }

  const confidence = scoreMatch({
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
    isSameCurrency,
    isExactAmount,
    declinePenalty,
  });

  return { ...r, confidence, nameScore };
}

// ─── Metrics ────────────────────────────────────────────

function computeMetrics(
  scored: ScoredRecord[],
  manualScored: ScoredRecord[],
  threshold: number,
) {
  const totalRealMatches =
    scored.filter((r) => r.userAction === "confirmed").length +
    manualScored.length;

  let found = 0;
  let foundManual = 0;
  let fp = 0;

  for (const r of scored) {
    if (r.confidence >= threshold) {
      if (r.userAction === "confirmed") found++;
      else fp++;
    }
  }
  for (const r of manualScored) {
    if (r.confidence >= threshold) foundManual++;
  }

  const totalFound = found + foundManual;
  const totalSuggested = totalFound + fp;
  const precision = totalSuggested > 0 ? totalFound / totalSuggested : 0;
  const recall = totalRealMatches > 0 ? totalFound / totalRealMatches : 0;
  const f1 =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  const fn = totalRealMatches - totalFound;

  return {
    precision,
    recall,
    f1,
    falsePositives: fp,
    falseNegatives: fn,
    totalFound,
    totalRealMatches,
  };
}

function sweepThresholds(scored: ScoredRecord[], manualScored: ScoredRecord[]) {
  let best = { threshold: 0.6, f1: 0, precision: 0, recall: 0 };
  const rows: Array<{
    threshold: number;
    precision: number;
    recall: number;
    f1: number;
    fp: number;
  }> = [];

  for (let t = 0.3; t <= 0.95; t += 0.05) {
    const threshold = Math.round(t * 100) / 100;
    const m = computeMetrics(scored, manualScored, threshold);
    rows.push({
      threshold,
      precision: m.precision,
      recall: m.recall,
      f1: m.f1,
      fp: m.falsePositives,
    });
    if (m.f1 > best.f1 || (m.f1 === best.f1 && m.precision > best.precision)) {
      best = { threshold, f1: m.f1, precision: m.precision, recall: m.recall };
    }
  }

  return { rows, best };
}

// ─── Output formatting ─────────────────────────────────

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function delta(current: number, previous: number, asPct = true): string {
  const diff = current - previous;
  if (Math.abs(diff) < 0.0005) return dim("  ─");
  const sign = diff > 0 ? "+" : "";
  const value = asPct ? `${sign}${(diff * 100).toFixed(1)}%` : `${sign}${diff}`;
  const arrow = diff > 0 ? green("▲") : red("▼");
  return `${arrow} ${diff > 0 ? green(value) : red(value)}`;
}

function deltaInt(
  current: number,
  previous: number,
  lowerIsBetter = true,
): string {
  const diff = current - previous;
  if (diff === 0) return dim("  ─");
  const sign = diff > 0 ? "+" : "";
  const improved = lowerIsBetter ? diff < 0 : diff > 0;
  const value = `${sign}${diff}`;
  const arrow = improved ? green("▲") : red("▼");
  return `${arrow} ${improved ? green(value) : red(value)}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function printReport(
  snapshot: RunSnapshot,
  scored: ScoredRecord[],
  manualScored: ScoredRecord[],
  previous: RunSnapshot | null,
  opts: ReturnType<typeof parseArgs>,
) {
  const line = dim("─".repeat(62));
  const dblLine = dim("═".repeat(62));

  console.log("");
  console.log(dblLine);
  console.log(bold("  Matching Progress Report"));
  console.log(
    dim(
      `  Run #${snapshot.runId} · ${snapshot.timestamp.slice(0, 10)} · ${snapshot.gitHash}`,
    ),
  );
  console.log(dblLine);
  console.log("");

  // Dataset overview
  const scope = snapshot.scope;
  console.log(
    `  Dataset   ${bold(String(scope.suggestionCount))} suggestions + ${bold(String(scope.manualCount))} manual matches`,
  );
  console.log(
    `  Scope     last ${scope.fromDaysAgo} days${scope.teamId ? ` · team ${scope.teamId.slice(0, 8)}…` : " · all teams"}`,
  );
  console.log(
    `  Matches   ${bold(String(snapshot.totalRealMatches))} confirmed real matches in dataset`,
  );
  console.log("");

  // Suggested threshold metrics
  console.log(`  ${line}`);
  console.log(
    bold(`  Suggested Threshold (${snapshot.suggestedThreshold.toFixed(2)})`),
  );
  console.log(`  ${line}`);
  console.log("");

  const p = previous;
  console.log(
    `  Precision     ${bold(pct(snapshot.precision))}     ${p ? delta(snapshot.precision, p.precision) : ""}`,
  );
  console.log(
    `  Recall        ${bold(pct(snapshot.recall))}     ${p ? delta(snapshot.recall, p.recall) : ""}`,
  );
  console.log(
    `  F1 Score      ${bold(pct(snapshot.f1))}     ${p ? delta(snapshot.f1, p.f1) : ""}`,
  );
  console.log(
    `  False Pos     ${bold(String(snapshot.falsePositives).padStart(5))}     ${p ? deltaInt(snapshot.falsePositives, p.falsePositives, true) : ""}`,
  );
  console.log(
    `  False Neg     ${bold(String(snapshot.falseNegatives).padStart(5))}     ${p ? deltaInt(snapshot.falseNegatives, p.falseNegatives, true) : ""}`,
  );
  console.log("");

  // Auto-match threshold metrics
  console.log(`  ${line}`);
  console.log(
    bold(`  Auto-Match Threshold (${snapshot.autoThreshold.toFixed(2)})`),
  );
  console.log(`  ${line}`);
  console.log("");
  console.log(
    `  Precision     ${bold(pct(snapshot.autoPrecision))}     ${p ? delta(snapshot.autoPrecision, p.autoPrecision) : ""}`,
  );
  console.log(
    `  Would auto    ${bold(String(snapshot.autoMatchCount))} of ${snapshot.totalRealMatches}  (${pct(snapshot.totalRealMatches > 0 ? snapshot.autoMatchCount / snapshot.totalRealMatches : 0)})`,
  );
  console.log(
    `  False Pos     ${bold(String(snapshot.autoFalsePositives).padStart(5))}     ${p ? deltaInt(snapshot.autoFalsePositives, p.autoFalsePositives, true) : ""}`,
  );
  console.log("");

  // Confidence distribution
  console.log(`  ${line}`);
  console.log(bold("  Confidence Distribution"));
  console.log(`  ${line}`);
  console.log("");
  const gap = snapshot.avgConfidenceConfirmed - snapshot.avgConfidenceDeclined;
  console.log(
    `  Avg confirmed  ${bold(snapshot.avgConfidenceConfirmed.toFixed(3))}`,
  );
  console.log(
    `  Avg declined   ${bold(snapshot.avgConfidenceDeclined.toFixed(3))}`,
  );
  console.log(
    `  Gap            ${bold(gap.toFixed(3))}  ${gap > 0.3 ? green("(good separation)") : gap > 0.15 ? yellow("(moderate)") : red("(poor — hard to separate)")}`,
  );
  console.log("");

  // Best threshold from sweep
  console.log(`  ${line}`);
  console.log(bold("  Optimal Threshold (sweep)"));
  console.log(`  ${line}`);
  console.log("");
  console.log(
    `  Best threshold ${bold(snapshot.bestThreshold.toFixed(2))}  →  F1 ${bold(pct(snapshot.bestF1))}`,
  );
  console.log("");

  // Threshold sweep table
  if (opts.sweep) {
    const { rows } = sweepThresholds(scored, manualScored);
    console.log(`  ${line}`);
    console.log(bold("  Threshold Sweep"));
    console.log(`  ${line}`);
    console.log("");
    console.log(dim("  Thresh   Precision   Recall      F1     FP"));
    for (const row of rows) {
      const marker =
        Math.abs(row.threshold - snapshot.suggestedThreshold) < 0.005
          ? " ←"
          : "";
      console.log(
        `  ${row.threshold.toFixed(2)}     ${pct(row.precision).padStart(6)}    ${pct(row.recall).padStart(6)}    ${pct(row.f1).padStart(6)}   ${String(row.fp).padStart(4)}${marker}`,
      );
    }
    console.log("");
  }

  // Error examples
  printErrors(scored, snapshot.suggestedThreshold, opts.errorCount);

  // History
  printHistory(snapshot);

  console.log(dblLine);
  console.log("");
}

function printErrors(scored: ScoredRecord[], threshold: number, limit: number) {
  const fps = scored
    .filter(
      (r) =>
        r.confidence >= threshold &&
        (r.userAction === "declined" || r.userAction === "unmatched"),
    )
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);

  const fns = scored
    .filter((r) => r.confidence < threshold && r.userAction === "confirmed")
    .sort((a, b) => a.confidence - b.confidence)
    .slice(0, limit);

  const line = dim("─".repeat(62));

  console.log(`  ${line}`);
  console.log(
    bold(`  False Positives`) +
      dim(` (declined/unmatched, score ≥ ${threshold.toFixed(2)})`),
  );
  console.log(`  ${line}`);
  console.log("");

  if (fps.length === 0) {
    console.log(green("  None!"));
  } else {
    for (const r of fps) {
      console.log(
        `  ${red("✗")} conf=${bold(r.confidence.toFixed(3))}  name=${r.nameScore.toFixed(2)}`,
      );
      console.log(
        `    inbox  ${dim(truncate(r.inboxDisplayName || "(empty)", 28))}  ${r.inboxAmount} ${r.inboxCurrency}`,
      );
      console.log(
        `    txn    ${dim(truncate(r.transactionMerchantName || r.transactionName || "(empty)", 28))}  ${r.transactionAmount} ${r.transactionCurrency}`,
      );
      if (r.oldConfidenceScore !== null) {
        console.log(
          `    ${dim(`old_conf=${r.oldConfidenceScore.toFixed(3)}`)}`,
        );
      }
      console.log("");
    }
  }

  console.log(`  ${line}`);
  console.log(
    bold(`  False Negatives`) +
      dim(` (confirmed, score < ${threshold.toFixed(2)})`),
  );
  console.log(`  ${line}`);
  console.log("");

  if (fns.length === 0) {
    console.log(green("  None!"));
  } else {
    for (const r of fns) {
      console.log(
        `  ${yellow("?")} conf=${bold(r.confidence.toFixed(3))}  name=${r.nameScore.toFixed(2)}`,
      );
      console.log(
        `    inbox  ${dim(truncate(r.inboxDisplayName || "(empty)", 28))}  ${r.inboxAmount} ${r.inboxCurrency}`,
      );
      console.log(
        `    txn    ${dim(truncate(r.transactionMerchantName || r.transactionName || "(empty)", 28))}  ${r.transactionAmount} ${r.transactionCurrency}`,
      );
      if (r.oldConfidenceScore !== null) {
        console.log(
          `    ${dim(`old_conf=${r.oldConfidenceScore.toFixed(3)}`)}`,
        );
      }
      console.log("");
    }
  }
}

function printHistory(current: RunSnapshot) {
  const history = loadHistory();
  const recent = history.slice(-7);

  const line = dim("─".repeat(62));

  console.log(`  ${line}`);
  console.log(bold("  History"));
  console.log(`  ${line}`);
  console.log("");

  if (recent.length === 0) {
    console.log(dim("  No previous runs recorded."));
  } else {
    console.log(dim("  Run   Date         P        R        F1       FP"));
    for (const r of recent) {
      const isCurrent = r.runId === current.runId;
      const prefix = isCurrent ? cyan("→") : " ";
      const suffix = isCurrent ? cyan(" ← current") : "";
      console.log(
        `  ${prefix} #${String(r.runId).padStart(2)}  ${r.timestamp.slice(0, 10)}   ${pct(r.precision).padStart(6)}   ${pct(r.recall).padStart(6)}   ${pct(r.f1).padStart(6)}   ${String(r.falsePositives).padStart(4)}${suffix}`,
      );
    }
  }
  console.log("");
}

// ─── Live evaluation types ──────────────────────────────

type InboxItem = {
  id: string;
  displayName: string;
  amount: number;
  currency: string;
  date: string;
  type: string;
  website: string;
  invoiceNumber: string;
  baseAmount: number;
  baseCurrency: string;
  matchedTransactionId: string | null;
};

type Txn = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
  merchantName: string;
  description: string;
  counterpartyName: string;
  baseAmount: number;
  baseCurrency: string;
};

type ScoredCandidate = {
  transaction: Txn;
  confidence: number;
  nameScore: number;
  amountScore: number;
  dateScore: number;
  currencyScore: number;
};

type LiveResult = {
  inbox: InboxItem;
  correctMatch: ScoredCandidate | null;
  rank: number | null;
  candidateCount: number;
  topCandidate: ScoredCandidate | null;
};

// ─── Live data fetching ─────────────────────────────────

async function fetchLiveData(
  pool: Pool,
  teamId: string,
  opts: ReturnType<typeof parseArgs>,
): Promise<{
  matchedInbox: InboxItem[];
  unmatchedInbox: InboxItem[];
  transactions: Txn[];
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '90s'");

    const inboxResult = await client.query(
      `SELECT
        i.id::text,
        COALESCE(i.display_name, '')::text AS display_name,
        COALESCE(i.amount, 0)::float8 AS amount,
        COALESCE(i.currency, '')::text AS currency,
        COALESCE(i.date::text, '')::text AS date,
        COALESCE(i.type::text, 'expense')::text AS type,
        COALESCE(i.website, '')::text AS website,
        COALESCE(i.invoice_number, '')::text AS invoice_number,
        COALESCE(i.base_amount, 0)::float8 AS base_amount,
        COALESCE(i.base_currency, '')::text AS base_currency,
        i.transaction_id::text AS matched_transaction_id
      FROM inbox i
      WHERE i.team_id = $1
        AND i.date IS NOT NULL
        AND COALESCE(i.status::text, '') NOT IN ('deleted', 'spam')
        AND i.created_at > NOW() - ($2::int || ' days')::interval
      ORDER BY i.created_at DESC
      LIMIT $3::int`,
      [teamId, opts.fromDaysAgo, opts.limit],
    );

    const txnResult = await client.query(
      `SELECT
        t.id::text,
        COALESCE(t.name, '')::text AS name,
        COALESCE(t.amount, 0)::float8 AS amount,
        COALESCE(t.currency, '')::text AS currency,
        COALESCE(t.date::text, '')::text AS date,
        COALESCE(t.merchant_name, '')::text AS merchant_name,
        COALESCE(t.description, '')::text AS description,
        COALESCE(t.counterparty_name, '')::text AS counterparty_name,
        COALESCE(t.base_amount, 0)::float8 AS base_amount,
        COALESCE(t.base_currency, '')::text AS base_currency
      FROM transactions t
      WHERE t.team_id = $1
        AND t.status = 'posted'
        AND t.date IS NOT NULL
        AND t.date > NOW() - ($2::int || ' days')::interval
      ORDER BY t.date DESC`,
      [teamId, opts.fromDaysAgo + 120],
    );

    await client.query("ROLLBACK");

    const toInbox = (r: Record<string, unknown>): InboxItem => ({
      id: String(r.id),
      displayName: String(r.display_name ?? ""),
      amount: Number(r.amount ?? 0),
      currency: String(r.currency ?? ""),
      date: String(r.date ?? ""),
      type: String(r.type ?? "expense"),
      website: String(r.website ?? ""),
      invoiceNumber: String(r.invoice_number ?? ""),
      baseAmount: Number(r.base_amount ?? 0),
      baseCurrency: String(r.base_currency ?? ""),
      matchedTransactionId: r.matched_transaction_id
        ? String(r.matched_transaction_id)
        : null,
    });

    const toTxn = (r: Record<string, unknown>): Txn => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      amount: Number(r.amount ?? 0),
      currency: String(r.currency ?? ""),
      date: String(r.date ?? ""),
      merchantName: String(r.merchant_name ?? ""),
      description: String(r.description ?? ""),
      counterpartyName: String(r.counterparty_name ?? ""),
      baseAmount: Number(r.base_amount ?? 0),
      baseCurrency: String(r.base_currency ?? ""),
    });

    const allInbox = inboxResult.rows.map((r) =>
      toInbox(r as Record<string, unknown>),
    );
    const matched = allInbox.filter((i) => i.matchedTransactionId !== null);
    const unmatched = allInbox.filter((i) => i.matchedTransactionId === null);
    const txns = txnResult.rows.map((r) => toTxn(r as Record<string, unknown>));

    return {
      matchedInbox: matched,
      unmatchedInbox: unmatched,
      transactions: txns,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// ─── Live scoring ───────────────────────────────────────

function scorePair(inb: InboxItem, txn: Txn): ScoredCandidate {
  let nameScore = calculateNameScore(
    inb.displayName,
    txn.name,
    txn.merchantName || txn.counterpartyName,
  );

  const amountScore = calculateAmountScore(
    {
      amount: inb.amount,
      currency: inb.currency || null,
      baseAmount: inb.baseAmount || null,
      baseCurrency: inb.baseCurrency || null,
    },
    {
      amount: txn.amount,
      currency: txn.currency || null,
      baseAmount: txn.baseAmount || null,
      baseCurrency: txn.baseCurrency || null,
    },
  );

  const currencyScore = calculateCurrencyScore(
    inb.currency || undefined,
    txn.currency || undefined,
    inb.baseCurrency || undefined,
    txn.baseCurrency || undefined,
  );

  let dateScore = 0.5;
  try {
    if (inb.date && txn.date) {
      dateScore = calculateDateScore(inb.date, txn.date, inb.type);
    }
  } catch {
    dateScore = 0.5;
  }

  const invoiceNum = normalizeName(inb.invoiceNumber);
  const searchable = normalizeName(
    `${txn.name} ${txn.merchantName} ${txn.description}`,
  );
  if (invoiceNum.length >= 4 && searchable.includes(invoiceNum)) {
    nameScore = Math.max(nameScore, 0.95);
  }
  const domain = extractDomainToken(inb.website);
  if (domain.length >= 4 && searchable.includes(domain)) {
    nameScore = Math.max(nameScore, 0.88);
  }

  const isSameCurrency = inb.currency === txn.currency;
  const isExactAmount =
    Math.abs(inb.amount) > 0 &&
    Math.abs(txn.amount) > 0 &&
    Math.abs(Math.abs(inb.amount) - Math.abs(txn.amount)) < 0.01;

  const confidence = scoreMatch({
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
    isSameCurrency,
    isExactAmount,
  });

  return {
    transaction: txn,
    confidence,
    nameScore,
    amountScore,
    dateScore,
    currencyScore,
  };
}

function getCandidates(inb: InboxItem, allTxns: Txn[]): Txn[] {
  if (!inb.date) return [];
  const inboxDate = new Date(inb.date).getTime();
  const isInvoice = inb.type === "invoice";
  const beforeMs = (isInvoice ? 90 : 90) * 86400000;
  const afterMs = (isInvoice ? 123 : 30) * 86400000;

  return allTxns.filter((t) => {
    if (!t.date) return false;
    const txnDate = new Date(t.date).getTime();
    return txnDate >= inboxDate - afterMs && txnDate <= inboxDate + beforeMs;
  });
}

function runLiveEval(
  matchedInbox: InboxItem[],
  unmatchedInbox: InboxItem[],
  allTxns: Txn[],
  opts: ReturnType<typeof parseArgs>,
): { matched: LiveResult[]; unmatched: LiveResult[] } {
  const matchedResults: LiveResult[] = [];

  for (const inb of matchedInbox) {
    const candidates = getCandidates(inb, allTxns);
    const scored = candidates
      .map((t) => scorePair(inb, t))
      .sort((a, b) => b.confidence - a.confidence);

    const correctIdx = scored.findIndex(
      (s) => s.transaction.id === inb.matchedTransactionId,
    );
    const correctMatch = correctIdx >= 0 ? scored[correctIdx]! : null;
    const rank = correctIdx >= 0 ? correctIdx + 1 : null;
    const topCandidate = scored[0] ?? null;

    matchedResults.push({
      inbox: inb,
      correctMatch,
      rank,
      candidateCount: candidates.length,
      topCandidate,
    });
  }

  const unmatchedResults: LiveResult[] = [];
  for (const inb of unmatchedInbox) {
    const candidates = getCandidates(inb, allTxns);
    const scored = candidates
      .map((t) => scorePair(inb, t))
      .sort((a, b) => b.confidence - a.confidence);

    const topCandidate = scored[0] ?? null;
    unmatchedResults.push({
      inbox: inb,
      correctMatch: null,
      rank: null,
      candidateCount: candidates.length,
      topCandidate,
    });
  }

  return { matched: matchedResults, unmatched: unmatchedResults };
}

// ─── Live report ────────────────────────────────────────

function printLiveReport(
  matched: LiveResult[],
  unmatched: LiveResult[],
  txnCount: number,
  opts: ReturnType<typeof parseArgs>,
) {
  const line = dim("─".repeat(62));
  const dblLine = dim("═".repeat(62));
  const threshold = opts.suggestedThreshold;
  const autoThreshold = opts.autoThreshold;

  console.log("");
  console.log(dblLine);
  console.log(bold("  Live Algorithm Evaluation"));
  console.log(
    dim(
      `  ${new Date().toISOString().slice(0, 10)} · ${getGitHash()} · team ${(opts.teamId ?? "").slice(0, 8)}…`,
    ),
  );
  console.log(dblLine);
  console.log("");

  console.log(
    `  Data     ${bold(String(matched.length))} matched inbox items · ${bold(String(unmatched.length))} unmatched`,
  );
  console.log(`           ${bold(String(txnCount))} candidate transactions`);
  console.log("");

  // ── Matched: ranking accuracy ──
  if (matched.length > 0) {
    const withCorrect = matched.filter((r) => r.correctMatch !== null);
    const rank1 = withCorrect.filter((r) => r.rank === 1).length;
    const rank3 = withCorrect.filter(
      (r) => r.rank !== null && r.rank <= 3,
    ).length;
    const rank5 = withCorrect.filter(
      (r) => r.rank !== null && r.rank <= 5,
    ).length;
    const notFound = matched.filter((r) => r.correctMatch === null).length;

    const scores = withCorrect.map((r) => r.correctMatch!.confidence);
    scores.sort((a, b) => a - b);
    const aboveThreshold = scores.filter((s) => s >= threshold).length;
    const aboveAuto = scores.filter((s) => s >= autoThreshold).length;
    const avg =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const median =
      scores.length > 0 ? scores[Math.floor(scores.length / 2)]! : 0;

    const mrr =
      withCorrect.reduce((sum, r) => sum + (r.rank ? 1 / r.rank : 0), 0) /
      (withCorrect.length || 1);

    console.log(`  ${line}`);
    console.log(
      bold("  Ranking Accuracy") +
        dim("  (does the algo pick the right transaction?)"),
    );
    console.log(`  ${line}`);
    console.log("");
    console.log(
      `  Correct at #1   ${bold(String(rank1).padStart(4))} / ${withCorrect.length}    ${bold(pct(rank1 / (withCorrect.length || 1)))}`,
    );
    console.log(
      `  Correct top 3   ${bold(String(rank3).padStart(4))} / ${withCorrect.length}    ${pct(rank3 / (withCorrect.length || 1))}`,
    );
    console.log(
      `  Correct top 5   ${bold(String(rank5).padStart(4))} / ${withCorrect.length}    ${pct(rank5 / (withCorrect.length || 1))}`,
    );
    console.log(
      `  Not in candidates ${bold(String(notFound).padStart(2))}       ${dim("(transaction outside date window)")}`,
    );
    console.log(`  MRR             ${bold(mrr.toFixed(3))}`);
    console.log("");

    console.log(`  ${line}`);
    console.log(bold("  Score Distribution") + dim("  (correct match scores)"));
    console.log(`  ${line}`);
    console.log("");
    console.log(
      `  Would suggest (≥${threshold.toFixed(2)})   ${bold(String(aboveThreshold))} / ${withCorrect.length}    ${bold(pct(aboveThreshold / (withCorrect.length || 1)))}`,
    );
    console.log(
      `  Would auto    (≥${autoThreshold.toFixed(2)})   ${bold(String(aboveAuto))} / ${withCorrect.length}    ${bold(pct(aboveAuto / (withCorrect.length || 1)))}`,
    );
    console.log(`  Avg score              ${bold(avg.toFixed(3))}`);
    console.log(`  Median score           ${bold(median.toFixed(3))}`);
    console.log("");

    // Histogram
    const buckets = [
      { label: "0.90-1.00", min: 0.9, max: 1.01 },
      { label: "0.80-0.90", min: 0.8, max: 0.9 },
      { label: "0.70-0.80", min: 0.7, max: 0.8 },
      { label: "0.60-0.70", min: 0.6, max: 0.7 },
      { label: "  < 0.60 ", min: 0, max: 0.6 },
    ];
    const maxBucket = Math.max(
      ...buckets.map(
        (b) => scores.filter((s) => s >= b.min && s < b.max).length,
      ),
      1,
    );
    for (const b of buckets) {
      const count = scores.filter((s) => s >= b.min && s < b.max).length;
      const barLen = Math.round((count / maxBucket) * 25);
      const bar = "█".repeat(barLen) + "░".repeat(25 - barLen);
      console.log(
        `  ${b.label}  ${bar}  ${String(count).padStart(4)}  (${pct(count / (scores.length || 1))})`,
      );
    }
    console.log("");

    // Threshold sweep
    if (opts.sweep) {
      console.log(`  ${line}`);
      console.log(
        bold("  Threshold Sweep") + dim("  (correct matches above threshold)"),
      );
      console.log(`  ${line}`);
      console.log("");
      console.log(
        dim("  Thresh   Found    Recall     Auto-found  Auto-recall"),
      );
      for (let t = 0.3; t <= 0.95; t += 0.05) {
        const th = Math.round(t * 100) / 100;
        const found = scores.filter((s) => s >= th).length;
        const autoFound = scores.filter(
          (s) => s >= Math.min(th + 0.3, 0.95),
        ).length;
        const marker = Math.abs(th - threshold) < 0.005 ? " ←" : "";
        console.log(
          `  ${th.toFixed(2)}     ${String(found).padStart(4)}     ${pct(found / (scores.length || 1)).padStart(6)}       ${String(autoFound).padStart(4)}      ${pct(autoFound / (scores.length || 1)).padStart(6)}${marker}`,
        );
      }
      console.log("");
    }

    // Missed matches (score < threshold)
    const missed = withCorrect
      .filter((r) => r.correctMatch!.confidence < threshold)
      .sort((a, b) => a.correctMatch!.confidence - b.correctMatch!.confidence)
      .slice(0, opts.errorCount);

    console.log(`  ${line}`);
    console.log(
      bold("  Missed") +
        dim(` (correct match scores < ${threshold.toFixed(2)})`),
    );
    console.log(`  ${line}`);
    console.log("");

    if (missed.length === 0) {
      console.log(
        green("  None — every correct match scores above threshold!"),
      );
    } else {
      for (const r of missed) {
        const c = r.correctMatch!;
        console.log(
          `  ${red("✗")} score=${bold(c.confidence.toFixed(3))}  rank=#${r.rank} of ${r.candidateCount}`,
        );
        console.log(
          `    inbox   ${dim(truncate(r.inbox.displayName || "(empty)", 26))}  ${r.inbox.amount} ${r.inbox.currency}`,
        );
        console.log(
          `    correct ${dim(truncate(c.transaction.merchantName || c.transaction.name || "(empty)", 26))}  ${c.transaction.amount} ${c.transaction.currency}`,
        );
        console.log(
          `    ${dim(`name=${c.nameScore.toFixed(2)} amount=${c.amountScore.toFixed(2)} date=${c.dateScore.toFixed(2)} currency=${c.currencyScore.toFixed(2)}`)}`,
        );
        if (
          r.topCandidate &&
          r.topCandidate.transaction.id !== c.transaction.id
        ) {
          console.log(
            `    ${yellow("#1 pick")} ${dim(truncate(r.topCandidate.transaction.merchantName || r.topCandidate.transaction.name, 26))}  score=${r.topCandidate.confidence.toFixed(3)}`,
          );
        }
        console.log("");
      }
    }

    // Wrong rankings (correct not at #1)
    const wrongRank = withCorrect
      .filter((r) => r.rank !== null && r.rank > 1)
      .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
      .slice(0, opts.errorCount);

    console.log(`  ${line}`);
    console.log(bold("  Wrong Rank") + dim(" (correct match not ranked #1)"));
    console.log(`  ${line}`);
    console.log("");

    if (wrongRank.length === 0) {
      console.log(
        green("  None — algorithm always picks the correct transaction first!"),
      );
    } else {
      for (const r of wrongRank) {
        const c = r.correctMatch!;
        console.log(
          `  ${yellow("↓")} rank=#${r.rank}  score=${bold(c.confidence.toFixed(3))}`,
        );
        console.log(
          `    inbox   ${dim(truncate(r.inbox.displayName || "(empty)", 26))}  ${r.inbox.amount} ${r.inbox.currency}`,
        );
        console.log(
          `    correct ${dim(truncate(c.transaction.merchantName || c.transaction.name || "(empty)", 26))}  ${c.transaction.amount} ${c.transaction.currency}`,
        );
        if (r.topCandidate) {
          console.log(
            `    ${red("#1 pick")} ${dim(truncate(r.topCandidate.transaction.merchantName || r.topCandidate.transaction.name, 26))}  ${r.topCandidate.transaction.amount} ${r.topCandidate.transaction.currency}  score=${r.topCandidate.confidence.toFixed(3)}`,
          );
        }
        console.log("");
      }
    }
  }

  // ── Unmatched: preview suggestions ──
  const suggestable = unmatched
    .filter((r) => r.topCandidate && r.topCandidate.confidence >= threshold)
    .sort((a, b) => b.topCandidate!.confidence - a.topCandidate!.confidence);

  const wouldAuto = suggestable.filter(
    (r) => r.topCandidate!.confidence >= autoThreshold,
  );
  const noMatch = unmatched.filter(
    (r) => !r.topCandidate || r.topCandidate.confidence < threshold,
  );

  console.log(`  ${line}`);
  console.log(bold("  Unmatched Inbox Preview"));
  console.log(`  ${line}`);
  console.log("");
  console.log(
    `  Would suggest     ${bold(String(suggestable.length))} of ${unmatched.length}`,
  );
  console.log(
    `  Would auto-match  ${bold(String(wouldAuto.length))} of ${unmatched.length}`,
  );
  console.log(
    `  No match          ${bold(String(noMatch.length))} of ${unmatched.length}`,
  );
  console.log("");

  const preview = suggestable.slice(0, opts.errorCount);
  if (preview.length > 0) {
    console.log(dim("  Top suggestions:"));
    console.log("");
    for (const r of preview) {
      const t = r.topCandidate!;
      const tag =
        t.confidence >= autoThreshold ? green("auto") : yellow("suggest");
      console.log(`  ${tag}  score=${bold(t.confidence.toFixed(3))}`);
      console.log(
        `    inbox  ${dim(truncate(r.inbox.displayName || "(empty)", 26))}  ${r.inbox.amount} ${r.inbox.currency}  ${dim(r.inbox.date)}`,
      );
      console.log(
        `    → txn  ${dim(truncate(t.transaction.merchantName || t.transaction.name || "(empty)", 26))}  ${t.transaction.amount} ${t.transaction.currency}  ${dim(t.transaction.date)}`,
      );
      console.log("");
    }
  }

  console.log(dblLine);
  console.log("");
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  if (opts.help) {
    console.log(`
Matching Progress CLI — track matching quality over time

Usage:
  bun run eval:progress --live --team-id <uuid>    Evaluate algo against real inbox/transaction data
  bun run eval:progress --live --team-id <uuid> --sweep
  bun run eval:progress                            Legacy: evaluate against suggestion history
  bun run eval:progress --history                  Show past runs

Options:
  --live                  Evaluate against real inbox + transaction data (no history)
  --team-id <uuid>        Team to evaluate (required for --live)
  --days <n>              Lookback window (default: 180)
  --limit <n>             Max inbox items (default: 500)
  --threshold <n>         Suggested threshold (default: 0.60)
  --auto-threshold <n>    Auto-match threshold (default: 0.90)
  --sweep                 Show threshold sweep table
  --errors <n>            Number of examples per section (default: 5)
  --history               Just print past runs
  --no-save               Don't save this run to history

Env:
  DATABASE_PRIMARY_URL or DATABASE_URL
`);
    return;
  }

  if (opts.historyOnly) {
    const history = loadHistory();
    if (history.length === 0) {
      console.log("\nNo runs recorded yet. Run without --history first.\n");
      return;
    }
    const last = history[history.length - 1]!;
    printHistory(last);
    return;
  }

  const dbUrl = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Set DATABASE_PRIMARY_URL or DATABASE_URL");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl:
      process.env.NODE_ENV === "development"
        ? false
        : { rejectUnauthorized: false },
    max: 2,
  });

  // ── Live mode: evaluate against real inbox + transaction data ──
  if (opts.live) {
    if (!opts.teamId) {
      console.error("--live requires --team-id <uuid>");
      process.exit(1);
    }

    try {
      console.log(dim("\n  Fetching inbox items and transactions…"));

      const { matchedInbox, unmatchedInbox, transactions } =
        await fetchLiveData(pool, opts.teamId, opts);

      console.log(
        dim(
          `  Loaded ${matchedInbox.length} matched + ${unmatchedInbox.length} unmatched inbox items, ${transactions.length} transactions`,
        ),
      );
      console.log(dim("  Scoring all candidates…"));

      const { matched, unmatched } = runLiveEval(
        matchedInbox,
        unmatchedInbox,
        transactions,
        opts,
      );

      printLiveReport(matched, unmatched, transactions.length, opts);
    } finally {
      await pool.end();
    }
    return;
  }

  // ── Legacy mode: evaluate against suggestion history ──
  try {
    console.log(dim("\n  Fetching data from database…"));

    const { suggestions, manualMatches } = await fetchRecords(pool, opts);

    if (suggestions.length === 0 && manualMatches.length === 0) {
      console.log("\n  No data found for the given scope.\n");
      return;
    }

    console.log(
      dim(
        `  Loaded ${suggestions.length} suggestions + ${manualMatches.length} manual matches`,
      ),
    );
    console.log(dim("  Scoring…"));

    const { confirmed: pairConfirmed, declined: pairDeclined } =
      buildPairCounts(suggestions);

    const scored = suggestions.map((r) =>
      scoreRecord(r, pairConfirmed, pairDeclined),
    );
    const manualScored = manualMatches.map((r) =>
      scoreRecord(r, pairConfirmed, pairDeclined),
    );

    // Metrics at suggested threshold
    const suggested = computeMetrics(
      scored,
      manualScored,
      opts.suggestedThreshold,
    );

    // Metrics at auto-match threshold
    const auto = computeMetrics(scored, manualScored, opts.autoThreshold);

    // Confidence distributions
    const confirmedScores = scored
      .filter((r) => r.userAction === "confirmed")
      .map((r) => r.confidence);
    const declinedScores = scored
      .filter((r) => r.userAction !== "confirmed")
      .map((r) => r.confidence);
    const avgConfirmed =
      confirmedScores.length > 0
        ? confirmedScores.reduce((a, b) => a + b, 0) / confirmedScores.length
        : 0;
    const avgDeclined =
      declinedScores.length > 0
        ? declinedScores.reduce((a, b) => a + b, 0) / declinedScores.length
        : 0;

    // Best threshold from sweep
    const { best } = sweepThresholds(scored, manualScored);

    // Build snapshot
    const history = loadHistory();
    const runId =
      (history.length > 0 ? history[history.length - 1]!.runId : 0) + 1;

    const snapshot: RunSnapshot = {
      runId,
      timestamp: new Date().toISOString(),
      gitHash: getGitHash(),
      suggestedThreshold: opts.suggestedThreshold,
      autoThreshold: opts.autoThreshold,
      precision: suggested.precision,
      recall: suggested.recall,
      f1: suggested.f1,
      falsePositives: suggested.falsePositives,
      falseNegatives: suggested.falseNegatives,
      totalRealMatches: suggested.totalRealMatches,
      totalPairs: suggestions.length + manualMatches.length,
      autoPrecision: auto.precision,
      autoMatchCount: auto.totalFound,
      autoFalsePositives: auto.falsePositives,
      avgConfidenceConfirmed: avgConfirmed,
      avgConfidenceDeclined: avgDeclined,
      bestThreshold: best.threshold,
      bestF1: best.f1,
      scope: {
        teamId: opts.teamId,
        fromDaysAgo: opts.fromDaysAgo,
        toDaysAgo: opts.toDaysAgo,
        suggestionCount: suggestions.length,
        manualCount: manualMatches.length,
      },
    };

    // Save before printing so history is up to date
    if (!opts.noSave) {
      history.push(snapshot);
      saveHistory(history);
    }

    const previous =
      history.length >= 2 ? (history[history.length - 2] ?? null) : null;

    printReport(snapshot, scored, manualScored, previous, opts);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(
    "matching-progress failed:",
    err instanceof Error ? err.message : String(err),
  );
  process.exit(1);
});
