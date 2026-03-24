import { describe, expect, it } from "bun:test";
import {
  calculatePercentageChange,
  computeChangeDescription,
  createMetric,
  formatMetricValue,
  getChangeDirection,
} from "./calculator";

describe("calculatePercentageChange", () => {
  it("should calculate positive change correctly", () => {
    const result = calculatePercentageChange(120, 100);
    expect(result).toBe(20);
  });

  it("should calculate negative change correctly", () => {
    const result = calculatePercentageChange(80, 100);
    expect(result).toBe(-20);
  });

  it("should return 0 when both values are 0", () => {
    const result = calculatePercentageChange(0, 0);
    expect(result).toBe(0);
  });

  it("should return 100 when previous is 0 and current is positive", () => {
    const result = calculatePercentageChange(100, 0);
    expect(result).toBe(100);
  });

  it("should handle negative previous values", () => {
    // From -100 to -50 is a 50% improvement (less negative)
    const result = calculatePercentageChange(-50, -100);
    expect(result).toBe(50);
  });

  it("should handle crossing from negative to positive", () => {
    const result = calculatePercentageChange(50, -100);
    // (50 - (-100)) / abs(-100) = 150%
    expect(result).toBe(150);
  });

  it("should handle small decimal values", () => {
    const result = calculatePercentageChange(0.12, 0.1);
    expect(result).toBeCloseTo(20, 1);
  });

  it("should handle large numbers", () => {
    const result = calculatePercentageChange(1100000, 1000000);
    expect(result).toBe(10);
  });
});

describe("getChangeDirection", () => {
  it("should return 'up' for positive change > 0.5", () => {
    expect(getChangeDirection(1)).toBe("up");
    expect(getChangeDirection(50)).toBe("up");
  });

  it("should return 'down' for negative change < -0.5", () => {
    expect(getChangeDirection(-1)).toBe("down");
    expect(getChangeDirection(-50)).toBe("down");
  });

  it("should return 'flat' for small changes", () => {
    expect(getChangeDirection(0)).toBe("flat");
    expect(getChangeDirection(0.3)).toBe("flat");
    expect(getChangeDirection(-0.3)).toBe("flat");
    expect(getChangeDirection(0.5)).toBe("flat");
    expect(getChangeDirection(-0.5)).toBe("flat");
  });
});

describe("computeChangeDescription", () => {
  it("should return 'flat' for small changes", () => {
    expect(computeChangeDescription(100, 100, 0)).toBe("flat");
    expect(computeChangeDescription(102, 100, 2)).toBe("flat");
    expect(computeChangeDescription(98, 100, -2)).toBe("flat");
  });

  it("should return 'no activity' when current is zero", () => {
    expect(computeChangeDescription(0, 100, -100)).toBe("no activity");
  });

  it("should return 'new activity' when previous was zero", () => {
    expect(computeChangeDescription(100, 0, 100)).toBe("new activity");
  });

  it("should return 'turned negative' for profit to loss with extreme swing", () => {
    // Went from +4000 to -19500 = -587.5% change
    expect(computeChangeDescription(-19500, 4000, -587.5)).toBe(
      "turned negative",
    );
  });

  it("should return 'turned positive' for loss to profit with extreme swing", () => {
    // Went from -5000 to +10000 = +300% change
    expect(computeChangeDescription(10000, -5000, 300)).toBe("turned positive");
  });

  it("should cap percentages at 999%", () => {
    // A 1500% increase should display as +999%
    expect(computeChangeDescription(1600, 100, 1500)).toBe("+999%");
    expect(computeChangeDescription(100, 1600, -1500)).toBe("-999%");
  });

  it("should show normal percentages for moderate changes", () => {
    expect(computeChangeDescription(150, 100, 50)).toBe("+50%");
    expect(computeChangeDescription(50, 100, -50)).toBe("-50%");
  });

  it("should show sign change text only for extreme swings over 200%", () => {
    // 150% change from negative to positive is not extreme enough
    expect(computeChangeDescription(50, -100, 150)).toBe("+150%");
    // 250% change is extreme
    expect(computeChangeDescription(150, -100, 250)).toBe("turned positive");
  });
});

describe("createMetric", () => {
  it("should create a metric with calculated change", () => {
    const metric = createMetric("revenue", 12000, 10000);

    expect(metric.type).toBe("revenue");
    expect(metric.label).toBe("Revenue");
    expect(metric.value).toBe(12000);
    expect(metric.previousValue).toBe(10000);
    expect(metric.change).toBe(20);
    expect(metric.changeDirection).toBe("up");
  });

  it("should round change to 1 decimal place", () => {
    const metric = createMetric("revenue", 10333, 10000);

    // 3.33% should round to 3.3
    expect(metric.change).toBe(3.3);
  });

  it("should set currency for currency metrics", () => {
    const metric = createMetric("revenue", 10000, 8000, "USD");

    expect(metric.currency).toBe("USD");
    expect(metric.unit).toBeUndefined();
  });

  it("should set unit for non-currency metrics", () => {
    const metric = createMetric("hours_tracked", 40, 35);

    expect(metric.unit).toBe("hours");
    expect(metric.currency).toBeUndefined();
  });

  it("should handle percentage metrics", () => {
    const metric = createMetric("profit_margin", 25, 20);

    expect(metric.unit).toBe("percentage");
    expect(metric.currency).toBeUndefined();
  });
});

describe("formatMetricValue", () => {
  describe("currency formatting", () => {
    it("should format USD currency", () => {
      const result = formatMetricValue(10000, "revenue", "USD");
      expect(result).toBe("$10,000");
    });

    it("should format EUR currency", () => {
      const result = formatMetricValue(10000, "expenses", "EUR", "de-DE");
      // Different locales may format differently
      expect(result).toContain("10");
      expect(result).toContain("000");
    });

    it("should format negative currency values", () => {
      const result = formatMetricValue(-5000, "net_profit", "USD");
      expect(result).toContain("5,000");
      expect(result).toContain("-");
    });
  });

  describe("percentage formatting", () => {
    it("should format percentage with 1 decimal", () => {
      const result = formatMetricValue(25.5, "profit_margin", "USD");
      expect(result).toBe("25.5%");
    });

    it("should handle zero percentage", () => {
      const result = formatMetricValue(0, "profit_margin", "USD");
      expect(result).toBe("0.0%");
    });

    it("should handle negative percentage", () => {
      const result = formatMetricValue(-10.5, "profit_margin", "USD");
      expect(result).toBe("-10.5%");
    });
  });

  describe("hours formatting", () => {
    it("should format hours with 1 decimal and 'h' suffix", () => {
      const result = formatMetricValue(40.5, "hours_tracked", "USD");
      expect(result).toBe("40.5h");
    });

    it("should format zero hours", () => {
      const result = formatMetricValue(0, "hours_tracked", "USD");
      expect(result).toBe("0.0h");
    });
  });

  describe("months formatting", () => {
    it("should format months with 1 decimal", () => {
      const result = formatMetricValue(12.5, "runway_months", "USD");
      expect(result).toBe("12.5 months");
    });

    it("should format low runway months", () => {
      const result = formatMetricValue(2.3, "runway_months", "USD");
      expect(result).toBe("2.3 months");
    });
  });

  describe("count formatting", () => {
    it("should format count values with locale grouping", () => {
      const result = formatMetricValue(1234, "invoices_sent", "USD");
      expect(result).toBe("1,234");
    });

    it("should format customer counts", () => {
      const result = formatMetricValue(42, "new_customers", "USD");
      expect(result).toBe("42");
    });
  });

  describe("fallback formatting", () => {
    it("should use currency for known financial metrics without explicit unit", () => {
      const result = formatMetricValue(5000, "cash_flow", "USD");
      expect(result).toBe("$5,000");
    });

    it("should use locale string for unknown types", () => {
      const result = formatMetricValue(123.45, "unknown_metric", "USD");
      expect(result).toContain("123");
    });
  });
});
