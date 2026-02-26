export type BuyBoxCriteria = {
  minMonthlyRevenue?: number | null;
  minTimeInBusiness?: number | null;
  maxExistingPositions?: number | null;
  minAvgDailyBalance?: number | null;
  maxNsfCount?: number | null;
  excludedIndustries?: string[] | null;
  minCreditScore?: number | null;
};

export type MonthlyBreakdown = {
  month: string;
  totalDeposits: number;
  totalWithdrawals: number;
  net: number;
  avgDailyBalance: number;
  nsfCount: number;
};

export type ScorecardItem = {
  criterion: string;
  detectedValue: string;
  threshold: string;
  status: "pass" | "fail" | "borderline";
};

export type AnalysisResult = {
  merchantName: string;
  accountNumber: string;
  bankName: string;
  monthlyBreakdown: MonthlyBreakdown[];
  summary: {
    avgMonthlyRevenue: number;
    avgDailyBalance: number;
    totalNsfCount: number;
    negativeDays: number;
    timeInBusiness: number;
    existingPositions: number;
    estimatedCreditScore: number;
    industry: string;
  };
  buyBoxScorecard: ScorecardItem[];
  recommendation: "approve" | "decline" | "review";
  confidenceScore: number;
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const MERCHANT_NAMES = [
  "Metro Plumbing Services LLC",
  "Sunrise Auto Repair Inc",
  "Golden State Landscaping",
  "Elite Dental Group",
  "Pacific Coast Trucking Co",
  "Brightside Construction LLC",
  "Harbor View Restaurant Group",
  "Summit Medical Supplies Inc",
];

const BANK_NAMES = [
  "Chase Business Checking",
  "Bank of America Business",
  "Wells Fargo Commercial",
  "TD Bank Business",
  "PNC Business Checking",
];

const INDUSTRIES = [
  "Construction",
  "Auto Repair",
  "Healthcare",
  "Trucking",
  "Landscaping",
  "Restaurant",
  "Retail",
  "Professional Services",
];

export function generateMockAnalysis(
  buyBox: BuyBoxCriteria,
  fileCount: number,
): AnalysisResult {
  const seed = Date.now() % 100000;
  const rand = seededRandom(seed);

  const merchantName =
    MERCHANT_NAMES[Math.floor(rand() * MERCHANT_NAMES.length)]!;
  const bankName = BANK_NAMES[Math.floor(rand() * BANK_NAMES.length)]!;
  const industry = INDUSTRIES[Math.floor(rand() * INDUSTRIES.length)]!;
  const accountNumber = `****${String(Math.floor(rand() * 9000 + 1000))}`;

  const monthCount = Math.min(Math.max(fileCount, 3), 6);
  const baseRevenue = 8000 + rand() * 25000;
  const months = generateMonthlyBreakdown(rand, monthCount, baseRevenue);

  const avgMonthlyRevenue =
    months.reduce((sum, m) => sum + m.totalDeposits, 0) / months.length;
  const avgDailyBalance =
    months.reduce((sum, m) => sum + m.avgDailyBalance, 0) / months.length;
  const totalNsfCount = months.reduce((sum, m) => sum + m.nsfCount, 0);
  const negativeDays = Math.floor(rand() * 8);
  const timeInBusiness = Math.floor(12 + rand() * 84);
  const existingPositions = Math.floor(rand() * 4);
  const estimatedCreditScore = Math.floor(550 + rand() * 200);

  const summary = {
    avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
    avgDailyBalance: Math.round(avgDailyBalance),
    totalNsfCount,
    negativeDays,
    timeInBusiness,
    existingPositions,
    estimatedCreditScore,
    industry,
  };

  const scorecard = buildScorecard(buyBox, summary);

  const passCount = scorecard.filter((s) => s.status === "pass").length;
  const failCount = scorecard.filter((s) => s.status === "fail").length;
  const totalCriteria = scorecard.length;

  let recommendation: "approve" | "decline" | "review";
  let confidenceScore: number;

  if (totalCriteria === 0) {
    recommendation = "review";
    confidenceScore = 50;
  } else if (failCount === 0) {
    recommendation = "approve";
    confidenceScore = 85 + Math.floor(rand() * 12);
  } else if (failCount >= totalCriteria * 0.5) {
    recommendation = "decline";
    confidenceScore = 70 + Math.floor(rand() * 20);
  } else {
    recommendation = "review";
    confidenceScore = 55 + Math.floor(rand() * 25);
  }

  return {
    merchantName,
    accountNumber,
    bankName,
    monthlyBreakdown: months,
    summary,
    buyBoxScorecard: scorecard,
    recommendation,
    confidenceScore,
  };
}

function generateMonthlyBreakdown(
  rand: () => number,
  monthCount: number,
  baseRevenue: number,
): MonthlyBreakdown[] {
  const now = new Date();
  const months: MonthlyBreakdown[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const monthName = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const variance = 0.7 + rand() * 0.6;
    const deposits = Math.round(baseRevenue * variance);
    const withdrawals = Math.round(deposits * (0.65 + rand() * 0.25));
    const net = deposits - withdrawals;
    const avgBalance = Math.round(2000 + rand() * 15000);
    const nsfCount = rand() < 0.3 ? Math.floor(rand() * 3) : 0;

    months.push({
      month: monthName,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      net,
      avgDailyBalance: avgBalance,
      nsfCount,
    });
  }

  return months;
}

function buildScorecard(
  buyBox: BuyBoxCriteria,
  summary: AnalysisResult["summary"],
): ScorecardItem[] {
  const scorecard: ScorecardItem[] = [];

  if (buyBox.minMonthlyRevenue != null) {
    const threshold = buyBox.minMonthlyRevenue;
    const detected = summary.avgMonthlyRevenue;
    const ratio = detected / threshold;
    scorecard.push({
      criterion: "Min Monthly Revenue",
      detectedValue: formatCurrency(detected),
      threshold: formatCurrency(threshold),
      status: ratio >= 1.0 ? "pass" : ratio >= 0.85 ? "borderline" : "fail",
    });
  }

  if (buyBox.minTimeInBusiness != null) {
    const threshold = buyBox.minTimeInBusiness;
    const detected = summary.timeInBusiness;
    const years = Math.floor(detected / 12);
    const remainingMonths = detected % 12;
    const threshYears = Math.floor(threshold / 12);
    const threshMonths = threshold % 12;
    scorecard.push({
      criterion: "Min Time in Business",
      detectedValue:
        years > 0 ? `${years}y ${remainingMonths}m` : `${remainingMonths}m`,
      threshold:
        threshYears > 0
          ? `${threshYears}y ${threshMonths}m`
          : `${threshMonths}m`,
      status:
        detected >= threshold
          ? "pass"
          : detected >= threshold * 0.8
            ? "borderline"
            : "fail",
    });
  }

  if (buyBox.maxExistingPositions != null) {
    const threshold = buyBox.maxExistingPositions;
    const detected = summary.existingPositions;
    scorecard.push({
      criterion: "Max Existing Positions",
      detectedValue: String(detected),
      threshold: `\u2264 ${threshold}`,
      status:
        detected <= threshold
          ? "pass"
          : detected <= threshold + 1
            ? "borderline"
            : "fail",
    });
  }

  if (buyBox.minAvgDailyBalance != null) {
    const threshold = buyBox.minAvgDailyBalance;
    const detected = summary.avgDailyBalance;
    const ratio = detected / threshold;
    scorecard.push({
      criterion: "Min Avg Daily Balance",
      detectedValue: formatCurrency(detected),
      threshold: formatCurrency(threshold),
      status: ratio >= 1.0 ? "pass" : ratio >= 0.8 ? "borderline" : "fail",
    });
  }

  if (buyBox.maxNsfCount != null) {
    const threshold = buyBox.maxNsfCount;
    const detected = summary.totalNsfCount;
    scorecard.push({
      criterion: "Max NSFs (Period)",
      detectedValue: String(detected),
      threshold: `\u2264 ${threshold}`,
      status:
        detected <= threshold
          ? "pass"
          : detected <= threshold + 1
            ? "borderline"
            : "fail",
    });
  }

  if (buyBox.minCreditScore != null) {
    const threshold = buyBox.minCreditScore;
    const detected = summary.estimatedCreditScore;
    scorecard.push({
      criterion: "Min Credit Score",
      detectedValue: String(detected),
      threshold: `\u2265 ${threshold}`,
      status:
        detected >= threshold
          ? "pass"
          : detected >= threshold - 20
            ? "borderline"
            : "fail",
    });
  }

  if (
    buyBox.excludedIndustries != null &&
    buyBox.excludedIndustries.length > 0
  ) {
    const excluded = buyBox.excludedIndustries.map((i) => i.toLowerCase());
    const isExcluded = excluded.includes(summary.industry.toLowerCase());
    scorecard.push({
      criterion: "Industry Not Excluded",
      detectedValue: summary.industry,
      threshold: `Not in: ${buyBox.excludedIndustries.join(", ")}`,
      status: isExcluded ? "fail" : "pass",
    });
  }

  return scorecard;
}
