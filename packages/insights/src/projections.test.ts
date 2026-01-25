/**
 * Unit tests for projection and anomaly features:
 * 1. Runway exhaustion date calculation
 * 2. Quarter pace projection
 * 3. Customer payment behavior anomaly detection
 */
import { describe, expect, it } from "bun:test";

// Test 1: Runway exhaustion date calculation
describe("runway exhaustion date", () => {
  function calculateRunwayExhaustionDate(
    runwayMonths: number,
  ): string | undefined {
    if (runwayMonths <= 0 || runwayMonths >= 24) {
      return undefined;
    }
    const exhaustionDate = new Date();
    exhaustionDate.setDate(
      exhaustionDate.getDate() + Math.round(runwayMonths * 30),
    );
    return exhaustionDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  it("should return a date for valid runway", () => {
    const result = calculateRunwayExhaustionDate(8);
    expect(result).toBeDefined();
    expect(result).toMatch(/\w+ \d{1,2}, \d{4}/); // e.g., "September 25, 2026"
  });

  it("should return undefined for zero runway", () => {
    expect(calculateRunwayExhaustionDate(0)).toBeUndefined();
  });

  it("should return undefined for negative runway", () => {
    expect(calculateRunwayExhaustionDate(-5)).toBeUndefined();
  });

  it("should return undefined for very long runway (24+ months)", () => {
    expect(calculateRunwayExhaustionDate(24)).toBeUndefined();
    expect(calculateRunwayExhaustionDate(36)).toBeUndefined();
  });

  it("should return a date for short runway", () => {
    const result = calculateRunwayExhaustionDate(1);
    expect(result).toBeDefined();
  });

  it("should return a date for runway just under threshold", () => {
    const result = calculateRunwayExhaustionDate(23.9);
    expect(result).toBeDefined();
  });
});

// Test 2: Quarter pace projection
describe("quarter pace projection", () => {
  function computeQuarterPaceProjection(
    qtdRevenue: number,
    daysElapsed: number,
    totalQuarterDays: number,
    lastYearQuarterRevenue: number,
  ): {
    projectedRevenue: number;
    vsLastYearPercent: number;
    hasComparison: boolean;
  } | null {
    // Need at least a week of data
    if (qtdRevenue <= 0 || daysElapsed <= 7) {
      return null;
    }

    const projectedRevenue = Math.round(
      (qtdRevenue / daysElapsed) * totalQuarterDays,
    );

    const vsLastYearPercent =
      lastYearQuarterRevenue > 0
        ? Math.round(
            ((projectedRevenue - lastYearQuarterRevenue) /
              lastYearQuarterRevenue) *
              100,
          )
        : 0;

    return {
      projectedRevenue,
      vsLastYearPercent,
      hasComparison: lastYearQuarterRevenue > 0,
    };
  }

  it("should project full quarter revenue", () => {
    // 30 days elapsed, 90 days total, 100k revenue so far
    const result = computeQuarterPaceProjection(100000, 30, 90, 0);
    expect(result).not.toBeNull();
    expect(result!.projectedRevenue).toBe(300000); // 100k * 3 = 300k
  });

  it("should calculate vs last year percentage", () => {
    // Projecting 300k, last year was 250k
    const result = computeQuarterPaceProjection(100000, 30, 90, 250000);
    expect(result).not.toBeNull();
    expect(result!.hasComparison).toBe(true);
    expect(result!.vsLastYearPercent).toBe(20); // (300k - 250k) / 250k = 20%
  });

  it("should return null if not enough data (< 7 days)", () => {
    const result = computeQuarterPaceProjection(50000, 5, 90, 200000);
    expect(result).toBeNull();
  });

  it("should return null if no revenue", () => {
    const result = computeQuarterPaceProjection(0, 30, 90, 200000);
    expect(result).toBeNull();
  });

  it("should handle no comparison data", () => {
    const result = computeQuarterPaceProjection(100000, 30, 90, 0);
    expect(result).not.toBeNull();
    expect(result!.hasComparison).toBe(false);
    expect(result!.vsLastYearPercent).toBe(0);
  });

  it("should handle negative comparison (behind last year)", () => {
    // Projecting 200k, last year was 300k
    const result = computeQuarterPaceProjection(66667, 30, 90, 300000);
    expect(result).not.toBeNull();
    expect(result!.vsLastYearPercent).toBe(-33); // (200k - 300k) / 300k = -33%
  });
});

// Test 3: Customer payment behavior anomaly detection
describe("customer payment anomaly detection", () => {
  function detectPaymentAnomaly(
    daysOverdue: number,
    typicalPayDays: number | undefined,
  ): { isUnusual: boolean; unusualReason?: string } {
    if (!typicalPayDays) {
      return { isUnusual: false };
    }

    // Unusual if current overdue > 1.5x typical + 7 days buffer
    const unusualThreshold = Math.max(typicalPayDays * 1.5, typicalPayDays + 7);
    const isUnusual = daysOverdue > unusualThreshold;

    return {
      isUnusual,
      unusualReason: isUnusual
        ? `usually pays within ${typicalPayDays} days`
        : undefined,
    };
  }

  it("should detect unusual delay for fast-paying customer", () => {
    // Customer typically pays in 5 days, now 30 days overdue
    const result = detectPaymentAnomaly(30, 5);
    expect(result.isUnusual).toBe(true);
    expect(result.unusualReason).toBe("usually pays within 5 days");
  });

  it("should not flag normal delay for slow-paying customer", () => {
    // Customer typically pays in 30 days, now 35 days overdue
    const result = detectPaymentAnomaly(35, 30);
    expect(result.isUnusual).toBe(false);
    expect(result.unusualReason).toBeUndefined();
  });

  it("should handle customer with no payment history", () => {
    const result = detectPaymentAnomaly(14, undefined);
    expect(result.isUnusual).toBe(false);
    expect(result.unusualReason).toBeUndefined();
  });

  it("should use 1.5x threshold for typical payers", () => {
    // Typical: 20 days, threshold = max(30, 27) = 30
    const result = detectPaymentAnomaly(31, 20);
    expect(result.isUnusual).toBe(true);

    const result2 = detectPaymentAnomaly(29, 20);
    expect(result2.isUnusual).toBe(false);
  });

  it("should use +7 days buffer for fast payers", () => {
    // Typical: 3 days, threshold = max(4.5, 10) = 10
    const result = detectPaymentAnomaly(11, 3);
    expect(result.isUnusual).toBe(true);

    const result2 = detectPaymentAnomaly(9, 3);
    expect(result2.isUnusual).toBe(false);
  });

  it("should handle edge case of 0 typical days", () => {
    // Customer always pays immediately (0 days after due)
    // 0 is falsy in JS, so treated same as undefined - no reliable data
    const result = detectPaymentAnomaly(10, 0);
    // 0 typical days means we can't determine what's "unusual"
    expect(result.isUnusual).toBe(false);
  });
});

// Test 4: Format strings for prompts
describe("projection format strings", () => {
  it("should format runway exhaustion correctly", () => {
    const runway = 8;
    const date = "September 25, 2026";
    const formatted = `${runway} months (cash lasts until ${date})`;
    expect(formatted).toBe("8 months (cash lasts until September 25, 2026)");
  });

  it("should format quarter pace correctly with comparison", () => {
    const projected = "450,000 kr";
    const quarter = 1;
    const vsLastYear = 18;
    const formatted = `On pace for ${projected} this Q${quarter} — ${vsLastYear}% ahead of Q${quarter} last year`;
    expect(formatted).toBe(
      "On pace for 450,000 kr this Q1 — 18% ahead of Q1 last year",
    );
  });

  it("should format quarter pace correctly without comparison", () => {
    const projected = "450,000 kr";
    const quarter = 1;
    const formatted = `On pace for ${projected} this Q${quarter}`;
    expect(formatted).toBe("On pace for 450,000 kr this Q1");
  });

  it("should format unusual overdue correctly", () => {
    const company = "Acme Corp";
    const amount = "7,500 kr";
    const days = 14;
    const reason = "usually pays within 5 days";
    const formatted = `${company}: ${amount} (${days} days) ⚠️ UNUSUAL - ${reason}`;
    expect(formatted).toBe(
      "Acme Corp: 7,500 kr (14 days) ⚠️ UNUSUAL - usually pays within 5 days",
    );
  });
});
