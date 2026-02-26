// ============================================================================
// Buy Box Check — Rule-based scoring against team criteria
// ============================================================================

export type BuyBoxCriterion = {
  name: string;
  passed: boolean;
  actualValue: string;
  requiredValue: string;
};

export type BuyBoxResult = {
  criteria: BuyBoxCriterion[];
  passCount: number;
  totalCount: number;
  allPassed: boolean;
};

export type BuyBoxConfig = {
  minMonthlyRevenue?: number | null;
  minTimeInBusiness?: number | null;
  maxExistingPositions?: number | null;
  minAvgDailyBalance?: number | null;
  maxNsfCount?: number | null;
  excludedIndustries?: string[] | null;
  minCreditScore?: number | null;
};

export type MerchantMetrics = {
  monthlyAvgRevenue?: number;
  timeInBusinessMonths?: number;
  existingPositions?: number;
  avgDailyBalance?: number;
  nsfCount?: number;
  industry?: string;
  creditScore?: number;
};

// ============================================================================
// Formatting helpers
// ============================================================================

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonths(months: number): string {
  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remaining = months % 12;
    return remaining > 0 ? `${years}y ${remaining}mo` : `${years}y`;
  }
  return `${months} months`;
}

// ============================================================================
// Main check function
// ============================================================================

export function checkBuyBox(
  config: BuyBoxConfig,
  metrics: MerchantMetrics,
): BuyBoxResult {
  const criteria: BuyBoxCriterion[] = [];

  // Minimum monthly revenue
  if (config.minMonthlyRevenue != null) {
    const actual = metrics.monthlyAvgRevenue;
    criteria.push({
      name: "Minimum Monthly Revenue",
      passed: actual != null && actual >= config.minMonthlyRevenue,
      actualValue:
        actual != null ? formatCurrency(actual) : "Not available",
      requiredValue: `>= ${formatCurrency(config.minMonthlyRevenue)}`,
    });
  }

  // Minimum time in business
  if (config.minTimeInBusiness != null) {
    const actual = metrics.timeInBusinessMonths;
    criteria.push({
      name: "Minimum Time in Business",
      passed: actual != null && actual >= config.minTimeInBusiness,
      actualValue:
        actual != null ? formatMonths(actual) : "Not available",
      requiredValue: `>= ${formatMonths(config.minTimeInBusiness)}`,
    });
  }

  // Maximum existing positions (stacking limit)
  if (config.maxExistingPositions != null) {
    const actual = metrics.existingPositions;
    criteria.push({
      name: "Maximum Existing Positions",
      passed: actual != null && actual <= config.maxExistingPositions,
      actualValue: actual != null ? `${actual} positions` : "Not available",
      requiredValue: `<= ${config.maxExistingPositions} positions`,
    });
  }

  // Minimum average daily balance
  if (config.minAvgDailyBalance != null) {
    const actual = metrics.avgDailyBalance;
    criteria.push({
      name: "Minimum Average Daily Balance",
      passed: actual != null && actual >= config.minAvgDailyBalance,
      actualValue:
        actual != null ? formatCurrency(actual) : "Not available",
      requiredValue: `>= ${formatCurrency(config.minAvgDailyBalance)}`,
    });
  }

  // Maximum NSF count
  if (config.maxNsfCount != null) {
    const actual = metrics.nsfCount;
    criteria.push({
      name: "Maximum NSF Count",
      passed: actual != null && actual <= config.maxNsfCount,
      actualValue: actual != null ? `${actual} NSFs` : "Not available",
      requiredValue: `<= ${config.maxNsfCount} NSFs`,
    });
  }

  // Excluded industries
  if (
    config.excludedIndustries != null &&
    config.excludedIndustries.length > 0
  ) {
    const actual = metrics.industry;
    const isExcluded =
      actual != null &&
      config.excludedIndustries.some(
        (excluded) => excluded.toLowerCase() === actual.toLowerCase(),
      );
    criteria.push({
      name: "Industry Not Excluded",
      passed: !isExcluded,
      actualValue: actual ?? "Not available",
      requiredValue: `Not in: ${config.excludedIndustries.join(", ")}`,
    });
  }

  // Minimum credit score
  if (config.minCreditScore != null) {
    const actual = metrics.creditScore;
    criteria.push({
      name: "Minimum Credit Score",
      passed: actual != null && actual >= config.minCreditScore,
      actualValue: actual != null ? `${actual}` : "Not available",
      requiredValue: `>= ${config.minCreditScore}`,
    });
  }

  const passCount = criteria.filter((c) => c.passed).length;

  return {
    criteria,
    passCount,
    totalCount: criteria.length,
    allPassed: criteria.length > 0 && passCount === criteria.length,
  };
}
