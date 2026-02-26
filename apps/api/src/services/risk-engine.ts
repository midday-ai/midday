import type { Database } from "@db/client";
import { getMcaDealById } from "@db/queries/mca-deals";
import { getMcaPaymentsByDeal } from "@db/queries/mca-payments";
import { getMcaDeals } from "@db/queries/mca-deals";
import {
  getRiskConfig,
  DEFAULT_WEIGHTS,
  DEFAULT_EVENT_IMPACTS,
  type RiskWeights,
  type EventImpacts,
  type BandThresholds,
} from "@db/queries/risk-config";
import {
  getRiskScore,
  upsertRiskScore,
  type SubScores,
} from "@db/queries/risk-scores";
import { createRiskEvent, getRiskEvents } from "@db/queries/risk-events";

// ============================================================================
// Time-Decay Mathematics
// ============================================================================

/**
 * Calculate the decay factor for an event based on how old it is.
 * Uses exponential decay: factor = e^(-λ × days_since_event)
 * where λ = ln(2) / half_life_days
 */
function decayFactor(daysSinceEvent: number, halfLifeDays: number): number {
  const lambda = Math.LN2 / halfLifeDays;
  return Math.exp(-lambda * daysSinceEvent);
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
}

// ============================================================================
// Payment Classification
// ============================================================================

type PaymentClassification = {
  type:
    | "on_time"
    | "missed"
    | "nsf"
    | "partial"
    | "overpayment"
    | "recovery";
  paymentId: string;
  paymentDate: Date;
  amount: number;
  expectedAmount: number;
};

function classifyPayments(
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: string;
    nsfAt: string | null;
    balanceBefore: number | null;
    balanceAfter: number | null;
  }>,
  expectedDailyPayment: number,
): PaymentClassification[] {
  const classifications: PaymentClassification[] = [];
  let consecutiveMisses = 0;

  for (const payment of payments) {
    const date = new Date(payment.paymentDate);
    const amount = Number(payment.amount);
    const expected = expectedDailyPayment;

    // NSF / returned payment
    if (payment.status === "returned" || payment.nsfAt) {
      classifications.push({
        type: "nsf",
        paymentId: payment.id,
        paymentDate: date,
        amount,
        expectedAmount: expected,
      });
      consecutiveMisses++;
      continue;
    }

    // Skip non-completed payments
    if (payment.status !== "completed") {
      continue;
    }

    // Recovery: payment after consecutive misses
    if (consecutiveMisses > 0) {
      classifications.push({
        type: "recovery",
        paymentId: payment.id,
        paymentDate: date,
        amount,
        expectedAmount: expected,
      });
      consecutiveMisses = 0;
      continue;
    }

    // Amount-based classification
    if (expected > 0 && amount < expected * 0.9) {
      classifications.push({
        type: "partial",
        paymentId: payment.id,
        paymentDate: date,
        amount,
        expectedAmount: expected,
      });
    } else if (expected > 0 && amount > expected * 1.1) {
      classifications.push({
        type: "overpayment",
        paymentId: payment.id,
        paymentDate: date,
        amount,
        expectedAmount: expected,
      });
    } else {
      classifications.push({
        type: "on_time",
        paymentId: payment.id,
        paymentDate: date,
        amount,
        expectedAmount: expected,
      });
    }

    consecutiveMisses = 0;
  }

  return classifications;
}

// ============================================================================
// Sub-Score Calculations
// ============================================================================

function calculateConsistencyScore(
  classifications: PaymentClassification[],
  halfLifeDays: number,
  now: Date,
): number {
  if (classifications.length === 0) return 50;

  let weightedOnTime = 0;
  let weightedTotal = 0;

  for (const c of classifications) {
    const days = daysBetween(now, c.paymentDate);
    const decay = decayFactor(days, halfLifeDays);

    weightedTotal += decay;
    if (c.type === "on_time" || c.type === "overpayment") {
      weightedOnTime += decay;
    }
  }

  if (weightedTotal === 0) return 50;

  // 100 = perfectly consistent, 0 = all missed
  return Math.round((weightedOnTime / weightedTotal) * 100);
}

function calculateNsfScore(
  classifications: PaymentClassification[],
  halfLifeDays: number,
  now: Date,
): number {
  const nsfEvents = classifications.filter((c) => c.type === "nsf");
  if (nsfEvents.length === 0) return 0; // No NSFs = low risk

  let weightedNsf = 0;
  for (const c of nsfEvents) {
    const days = daysBetween(now, c.paymentDate);
    const decay = decayFactor(days, halfLifeDays);
    weightedNsf += decay;
  }

  // More NSFs (especially recent) = higher risk score
  // Cap at 100, each recent NSF adds ~20 points
  return Math.min(100, Math.round(weightedNsf * 20));
}

function calculateVelocityScore(
  deal: { fundingAmount: number; paybackAmount: number; totalPaid: number | null; fundedAt: string | null },
  now: Date,
): number {
  if (!deal.fundedAt) return 50;

  const fundedDate = new Date(deal.fundedAt);
  const daysSinceFunding = daysBetween(now, fundedDate);
  if (daysSinceFunding < 1) return 50;

  const totalPaid = Number(deal.totalPaid ?? 0);
  const paybackAmount = Number(deal.paybackAmount);

  if (paybackAmount <= 0) return 50;

  const percentPaid = totalPaid / paybackAmount;
  // Expected linear progress based on a rough 6-month (180-day) term
  const expectedProgress = Math.min(daysSinceFunding / 180, 1);

  if (expectedProgress === 0) return 50;

  const velocityRatio = percentPaid / expectedProgress;

  // ratio > 1 = ahead of schedule (low risk), < 1 = behind (high risk)
  if (velocityRatio >= 1.2) return 0; // Very ahead, low risk
  if (velocityRatio >= 1.0) return 20;
  if (velocityRatio >= 0.8) return 50;
  if (velocityRatio >= 0.6) return 70;
  return 90; // Very behind
}

function calculateRecoveryScore(
  classifications: PaymentClassification[],
  halfLifeDays: number,
  now: Date,
): number {
  const recoveries = classifications.filter((c) => c.type === "recovery");
  const misses = classifications.filter(
    (c) => c.type === "nsf" || c.type === "missed",
  );

  if (misses.length === 0) return 0; // No misses to recover from

  if (recoveries.length === 0) return 80; // Misses with no recovery = high risk

  let weightedRecovery = 0;
  for (const c of recoveries) {
    const days = daysBetween(now, c.paymentDate);
    weightedRecovery += decayFactor(days, halfLifeDays);
  }

  let weightedMisses = 0;
  for (const c of misses) {
    const days = daysBetween(now, c.paymentDate);
    weightedMisses += decayFactor(days, halfLifeDays);
  }

  if (weightedMisses === 0) return 0;

  const recoveryRatio = weightedRecovery / weightedMisses;

  // Higher recovery ratio = lower risk
  if (recoveryRatio >= 0.8) return 10;
  if (recoveryRatio >= 0.5) return 30;
  if (recoveryRatio >= 0.3) return 50;
  return 70;
}

function calculateProgressScore(
  deal: { paybackAmount: number; totalPaid: number | null; currentBalance: number | null },
): number {
  const totalPaid = Number(deal.totalPaid ?? 0);
  const paybackAmount = Number(deal.paybackAmount);

  if (paybackAmount <= 0) return 50;

  const percentPaid = totalPaid / paybackAmount;

  // More progress = less risk
  if (percentPaid >= 0.75) return 0;
  if (percentPaid >= 0.5) return 20;
  if (percentPaid >= 0.25) return 40;
  return 60;
}

function calculateAmountsScore(
  classifications: PaymentClassification[],
  halfLifeDays: number,
  now: Date,
): number {
  const completedPayments = classifications.filter(
    (c) => c.type !== "nsf" && c.type !== "missed",
  );

  if (completedPayments.length === 0) return 50;

  let weightedAccuracy = 0;
  let weightedTotal = 0;

  for (const c of completedPayments) {
    if (c.expectedAmount <= 0) continue;

    const days = daysBetween(now, c.paymentDate);
    const decay = decayFactor(days, halfLifeDays);
    const accuracy = Math.min(c.amount / c.expectedAmount, 1.5);

    weightedAccuracy += accuracy * decay;
    weightedTotal += decay;
  }

  if (weightedTotal === 0) return 50;

  const avgAccuracy = weightedAccuracy / weightedTotal;

  // accuracy near 1.0 = low risk, below = high risk
  if (avgAccuracy >= 1.0) return 0;
  if (avgAccuracy >= 0.9) return 20;
  if (avgAccuracy >= 0.75) return 50;
  return 80;
}

// ============================================================================
// Composite Score
// ============================================================================

function computeCompositeScore(
  subScores: SubScores,
  weights: RiskWeights,
): number {
  const raw =
    subScores.consistency * weights.consistency +
    subScores.nsf * weights.nsf +
    subScores.velocity * weights.velocity +
    subScores.recovery * weights.recovery +
    subScores.progress * weights.progress +
    subScores.amounts * weights.amounts;

  // Clamp 0-100
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function scoreToBand(
  score: number,
  thresholds: BandThresholds,
): "low" | "medium" | "high" {
  if (score <= thresholds.low_max) return "low";
  if (score >= thresholds.high_min) return "high";
  return "medium";
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Calculate (or recalculate) the risk score for a single deal.
 *
 * This is the main entry point called after every payment event.
 * It:
 * 1. Loads the team's risk config (or defaults)
 * 2. Fetches all payments for the deal
 * 3. Classifies each payment
 * 4. Computes 6 sub-scores with time-decay
 * 5. Computes composite score and band
 * 6. Logs risk events for new classifications
 * 7. Upserts the risk_scores row
 */
export async function calculateRiskScore(
  db: Database,
  dealId: string,
  teamId: string,
  triggeringPaymentId?: string,
): Promise<void> {
  const now = new Date();

  // Load config and deal in parallel
  const [config, deal, payments] = await Promise.all([
    getRiskConfig(db, { teamId }),
    getMcaDealById(db, { id: dealId, teamId }),
    getMcaPaymentsByDeal(db, { dealId, teamId }),
  ]);

  if (!deal) return;

  const weights = (config.weights ?? DEFAULT_WEIGHTS) as RiskWeights;
  const halfLifeDays = config.decayHalfLifeDays ?? 30;
  const thresholds = (config.bandThresholds ?? {
    low_max: 33,
    high_min: 67,
  }) as BandThresholds;

  // Sort payments chronologically (oldest first)
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
  );

  // Classify payments
  const expectedDaily = Number(deal.dailyPayment ?? 0);
  const classifications = classifyPayments(
    sortedPayments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paymentDate,
      status: p.status ?? "completed",
      nsfAt: p.nsfAt,
      balanceBefore: p.balanceBefore ? Number(p.balanceBefore) : null,
      balanceAfter: p.balanceAfter ? Number(p.balanceAfter) : null,
    })),
    expectedDaily,
  );

  // Calculate sub-scores
  const subScores: SubScores = {
    consistency: calculateConsistencyScore(classifications, halfLifeDays, now),
    nsf: calculateNsfScore(classifications, halfLifeDays, now),
    velocity: calculateVelocityScore(
      {
        fundingAmount: Number(deal.fundingAmount),
        paybackAmount: Number(deal.paybackAmount),
        totalPaid: deal.totalPaid ? Number(deal.totalPaid) : null,
        fundedAt: deal.fundedAt,
      },
      now,
    ),
    recovery: calculateRecoveryScore(classifications, halfLifeDays, now),
    progress: calculateProgressScore({
      paybackAmount: Number(deal.paybackAmount),
      totalPaid: deal.totalPaid ? Number(deal.totalPaid) : null,
      currentBalance: deal.currentBalance ? Number(deal.currentBalance) : null,
    }),
    amounts: calculateAmountsScore(classifications, halfLifeDays, now),
  };

  // Compute composite score
  const overallScore = computeCompositeScore(subScores, weights);
  const band = scoreToBand(overallScore, thresholds);

  // Get previous score for trend tracking
  const existingScore = await getRiskScore(db, { dealId, teamId });
  const previousScore = existingScore ? Number(existingScore.overallScore) : null;

  // Log risk event for the triggering payment
  if (triggeringPaymentId) {
    const triggeringClassification = classifications.find(
      (c) => c.paymentId === triggeringPaymentId,
    );

    if (triggeringClassification) {
      const eventImpacts = (config.eventImpacts ?? DEFAULT_EVENT_IMPACTS) as EventImpacts;
      const impactMap: Record<string, keyof EventImpacts> = {
        on_time: "on_time_payment",
        missed: "missed_payment",
        nsf: "nsf_event",
        partial: "partial_payment",
        overpayment: "overpayment",
        recovery: "recovery_payment",
      };

      const impactKey = impactMap[triggeringClassification.type];
      const rawImpact = impactKey ? eventImpacts[impactKey] : 0;

      await createRiskEvent(db, {
        teamId,
        dealId,
        paymentId: triggeringPaymentId,
        eventType: triggeringClassification.type,
        eventDate: triggeringClassification.paymentDate.toISOString(),
        rawImpact,
        decayedImpact: rawImpact, // No decay at time of event
        metadata: {
          amount: triggeringClassification.amount,
          expectedAmount: triggeringClassification.expectedAmount,
          scoreBefore: previousScore,
          scoreAfter: overallScore,
        },
      });
    }
  }

  // Upsert the score
  await upsertRiskScore(db, {
    teamId,
    dealId,
    overallScore,
    previousScore,
    band,
    subScores,
    triggeringPaymentId,
  });
}

/**
 * Recalculate risk scores for all active deals belonging to a team.
 * Used when the team changes their risk config.
 */
export async function recalculateAllDealRisks(
  db: Database,
  teamId: string,
): Promise<{ recalculated: number }> {
  const { data: deals } = await getMcaDeals(db, {
    teamId,
    status: "active",
    pageSize: 100,
  });

  let recalculated = 0;

  for (const deal of deals) {
    await calculateRiskScore(db, deal.id, teamId);
    recalculated++;
  }

  return { recalculated };
}
