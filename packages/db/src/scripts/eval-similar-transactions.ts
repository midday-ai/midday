import { Pool } from "pg";
import { calculateNameScore } from "../utils/transaction-matching";

const MIN_SIMILARITY_THRESHOLD = 0.6;
const EXACT_MERCHANT_SCORE = 0.95;
const MAX_CANDIDATES = 200;

type TransactionRow = {
  id: string;
  name: string;
  merchantName: string;
  amount: number;
  currency: string;
  date: string;
  categorySlug: string;
  frequency: string;
  trgmScore: number;
};

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
    transactionId: options["transaction-id"] ?? null,
    name: options.name ?? null,
    categorySlug: options["category-slug"] ?? null,
    threshold: options.threshold
      ? Number.parseFloat(options.threshold)
      : MIN_SIMILARITY_THRESHOLD,
    limit: Number.parseInt(options.limit ?? "50", 10),
    showAll: options["show-all"] === "true",
    sample: options.sample === "true",
    sampleCount: Number.parseInt(options["sample-count"] ?? "5", 10),
    statementTimeoutMs: Number.parseInt(
      options["statement-timeout-ms"] ?? "30000",
      10,
    ),
  };
}

async function getSourceTransaction(
  pool: Pool,
  teamId: string,
  transactionId: string,
) {
  const result = await pool.query(
    `SELECT id, name, COALESCE(merchant_name, '') as merchant_name,
            amount, currency, date::text, COALESCE(category_slug, '') as category_slug
     FROM transactions WHERE id = $1 AND team_id = $2`,
    [transactionId, teamId],
  );
  return result.rows[0] as
    | {
        id: string;
        name: string;
        merchant_name: string;
        amount: number;
        currency: string;
        date: string;
        category_slug: string;
      }
    | undefined;
}

async function getSampleTransactions(
  pool: Pool,
  teamId: string,
  count: number,
) {
  const result = await pool.query(
    `SELECT DISTINCT ON (COALESCE(merchant_name, name))
            id, name, COALESCE(merchant_name, '') as merchant_name,
            amount, currency, date::text, COALESCE(category_slug, '') as category_slug
     FROM transactions
     WHERE team_id = $1 AND status = 'posted'
     ORDER BY COALESCE(merchant_name, name), date DESC
     LIMIT $2`,
    [teamId, count],
  );
  return result.rows as Array<{
    id: string;
    name: string;
    merchant_name: string;
    amount: number;
    currency: string;
    date: string;
    category_slug: string;
  }>;
}

async function findSimilarCandidates(
  pool: Pool,
  teamId: string,
  sourceName: string,
  sourceMerchantName: string | null,
  sourceId: string | null,
  categorySlug: string | null,
  timeoutMs: number,
): Promise<TransactionRow[]> {
  const params: (string | number)[] = [teamId, sourceName];
  if (sourceMerchantName) params.push(sourceMerchantName);
  if (sourceId) params.push(sourceId);
  if (categorySlug) params.push(categorySlug);

  // Build the param references based on what's present
  const merchantParamIdx = sourceMerchantName ? 3 : null;
  const excludeParamIdx = sourceId ? (merchantParamIdx ?? 2) + 1 : null;
  const categoryParamIdx = categorySlug
    ? (excludeParamIdx ?? merchantParamIdx ?? 2) + 1
    : null;

  const merchantCond = sourceMerchantName
    ? `OR LOWER(t.merchant_name) = LOWER($${merchantParamIdx})
       OR ($${merchantParamIdx} %> t.name OR $${merchantParamIdx} %> t.merchant_name)`
    : "";
  const excludeCond = sourceId ? `AND t.id != $${excludeParamIdx}` : "";
  const categoryCond = categorySlug
    ? `AND (t.category_slug IS NULL OR t.category_slug != $${categoryParamIdx})`
    : "";

  const sql = `
    SET LOCAL statement_timeout = '${timeoutMs}ms';

    SELECT
      t.id,
      t.name,
      COALESCE(t.merchant_name, '') as "merchantName",
      t.amount::float8,
      t.currency,
      t.date::text,
      COALESCE(t.category_slug, '') as "categorySlug",
      COALESCE(t.frequency::text, '') as "frequency",
      GREATEST(
        word_similarity($2, COALESCE(t.merchant_name, t.name)),
        word_similarity($2, t.name)
      ) as "trgmScore"
    FROM transactions t
    WHERE t.team_id = $1
      AND (
        ($2 %> t.name OR $2 %> t.merchant_name)
        ${merchantCond}
      )
      ${excludeCond}
      ${categoryCond}
    ORDER BY GREATEST(
      word_similarity($2, COALESCE(t.merchant_name, t.name)),
      word_similarity($2, t.name)
    ) DESC
    LIMIT ${MAX_CANDIDATES}
  `;

  const client = await pool.connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query(`SET LOCAL statement_timeout = '${timeoutMs}ms'`);
    const result = await client.query(
      sql.replace(/SET LOCAL[^;]+;/, ""),
      params,
    );
    await client.query("ROLLBACK");
    return result.rows as TransactionRow[];
  } finally {
    client.release();
  }
}

function scoreCandidate(
  sourceName: string,
  sourceMerchantName: string | null,
  candidate: TransactionRow,
): { score: number; method: string } {
  if (
    sourceMerchantName &&
    candidate.merchantName &&
    sourceMerchantName.toLowerCase() === candidate.merchantName.toLowerCase()
  ) {
    return { score: EXACT_MERCHANT_SCORE, method: "exact_merchant" };
  }

  const nameScore = calculateNameScore(
    sourceName,
    candidate.name,
    candidate.merchantName || null,
  );

  let merchantScore = 0;
  if (sourceMerchantName) {
    merchantScore = calculateNameScore(
      sourceMerchantName,
      candidate.name,
      candidate.merchantName || null,
    );
  }

  const best = Math.max(nameScore, merchantScore);
  const method =
    merchantScore > nameScore ? "merchant_name_score" : "name_score";

  return { score: best, method };
}

function printResults(
  source: { name: string; merchant_name: string; id: string },
  candidates: TransactionRow[],
  scored: Array<TransactionRow & { score: number; method: string }>,
  threshold: number,
  showAll: boolean,
) {
  console.log("");
  console.log(
    `Source: "${source.name}"${source.merchant_name ? ` (merchant: "${source.merchant_name}")` : ""} [${source.id}]`,
  );
  console.log(`Candidates retrieved: ${candidates.length}`);
  console.log(`Threshold: ${threshold}`);
  console.log("");

  const display = showAll ? scored : scored.filter((r) => r.score >= threshold);
  const passed = scored.filter((r) => r.score >= threshold).length;
  const failed = scored.length - passed;

  console.log(
    `Results: ${passed} passed threshold, ${failed} filtered out${showAll ? " (showing all)" : ""}`,
  );
  console.log("");

  if (display.length === 0) {
    console.log("  No matches found.");
    return;
  }

  // Table header
  console.log(
    "  Score  | Trgm  | Method             | Name                                     | Merchant              | Category     | ID",
  );
  console.log(
    "  -------+-------+--------------------+------------------------------------------+-----------------------+--------------+------------------------------------",
  );

  for (const r of display) {
    const passMarker = r.score >= threshold ? "+" : "-";
    const score = r.score.toFixed(3).padStart(5);
    const trgm = r.trgmScore.toFixed(3).padStart(5);
    const method = r.method.padEnd(18);
    const name = r.name.slice(0, 40).padEnd(40);
    const merchant = (r.merchantName || "-").slice(0, 21).padEnd(21);
    const category = (r.categorySlug || "-").slice(0, 12).padEnd(12);

    console.log(
      `${passMarker} ${score} | ${trgm} | ${method} | ${name} | ${merchant} | ${category} | ${r.id}`,
    );
  }
}

async function evaluateOne(
  pool: Pool,
  teamId: string,
  source: {
    id: string;
    name: string;
    merchant_name: string;
    category_slug: string;
  },
  opts: ReturnType<typeof parseArgs>,
) {
  const sourceMerchantName = source.merchant_name || null;

  const candidates = await findSimilarCandidates(
    pool,
    teamId,
    source.name,
    sourceMerchantName,
    source.id,
    opts.categorySlug,
    opts.statementTimeoutMs,
  );

  const scored = candidates
    .map((c) => {
      const { score, method } = scoreCandidate(
        source.name,
        sourceMerchantName,
        c,
      );
      return { ...c, score, method };
    })
    .sort((a, b) => b.score - a.score);

  printResults(source, candidates, scored, opts.threshold, opts.showAll);

  return {
    candidateCount: candidates.length,
    passedCount: scored.filter((r) => r.score >= opts.threshold).length,
  };
}

async function main() {
  if (Bun.argv.includes("--help") || Bun.argv.includes("-h")) {
    console.log("Similar Transactions Evaluation (read-only)");
    console.log("");
    console.log("Tests the pg_trgm + calculateNameScore matching pipeline");
    console.log("against real transaction data.");
    console.log("");
    console.log("Usage:");
    console.log("  bun run eval:similar [options]");
    console.log("");
    console.log("Options:");
    console.log("  --team-id <uuid>              Team to evaluate (required)");
    console.log(
      "  --transaction-id <uuid>       Specific transaction to use as source",
    );
    console.log(
      "  --name <string>               Override source name (for testing)",
    );
    console.log(
      "  --category-slug <string>      Filter: exclude this category from results",
    );
    console.log(
      `  --threshold <n>               Min score threshold (default: ${MIN_SIMILARITY_THRESHOLD})`,
    );
    console.log(
      "  --show-all true               Show all candidates including below threshold",
    );
    console.log(
      "  --sample true                 Test against random distinct vendors",
    );
    console.log(
      "  --sample-count <n>            Number of vendors to sample (default: 5)",
    );
    console.log(
      "  --limit <n>                   Max results to display (default: 50)",
    );
    console.log("  --statement-timeout-ms <n>    DB timeout (default: 30000)");
    console.log("");
    console.log("Examples:");
    console.log(
      "  bun run eval:similar --team-id <uuid> --transaction-id <uuid>",
    );
    console.log(
      "  bun run eval:similar --team-id <uuid> --sample true --sample-count 10",
    );
    console.log(
      "  bun run eval:similar --team-id <uuid> --transaction-id <uuid> --show-all true",
    );
    console.log("");
    console.log("Required env:");
    console.log("  DATABASE_PRIMARY_URL or DATABASE_URL");
    return;
  }

  const opts = parseArgs(Bun.argv.slice(2));

  if (!opts.teamId) {
    console.error("Error: --team-id is required");
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_PRIMARY_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("Error: DATABASE_PRIMARY_URL or DATABASE_URL is required");
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

  try {
    console.log("Similar Transactions Eval (read-only)");
    console.log(`Team: ${opts.teamId}`);
    console.log(`Threshold: ${opts.threshold}`);
    console.log("");

    if (opts.sample) {
      const samples = await getSampleTransactions(
        pool,
        opts.teamId,
        opts.sampleCount,
      );
      console.log(`Sampling ${samples.length} distinct vendors...\n`);

      let totalCandidates = 0;
      let totalPassed = 0;

      for (const source of samples) {
        if (opts.name) source.name = opts.name;
        const { candidateCount, passedCount } = await evaluateOne(
          pool,
          opts.teamId,
          source,
          opts,
        );
        totalCandidates += candidateCount;
        totalPassed += passedCount;
        console.log("");
      }

      console.log("=".repeat(80));
      console.log("Summary");
      console.log(`  Vendors sampled: ${samples.length}`);
      console.log(`  Total candidates: ${totalCandidates}`);
      console.log(`  Total passed threshold: ${totalPassed}`);
      console.log(
        `  Avg candidates per vendor: ${(totalCandidates / samples.length).toFixed(1)}`,
      );
      console.log(
        `  Avg passed per vendor: ${(totalPassed / samples.length).toFixed(1)}`,
      );
    } else if (opts.transactionId) {
      const source = await getSourceTransaction(
        pool,
        opts.teamId,
        opts.transactionId,
      );
      if (!source) {
        console.error(
          `Transaction ${opts.transactionId} not found for team ${opts.teamId}`,
        );
        process.exit(1);
      }
      if (opts.name) source.name = opts.name;
      await evaluateOne(pool, opts.teamId, source, opts);
    } else {
      console.error("Error: Provide --transaction-id or --sample true");
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("eval-similar-transactions failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
