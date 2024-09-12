import { ExpenseByDate, ExpenseTransactionCountByDate } from "../types/expense";
import {
  CategoryChange,
  CategoryStats,
  IncomeByDate,
  IncomeOverTime,
  MonthlyIncomeByCategoryCountRecord,
  MonthlyIncomeTransactionCountRecord,
} from "../types/income";
import {
  MerchantAnalysisMetrics,
  MerchantSpendMetrics,
  TransformedTransaction,
} from "../types/merchant";
import {
  BankAccount,
  CreditAccount,
  ExpenseMetrics,
  IncomeMetrics,
  Milestone,
  PlaidAccountTransaction,
  SmartGoal,
  Transaction,
} from "solomon-ai-typescript-sdk";

export class FinancialDataProcessor {
  static formatBytes(
    bytes: number,
    opts: {
      decimals?: number;
      sizeType?: "accurate" | "normal";
    } = {},
  ): string {
    const { decimals = 0, sizeType = "normal" } = opts;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const accurateSizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizeType === "accurate" ? (accurateSizes[i] ?? "Bytes") : (sizes[i] ?? "Bytes")}`;
  }

  static composeEventHandlers<E>(
    originalEventHandler?: (event: E) => void,
    ourEventHandler?: (event: E) => void,
    { checkForDefaultPrevented = true } = {},
  ): (event: E) => void {
    return function handleEvent(event: E) {
      originalEventHandler?.(event);
      if (
        !checkForDefaultPrevented ||
        !(event as unknown as Event).defaultPrevented
      ) {
        return ourEventHandler?.(event);
      }
    };
  }

  static getGoals(account: BankAccount | CreditAccount): SmartGoal[] {
    return (
      account.pockets?.reduce(
        (acc, pocket) => acc.concat(pocket.goals ?? []),
        [] as SmartGoal[],
      ) ?? []
    );
  }

  static getMilestones(account: BankAccount | CreditAccount): Milestone[] {
    return (
      account.pockets?.reduce(
        (acc, pocket) =>
          acc.concat(
            pocket.goals?.reduce(
              (goalAcc, goal) => goalAcc.concat(goal.milestones ?? []),
              [] as Milestone[],
            ) ?? [],
          ),
        [] as Milestone[],
      ) ?? []
    );
  }

  static formatPocketName(input: string): string {
    const prefix = "POCKET_TYPE_";
    let formatted = input.startsWith(prefix)
      ? input.slice(prefix.length)
      : input;
    return formatted.replace(/_/g, " ").toLowerCase();
  }

  static formatNumber(
    input: number | undefined,
    numberOfDecimalPoint: number,
  ): string {
    return input === undefined ? "" : input.toFixed(numberOfDecimalPoint);
  }

  static formatDate(input: string | number | undefined): string {
    if (input === undefined) return "";
    const date = new Date(input);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  static removeUnderScores(input: string): string {
    const formatted = input.replace(/_/g, " ").toLowerCase();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  static formatCurrency(value: number): string {
    return value < 0
      ? `-$${Math.abs(value).toFixed(2)}`
      : `$${value.toFixed(2)}`;
  }

  static isTransaction(
    transaction: Transaction | PlaidAccountTransaction,
  ): transaction is Transaction {
    return typeof transaction.authorizedDate === "string";
  }

  static monthlyExpenseOverTime(
    data: Array<ExpenseMetrics>,
  ): Array<{ month: string; expense: number }> {
    return data
      .reduce(
        (acc, curr) => {
          const month = this.convertMonth(curr.month!);
          const expense = curr.totalExpenses ?? 0;
          const existingMonth = acc.find((entry) => entry.month === month);
          if (existingMonth) {
            existingMonth.expense += expense;
          } else {
            acc.push({ month, expense });
          }
          return acc;
        },
        [] as { month: string; expense: number }[],
      )
      .reverse();
  }

  static monthlyIncomeTransactionCount(
    data: Array<IncomeMetrics>,
  ): Array<MonthlyIncomeTransactionCountRecord> {
    return data
      .reduce((acc, curr) => {
        const month = this.convertMonth(curr.month!);
        const transactionCount =
          curr.transactionCount !== undefined
            ? Number(curr.transactionCount)
            : 0;
        const existingMonth = acc.find((entry) => entry.month === month);

        if (existingMonth) {
          existingMonth.transactionCount += transactionCount;
        } else {
          acc.push({ month, transactionCount });
        }

        return acc;
      }, [] as MonthlyIncomeTransactionCountRecord[])
      .reverse();
  }

  static monthlyExpenseTransactionCount(
    data: Array<ExpenseMetrics>,
  ): Array<MonthlyIncomeTransactionCountRecord> {
    return data
      .reduce((acc, curr) => {
        const month = this.convertMonth(curr.month!);
        const transactionCount =
          curr.transactionCount !== undefined
            ? Number(curr.transactionCount)
            : 0;
        const existingMonth = acc.find((entry) => entry.month === month);

        if (existingMonth) {
          existingMonth.transactionCount += transactionCount;
        } else {
          acc.push({ month, transactionCount });
        }

        return acc;
      }, [] as MonthlyIncomeTransactionCountRecord[])
      .reverse();
  }

  static monthlyIncomeTransactionCountByCategory(
    data: Array<IncomeMetrics>,
  ): Array<{ category: string; transactionCount: number }> {
    return data
      .reduce(
        (acc, curr) => {
          const category = this.convertToTitleCase(
            curr.personalFinanceCategoryPrimary!,
          );
          const transactionCount =
            curr.transactionCount !== undefined
              ? Number(curr.transactionCount)
              : 0;
          const existingCategory = acc.find(
            (entry) => entry.category === category,
          );

          if (existingCategory) {
            existingCategory.transactionCount += transactionCount;
          } else {
            acc.push({ category, transactionCount });
          }

          return acc;
        },
        [] as { category: string; transactionCount: number }[],
      )
      .reverse();
  }

  static monthlyIncomeCategoryTotals(
    data: Array<IncomeMetrics>,
  ): Array<MonthlyIncomeByCategoryCountRecord> {
    return data
      .reduce((acc, curr) => {
        const category = this.convertToTitleCase(
          curr.personalFinanceCategoryPrimary!,
        );
        const totalIncome =
          curr.totalIncome !== undefined ? Number(curr.totalIncome) : 0;
        const existingCategory = acc.find(
          (entry) => entry.category === category,
        );

        if (existingCategory) {
          existingCategory.totalIncome += totalIncome;
        } else {
          acc.push({ category, totalIncome });
        }

        return acc;
      }, [] as MonthlyIncomeByCategoryCountRecord[])
      .reverse();
  }

  static convertToTitleCase(input: string): string {
    const titleCaseWords = input.split("_").map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return titleCaseWords.join(" ").toLowerCase();
  }

  static convertMonth(monthInput: string | number): string {
    const monthNumber =
      typeof monthInput === "string" ? parseInt(monthInput, 10) : monthInput;
    if (isNaN(monthNumber) || monthNumber < 101 || monthNumber > 999912) {
      throw new Error("Invalid month input");
    }
    const year = Math.floor(monthNumber / 100);
    const month = monthNumber % 100;
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  static replaceUnderscoreWithSpace(str: string): string {
    return str.replace(/_/g, " ");
  }

  static formatToTwoDecimalPoints(input: number): string {
    return input.toFixed(2);
  }

  static frequencyToString(frequency: string): string {
    switch (frequency) {
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_ANNUALLY":
        return "Annually";
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_MONTHLY":
        return "Monthly";
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_BIWEEKLY":
        return "BiWeekly";
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_SEMI_MONTHLY":
        return "Semi-Monthly";
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_WEEKLY":
        return "Weekly";
      case "RE_OCCURING_TRANSACTIONS_FREQUENCY_UNSPECIFIED":
        return "Unspecified";
      case "UNRECOGNIZED":
        return "Unrecognized";
      default:
        return "Unknown";
    }
  }

  static currencyFormatter(number: number): string {
    return "$" + Intl.NumberFormat("us").format(number).toString();
  }

  static merchantAnalysisExtended(
    transactions: Transaction[],
  ): MerchantAnalysisMetrics {
    const transactionAmountsPerMerchant: Map<string, number[]> = new Map();
    let totalTransactionsCount = 0;

    transactions.forEach((transaction) => {
      const merchant = transaction.merchantName ?? "Unknown";
      const amount = transaction.amount ?? 0;
      totalTransactionsCount++;

      if (!transactionAmountsPerMerchant.has(merchant)) {
        transactionAmountsPerMerchant.set(merchant, []);
      }
      transactionAmountsPerMerchant.get(merchant)!.push(amount);
    });

    const medianTransactionAmount = new Map<string, number>();
    const highestTransaction = new Map<string, number>();
    const lowestTransaction = new Map<string, number>();
    const transactionAmountStdDev = new Map<string, number>();
    const percentageOfTotalTransactions = new Map<string, number>();

    transactionAmountsPerMerchant.forEach((amounts, merchant) => {
      amounts.sort((a, b) => a - b);
      const mid = Math.floor(amounts.length / 2);
      const median =
        amounts.length % 2 !== 0 && amounts[mid] !== undefined
          ? amounts[mid]
          : ((amounts[mid - 1] ?? 0) + (amounts[mid] ?? 0)) / 2;
      medianTransactionAmount.set(merchant, median ?? 0);
      highestTransaction.set(merchant, amounts[amounts.length - 1] ?? 0);
      lowestTransaction.set(merchant, amounts[0] ?? 0);

      const totalAmount = amounts.reduce((acc, val) => acc + val, 0);
      const mean = totalAmount / amounts.length;
      const variance =
        amounts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        amounts.length;
      const stdDev = Math.sqrt(variance);
      transactionAmountStdDev.set(merchant, stdDev);

      const percentage = amounts.length / totalTransactionsCount;
      percentageOfTotalTransactions.set(merchant, percentage);
    });

    return {
      medianTransactionAmount,
      highestTransaction,
      lowestTransaction,
      transactionAmountStdDev,
      percentageOfTotalTransactions,
    };
  }

  static chartValueFormatter(number: number): string {
    return `$${new Intl.NumberFormat("us").format(number).toString()}`;
  }

  static merchantAnalysis(transactions: Transaction[]): MerchantSpendMetrics {
    const totalSpend = new Map<string, number>();
    const transactionCount = new Map<string, number>();

    transactions.forEach((transaction) => {
      const merchant = transaction.merchantName ?? "Unknown";
      const amount = transaction.amount ?? 0;
      totalSpend.set(merchant, (totalSpend.get(merchant) || 0) + amount);
      transactionCount.set(merchant, (transactionCount.get(merchant) || 0) + 1);
    });

    const averageTransactionAmount = new Map<string, number>();
    totalSpend.forEach((amount, merchant) => {
      const count = transactionCount.get(merchant) || 1;
      averageTransactionAmount.set(merchant, amount / count);
    });

    const spendGrowthRate = new Map<string, number>();
    totalSpend.forEach((_, merchant) => {
      spendGrowthRate.set(merchant, 0);
    });

    return {
      totalSpend,
      averageTransactionAmount,
      transactionCount,
      spendGrowthRate,
    };
  }

  static groupTransactionsByMerchant(
    transactions: Transaction[],
  ): Map<string, TransformedTransaction[]> {
    const hashmap = new Map<string, TransformedTransaction[]>();

    transactions.forEach((transaction) => {
      const merchantName = transaction.merchantName ?? "Unknown";
      if (!hashmap.has(merchantName)) {
        hashmap.set(merchantName, []);
      }

      const txn = {
        ...transaction,
        date: transaction.currentDate
          ? new Date(transaction.currentDate).toLocaleDateString()
          : "",
      };

      hashmap.get(merchantName)!.push(txn);
    });

    return hashmap;
  }

  static convertExpenseMetricsToPositiveValues(
    data: Array<ExpenseMetrics>,
  ): Array<ExpenseMetrics> {
    return (
      data?.map((d) => ({
        ...d,
        totalExpenses: Math.abs(d.totalExpenses as number),
      })) ?? []
    );
  }

  static generateScale({
    name,
    isOverlay = false,
  }: {
    name: string;
    isOverlay?: boolean;
  }): Record<string, string> {
    const scale = Array.from({ length: 12 }, (_, i) => {
      const id = i + 1;
      if (isOverlay) {
        return [[`a${id}`, `var(--${name}-a${id})`]];
      }
      return [
        [id, `var(--${name}-${id})`],
        [`a${id}`, `var(--${name}-a${id})`],
      ];
    }).flat();

    return Object.fromEntries(scale);
  }

  static convertExpenseMetricsToExpenseBarChartData(
    expenseMetrics: ExpenseMetrics[],
    category?: string,
  ): Array<{ date: string; [key: string]: number | string }> {
    const expenseMap = new Map<string, number>();

    expenseMetrics.forEach((metric) => {
      const {
        month,
        totalExpenses = 0,
        personalFinanceCategoryPrimary,
      } = metric;

      const dateString = month?.toString() || "";

      if (
        personalFinanceCategoryPrimary !== category &&
        category !== "" &&
        category !== undefined
      ) {
        return;
      }

      const date = new Date(
        dateString.substring(0, 4) + "-" + dateString.substring(4, 6) + "-01",
      );
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      if (date) {
        expenseMap.set(
          formattedDate,
          (expenseMap.get(formattedDate) || 0) + totalExpenses,
        );
      }
    });

    return Array.from(expenseMap.entries()).map(([date, totalExpenses]) => ({
      date,
      totalExpenses,
    }));
  }

  static computeAverageExpense(expenseMetrics: ExpenseMetrics[]): number {
    const totalExpenses = expenseMetrics.reduce(
      (sum, metric) => sum + (metric.totalExpenses || 0),
      0,
    );
    return totalExpenses / expenseMetrics.length;
  }

  static computeMaxExpense(expenseMetrics: ExpenseMetrics[]): number {
    return Math.max(
      ...expenseMetrics.map((metric) => metric.totalExpenses || 0),
    );
  }

  static computeMinExpense(expenseMetrics: ExpenseMetrics[]): number {
    return Math.min(
      ...expenseMetrics.map((metric) => metric.totalExpenses || 0),
    );
  }

  static findMonthWithMaxExpense(expenseMetrics: ExpenseMetrics[]): string {
    const maxMetric = expenseMetrics.reduce(
      (max, metric) =>
        (metric.totalExpenses || 0) > (max.totalExpenses || 0) ? metric : max,
      {} as ExpenseMetrics,
    );
    return this.formatMonth(maxMetric.month);
  }

  static findMonthWithMinExpense(expenseMetrics: ExpenseMetrics[]): string {
    const minMetric = expenseMetrics.reduce(
      (min, metric) =>
        (metric.totalExpenses || 0) < (min.totalExpenses || 0) ? metric : min,
      {} as ExpenseMetrics,
    );
    return this.formatMonth(minMetric.month);
  }

  private static formatMonth(month?: number): string {
    if (!month) return "";
    const monthString = month.toString().padStart(6, "0");
    const year = monthString.substring(0, 4);
    const monthPart = monthString.substring(4, 6);
    return `${year}-${monthPart}`;
  }

  static transformExpenseMetricsToExpenseByDate = (
    metrics: ExpenseMetrics[],
  ): ExpenseByDate[] => {
    const expenseByMonth: Record<string, Record<string, number>> = {};

    metrics.forEach((metric) => {
      if (
        metric.month &&
        metric.personalFinanceCategoryPrimary &&
        metric.totalExpenses
      ) {
        const dateString = metric.month.toString();
        const date = new Date(
          dateString.substring(0, 4) + "-" + dateString.substring(4, 6) + "-01",
        );
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!expenseByMonth[formattedDate]) {
          expenseByMonth[formattedDate] = {};
        }

        const rec = expenseByMonth[formattedDate];

        if (rec !== undefined) {
          if (!rec[metric.personalFinanceCategoryPrimary]) {
            rec[metric.personalFinanceCategoryPrimary] = 0;
          }
          rec[metric.personalFinanceCategoryPrimary] =
            metric.totalExpenses ?? 0;
        }
      }
    });

    return Object.keys(expenseByMonth).map((date) => ({
      date,
      ...expenseByMonth[date],
    }));
  };

  static transformExpenseMetricsToExpenseTransactionCountByDate = (
    metrics: ExpenseMetrics[],
  ): ExpenseTransactionCountByDate[] => {
    const expenseByMonth: Record<string, Record<string, number>> = {};

    metrics.forEach((metric) => {
      if (
        metric.month &&
        metric.personalFinanceCategoryPrimary &&
        metric.transactionCount
      ) {
        const dateString = metric.month.toString();
        const date = new Date(
          dateString.substring(0, 4) + "-" + dateString.substring(4, 6) + "-01",
        );
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!expenseByMonth[formattedDate]) {
          expenseByMonth[formattedDate] = {};
        }

        const rec = expenseByMonth[formattedDate];

        if (rec !== undefined) {
          if (!rec[metric.personalFinanceCategoryPrimary]) {
            rec[metric.personalFinanceCategoryPrimary] = 0;
          }
          rec[metric.personalFinanceCategoryPrimary] =
            Number(metric.transactionCount) ?? 0;
        }
      }
    });

    return Object.keys(expenseByMonth).map((date) => ({
      date,
      ...expenseByMonth[date],
    }));
  };

  static transformIncomeMetricsToIncomeByDate(
    metrics: IncomeMetrics[],
  ): IncomeByDate[] {
    const incomeByMonth: Record<string, Record<string, number>> = {};

    metrics.forEach((metric) => {
      if (
        metric.month &&
        metric.personalFinanceCategoryPrimary &&
        metric.totalIncome
      ) {
        const dateString = metric.month.toString();
        const date = new Date(
          dateString.substring(0, 4) + "-" + dateString.substring(4, 6) + "-01",
        );
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!incomeByMonth[formattedDate]) {
          incomeByMonth[formattedDate] = {};
        }

        const rec = incomeByMonth[formattedDate];

        if (rec !== undefined) {
          if (!rec[metric.personalFinanceCategoryPrimary]) {
            rec[metric.personalFinanceCategoryPrimary] = 0;
          }
          rec[metric.personalFinanceCategoryPrimary] = metric.totalIncome ?? 0;
        }
      }
    });

    return Object.keys(incomeByMonth).map((date) => ({
      date,
      ...incomeByMonth[date],
    }));
  }

  static computeTotalRevenue(metrics: Array<IncomeMetrics>): number {
    return metrics.reduce((sum, metric) => sum + (metric.totalIncome ?? 0), 0);
  }

  static topPersonalFinanceCategories(metrics: Array<IncomeMetrics>): string[] {
    const categoryIncomeMap: Record<string, number> = {};
    metrics.forEach((metric) => {
      if (metric.personalFinanceCategoryPrimary && metric.totalIncome) {
        categoryIncomeMap[metric.personalFinanceCategoryPrimary] =
          (categoryIncomeMap[metric.personalFinanceCategoryPrimary] || 0) +
          metric.totalIncome;
      }
    });

    return Object.entries(categoryIncomeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
  }

  static calculateIncomeStats(metrics: IncomeMetrics[]): CategoryStats[] {
    const totalIncomeByCategory: Record<string, number> = {};
    let totalIncome = 0;

    // Sum total income for each category
    metrics.forEach((metric) => {
      const { personalFinanceCategoryPrimary: category, totalIncome: income } =
        metric;
      if (category && income) {
        totalIncome += income;
        totalIncomeByCategory[category] =
          (totalIncomeByCategory[category] || 0) + income;
      }
    });

    // Define color classes for the categories
    const colorClasses = [
      "bg-blue-500",
      "bg-green-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-purple-500",
    ];

    let colorIndex = 0;

    // Convert to desired structure
    return Object.keys(totalIncomeByCategory).map((category) => {
      const categoryIncome = totalIncomeByCategory[category] ?? 0;
      const percentage = (categoryIncome / totalIncome) * 100;
      const totalFormatted = `$${(categoryIncome / 1000).toFixed(1)}K`;
      const stats: CategoryStats = {
        category,
        percentage: parseFloat(percentage.toFixed(1)),
        total: categoryIncome,
        totalFormatted,
        color: colorClasses[colorIndex % colorClasses.length] || "bg-gray-500",
      };

      colorIndex++;
      return stats;
    });
  }

  static calculateCategoryChanges(metrics: IncomeMetrics[]): CategoryChange[] {
    // Validate the metrics is not empty
    if (!metrics.length) {
      return [];
    }

    // Object to keep track of the last statistic for each category
    const lastStatByCategory: Record<string, { month: number; stat: number }> =
      {};

    // Array to hold the calculated changes
    let changes: CategoryChange[] = [];

    for (const metric of metrics) {
      const {
        personalFinanceCategoryPrimary: category,
        totalIncome: currentStat,
        month,
      } = metric;

      // Continue to next iteration if required properties are missing
      if (!category || currentStat === undefined || month === undefined) {
        continue;
      }

      const lastStat = lastStatByCategory[category];

      // Calculate change if last stat exists and it's from a different month
      if (lastStat && lastStat.month !== month) {
        const previousStat = lastStat.stat;
        const incomeChange = currentStat - previousStat;
        const changeType =
          incomeChange > 0
            ? "positive"
            : incomeChange < 0
              ? "negative"
              : "neutral";
        const changePercentage =
          ((incomeChange / previousStat) * 100).toFixed(2) + "%";

        // Push the change object to the results array
        changes.push({
          category,
          month,
          currentStat,
          previousStat,
          change: changePercentage,
          changeType,
        });
      }

      // Update the last statistic for the current category
      lastStatByCategory[category] = { month, stat: currentStat };
    }

    // sort the changes by month
    changes = changes.sort((a, b) => a.month - b.month);

    return changes;
  }

  static getIncomeOverTimeByCategory(
    metrics: IncomeMetrics[],
  ): Record<string, IncomeOverTime> {
    // Sort by category and then by month
    metrics.sort((a, b) => {
      if (
        a.personalFinanceCategoryPrimary === b.personalFinanceCategoryPrimary
      ) {
        return (a.month ?? 0) - (b.month ?? 0);
      }
      return (a.personalFinanceCategoryPrimary ?? "").localeCompare(
        b.personalFinanceCategoryPrimary ?? "",
      );
    });

    const incomeOverTimeByCategory: Record<string, IncomeOverTime> = {};

    metrics.forEach((metric) => {
      if (
        metric.personalFinanceCategoryPrimary &&
        metric.totalIncome !== undefined &&
        metric.month !== undefined
      ) {
        const category = metric.personalFinanceCategoryPrimary;
        if (!incomeOverTimeByCategory[category]) {
          incomeOverTimeByCategory[category] = { category, incomes: [] };
        }
        incomeOverTimeByCategory[category]?.incomes.push(metric.totalIncome);
      }
    });

    return incomeOverTimeByCategory;
  }
}
