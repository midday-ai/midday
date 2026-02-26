import { eachMonthOfInterval, format, parseISO } from "date-fns";

function generateMonths(from: string, to: string) {
  const months = eachMonthOfInterval({
    start: parseISO(from),
    end: parseISO(to),
  });
  return months.map((m) => format(m, "yyyy-MM-dd"));
}

// Seeded pseudo-random for deterministic mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function mockCollectionPerformance(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(42);
  let totalCollected = 0;
  let totalExpected = 0;

  const result = months.map((date) => {
    const expected = 80000 + rand() * 40000;
    const rate = 0.82 + rand() * 0.15;
    const collected = expected * rate;
    totalCollected += collected;
    totalExpected += expected;
    return {
      date,
      collected: Math.round(collected),
      expected: Math.round(expected),
      collectionRate: Math.round(rate * 1000) / 10,
    };
  });

  return {
    summary: { totalCollected: Math.round(totalCollected), totalExpected: Math.round(totalExpected) },
    result,
  };
}

export function mockFundingActivity(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(137);
  let totalFunded = 0;

  const result = months.map((date) => {
    const dealCount = Math.floor(2 + rand() * 5);
    const avgDealSize = 25000 + rand() * 30000;
    const funded = dealCount * avgDealSize;
    totalFunded += funded;
    return {
      date,
      funded: Math.round(funded),
      dealCount,
      avgDealSize: Math.round(avgDealSize),
    };
  });

  return {
    summary: { totalFunded: Math.round(totalFunded) },
    result,
  };
}

export function mockPortfolioComposition(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(256);

  const result = months.map((date, i) => {
    const base = 8 + i;
    const active = Math.max(1, Math.floor(base * (0.5 + rand() * 0.2)));
    const late = Math.floor(base * (0.08 + rand() * 0.08));
    const defaulted = Math.floor(base * (0.03 + rand() * 0.04));
    const paidOff = Math.floor(base * (0.2 + rand() * 0.15));
    const paused = Math.floor(base * (0.02 + rand() * 0.03));
    return { date, active, late, defaulted, paidOff, paused };
  });

  const latest = result[result.length - 1]!;
  return {
    summary: {
      activeDeals: latest.active,
      totalDeals: latest.active + latest.late + latest.defaulted + latest.paidOff + latest.paused,
    },
    result,
  };
}

export function mockFactorRateReturns(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(314);
  let totalRevenue = 0;

  const result = months.map((date) => {
    const funded = 100000 + rand() * 150000;
    const factorRate = 1.25 + rand() * 0.2;
    const payback = funded * factorRate;
    const revenue = payback - funded;
    totalRevenue += revenue;
    return {
      date,
      revenue: Math.round(revenue),
      funded: Math.round(funded),
      avgFactorRate: Math.round(factorRate * 100) / 100,
    };
  });

  return {
    summary: { totalRevenue: Math.round(totalRevenue) },
    result,
  };
}

export function mockRtrAging(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(512);
  let totalOutstanding = 0;

  const result = months.map((date) => {
    const bucket0to30 = 120000 + rand() * 80000;
    const bucket31to60 = 60000 + rand() * 50000;
    const bucket61to90 = 20000 + rand() * 30000;
    const bucket90plus = 10000 + rand() * 20000;
    const total = bucket0to30 + bucket31to60 + bucket61to90 + bucket90plus;
    totalOutstanding = total;
    return {
      date,
      "0-30": Math.round(bucket0to30),
      "31-60": Math.round(bucket31to60),
      "61-90": Math.round(bucket61to90),
      "90+": Math.round(bucket90plus),
    };
  });

  return {
    summary: { totalOutstanding: Math.round(totalOutstanding) },
    result,
  };
}

export function mockNsfDefaultTrends(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(777);
  let totalNsf = 0;

  const result = months.map((date) => {
    const nsfCount = Math.floor(rand() * 12);
    const defaultRate = 2 + rand() * 6;
    totalNsf += nsfCount;
    return {
      date,
      nsfCount,
      defaultRate: Math.round(defaultRate * 10) / 10,
    };
  });

  return {
    summary: { totalNsf },
    result,
  };
}

export function mockRepaymentVelocity(from: string, to: string) {
  const months = generateMonths(from, to);
  const rand = seededRandom(999);

  const result = months.map((date) => {
    const expectedDays = 120 + Math.floor(rand() * 40);
    const actualDays = expectedDays + Math.floor((rand() - 0.4) * 30);
    return {
      date,
      actualDays,
      expectedDays,
    };
  });

  const avgActual = Math.round(result.reduce((s, r) => s + r.actualDays, 0) / result.length);
  return {
    summary: { avgDaysToPayoff: avgActual },
    result,
  };
}
