/**
 * @file unusualTransactionDetection.ts
 * @description This module provides functionality to detect unusual transactions
 * based on amount and frequency patterns, returning the results for further processing.
 */

import { Database } from "@midday/supabase/types";
import { eventTrigger } from "@trigger.dev/sdk";
import { differenceInDays, format, parseISO, subMonths } from "date-fns";
import { z } from "zod";
import { client, supabase } from "../client";
import { Events, Jobs } from "../constants";

// Type Definitions

/** Represents a financial transaction. */
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

/** Configuration for unusual transaction detection. */
interface DetectionConfig {
  /** Number of standard deviations for amount threshold. */
  stdDevThreshold: number;
  /** Minimum days between transactions to be considered unusual. */
  frequencyThreshold: number;
  /** Multiplier applied to median for amount threshold. */
  medianMultiplier: number;
}

/** Statistical measures of a dataset. */
interface Stats {
  mean: number;
  stdDev: number;
  median: number;
}

/** Reason for flagging a transaction as unusual. */
interface DetectionReason {
  type: "amount" | "frequency";
  description: string;
}

/** A transaction flagged as unusual with reasons. */
interface UnusualTransaction extends Transaction {
  reasons: DetectionReason[];
}

// Utility Functions

/**
 * Calculates statistical measures from an array of numbers.
 *
 * @param numbers - Array of numbers to analyze.
 * @returns Statistical measures of the dataset.
 *
 * @example
 * const stats = calculateStats([1, 2, 3, 4, 5]);
 * console.log(stats);
 * // Output: { mean: 3, stdDev: 1.4142135623730951, median: 3 }
 */
function calculateStats(numbers: number[]): Stats {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const variance =
    numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) /
    numbers.length;
  const stdDev = Math.sqrt(variance);
  const median =
    sorted.length % 2 === 0
      ? ((sorted[sorted.length / 2 - 1] ?? 0) +
          (sorted[sorted.length / 2] ?? 0)) /
        2
      : sorted[Math.floor(sorted.length / 2)] ?? 0;

  return { mean, stdDev, median };
}

// Detection Functions

/**
 * Checks if a transaction has an unusual amount.
 *
 * @param transaction - Transaction to check.
 * @param stats - Statistical measures of the dataset.
 * @param config - Detection configuration.
 * @returns Reasons for unusual amount, if any.
 *
 * @example
 * const transaction = { amount: 1000 };
 * const stats = { mean: 500, stdDev: 100, median: 450 };
 * const config = { stdDevThreshold: 2, medianMultiplier: 3 };
 * const reasons = checkUnusualAmount(transaction, stats, config);
 * console.log(reasons);
 * // Output: [
 * //   { type: 'amount', description: 'Unusually high amount (1000.00 vs. average 500.00)' },
 * //   { type: 'amount', description: 'Amount significantly higher than median (1000.00 vs. median 450.00)' }
 * // ]
 */
function checkUnusualAmount(
  transaction: Transaction,
  stats: Stats,
  config: DetectionConfig
): DetectionReason[] {
  const reasons: DetectionReason[] = [];
  const absAmount = Math.abs(transaction.amount);

  if (absAmount > stats.mean + config.stdDevThreshold * stats.stdDev) {
    reasons.push({
      type: "amount",
      description: `Unusually high amount (${absAmount.toFixed(2)} vs. average ${stats.mean.toFixed(2)})`,
    });
  } else if (
    absAmount < stats.mean - config.stdDevThreshold * stats.stdDev &&
    absAmount > 0
  ) {
    reasons.push({
      type: "amount",
      description: `Unusually low amount (${absAmount.toFixed(2)} vs. average ${stats.mean.toFixed(2)})`,
    });
  }

  if (absAmount > stats.median * config.medianMultiplier) {
    reasons.push({
      type: "amount",
      description: `Amount significantly higher than median (${absAmount.toFixed(2)} vs. median ${stats.median.toFixed(2)})`,
    });
  }

  return reasons;
}

/**
 * Checks if a transaction has an unusual frequency.
 *
 * @param transaction - Transaction to check.
 * @param merchantTransactions - Previous transactions for the same merchant.
 * @param config - Detection configuration.
 * @returns Reason for unusual frequency, if any.
 *
 * @example
 * const transaction = { date: '2023-01-03', merchant_name: 'Store A' };
 * const merchantTransactions = [
 *   { date: '2023-01-01', merchant_name: 'Store A' },
 *   { date: '2023-01-02', merchant_name: 'Store A' },
 *   transaction
 * ];
 * const config = { frequencyThreshold: 7 };
 * const reason = checkUnusualFrequency(transaction, merchantTransactions, config);
 * console.log(reason);
 * // Output: { type: 'frequency', description: 'Unusual frequency for Store A (1 days since last transaction vs. average 1.0 days)' }
 */
function checkUnusualFrequency(
  transaction: Transaction,
  merchantTransactions: Transaction[],
  config: DetectionConfig
): DetectionReason | null {
  if (merchantTransactions.length < 2) return null;

  const sortedDates = merchantTransactions
    .map((t) => parseISO(t.date))
    .sort((a, b) => a.getTime() - b.getTime());
  const avgDaysBetween =
    differenceInDays(sortedDates[sortedDates.length - 1]!, sortedDates[0]!) /
    (sortedDates.length - 1);
  const daysSinceLastTxn = differenceInDays(
    parseISO(transaction.date),
    sortedDates[sortedDates.length - 2]!
  );

  if (
    daysSinceLastTxn < avgDaysBetween / 2 &&
    daysSinceLastTxn < config.frequencyThreshold
  ) {
    return {
      type: "frequency",
      description: `Unusual frequency for ${transaction.merchant_name} (${daysSinceLastTxn} days since last transaction vs. average ${avgDaysBetween.toFixed(1)} days)`,
    };
  }

  return null;
}

/**
 * Identifies unusual transactions based on amount and frequency.
 *
 * @param transactions - Transactions to analyze.
 * @param config - Detection configuration.
 * @returns Array of unusual transactions with reasons for flagging.
 *
 * @example
 * const transactions = [
 *   { id: '1', amount: 100, date: '2023-01-01', merchant_name: 'Store A' },
 *   { id: '2', amount: 1000, date: '2023-01-02', merchant_name: 'Store B' },
 *   { id: '3', amount: 50, date: '2023-01-03', merchant_name: 'Store A' }
 * ];
 * const config = { stdDevThreshold: 2, frequencyThreshold: 7, medianMultiplier: 3 };
 * const unusualTransactions = identifyUnusualTransactions(transactions, config);
 * console.log(unusualTransactions);
 * // Output: [
 * //   {
 * //     id: '2', amount: 1000, date: '2023-01-02', merchant_name: 'Store B',
 * //     reasons: [
 * //       { type: 'amount', description: 'Unusually high amount (1000.00 vs. average 383.33)' },
 * //       { type: 'amount', description: 'Amount significantly higher than median (1000.00 vs. median 100.00)' }
 * //     ]
 * //   },
 * //   {
 * //     id: '3', amount: 50, date: '2023-01-03', merchant_name: 'Store A',
 * //     reasons: [
 * //       { type: 'frequency', description: 'Unusual frequency for Store A (2 days since last transaction vs. average 2.0 days)' }
 * //     ]
 * //   }
 * // ]
 */
function identifyUnusualTransactions(
  transactions: Transaction[],
  config: DetectionConfig
): UnusualTransaction[] {
  const amounts = transactions.map((t) => Math.abs(t.amount));
  const stats = calculateStats(amounts);

  const merchantTransactions: Record<string, Transaction[]> = {};
  transactions.forEach((t) => {
    if (t.merchant_name) {
      merchantTransactions[t.merchant_name] =
        merchantTransactions[t.merchant_name] || [];
      merchantTransactions[t.merchant_name]?.push(t);
    }
  });

  return transactions.reduce<UnusualTransaction[]>(
    (unusualTxns, transaction) => {
      const reasons: DetectionReason[] = [
        ...checkUnusualAmount(transaction, stats, config),
        ...(transaction.merchant_name
          ? [
              checkUnusualFrequency(
                transaction,
                merchantTransactions[transaction.merchant_name] || [],
                config
              ),
            ]
          : []
        ).filter((reason): reason is DetectionReason => reason !== null),
      ];

      if (reasons.length > 0) {
        unusualTxns.push({ ...transaction, reasons });
      }

      return unusualTxns;
    },
    []
  );
}

// Job Definition

/**
 * Defines a job to identify unusual transactions for a given team.
 *
 * This job retrieves recent transactions, analyzes them for unusual patterns,
 * and returns the results for further processing.
 *
 * @example
 * // To trigger this job:
 * import { client } from "../client";
 * import { Events } from "../constants";
 *
 * const triggerUnusualTransactionDetection = async () => {
 *   const event = await client.sendEvent({
 *     name: Events.IDENTIFY_UNUSUAL_TRANSACTIONS,
 *     payload: {
 *       teamId: "team_123456",
 *       lookbackMonths: 3,
 *       stdDevThreshold: 2,
 *       frequencyThreshold: 7,
 *       medianMultiplier: 3
 *     },
 *   });
 *   console.log("Unusual transaction detection job triggered:", event);
 * };
 *
 * triggerUnusualTransactionDetection();
 */
client.defineJob({
  id: Jobs.IDENTIFY_UNUSUAL_TRANSACTIONS,
  name: "Transactions - Identify Unusual",
  version: "0.2.0",
  trigger: eventTrigger({
    name: Events.IDENTIFY_UNUSUAL_TRANSACTIONS,
    schema: z.object({
      teamId: z.string(),
      lookbackMonths: z.number().int().positive().default(3),
      stdDevThreshold: z.number().positive().default(2),
      frequencyThreshold: z.number().int().positive().default(7),
      medianMultiplier: z.number().positive().default(3),
    }),
  }),
  integrations: { supabase },
  run: async (payload, io, ctx) => {
    const { teamId, lookbackMonths, ...config } = payload;

    await io.logger.info("Starting unusual transaction detection", {
      teamId,
      lookbackMonths,
    });

    const startDate = format(
      subMonths(new Date(), lookbackMonths),
      "yyyy-MM-dd"
    );
    const { data: transactions, error } = await io.supabase.client
      .from("transactions")
      .select("*")
      .eq("team_id", teamId)
      .gte("date", startDate)
      .order("date", { ascending: false });

    if (error) {
      await io.logger.error("Failed to fetch transactions", {
        error: error.message,
      });
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    await io.logger.info("Transactions fetched", {
      count: transactions.length,
    });

    const unusualTransactions = identifyUnusualTransactions(
      transactions,
      config
    );

    await io.logger.info("Unusual transactions identified", {
      count: unusualTransactions.length,
    });

    return {
      message: "Unusual transaction detection completed successfully",
      unusualTransactions: unusualTransactions,
      unusualTransactionsCount: unusualTransactions.length,
    };
  },
});
