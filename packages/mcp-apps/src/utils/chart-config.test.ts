import { describe, expect, test } from "bun:test";
import {
  createCompactTickFormatter,
  getZeroInclusiveDomain,
} from "./chart-config";

describe("createCompactTickFormatter", () => {
  const fmt = createCompactTickFormatter();

  test("formats millions with one decimal", () => {
    expect(fmt(1_500_000)).toBe("1.5M");
    expect(fmt(2_000_000)).toBe("2.0M");
    expect(fmt(10_300_000)).toBe("10.3M");
  });

  test("formats thousands with no decimals", () => {
    expect(fmt(1_000)).toBe("1k");
    expect(fmt(1_234)).toBe("1k");
    expect(fmt(9_999)).toBe("10k");
    expect(fmt(50_000)).toBe("50k");
    expect(fmt(999_999)).toBe("1000k");
  });

  test("returns plain string for values under 1000", () => {
    expect(fmt(0)).toBe("0");
    expect(fmt(1)).toBe("1");
    expect(fmt(999)).toBe("999");
    expect(fmt(500)).toBe("500");
  });

  test("handles negative values", () => {
    expect(fmt(-1_500_000)).toBe("-1.5M");
    expect(fmt(-5_000)).toBe("-5k");
    expect(fmt(-42)).toBe("-42");
  });
});

describe("getZeroInclusiveDomain", () => {
  const [minFn, maxFn] = getZeroInclusiveDomain();

  test("includes zero when data is all positive", () => {
    expect(minFn(100)).toBe(0);
    expect(maxFn(500)).toBe(500);
  });

  test("includes zero when data is all negative", () => {
    expect(minFn(-300)).toBe(-300);
    expect(maxFn(-10)).toBe(0);
  });

  test("passes through when data spans zero", () => {
    expect(minFn(-50)).toBe(-50);
    expect(maxFn(200)).toBe(200);
  });

  test("handles zero as input", () => {
    expect(minFn(0)).toBe(0);
    expect(maxFn(0)).toBe(0);
  });
});
