import { PlaidAccountTransaction } from "client-typescript-sdk";

/**
 * Represents the result of the small business analytics calculations.
 */
type AnalyticsResult = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  averageTransactionValue: number;
  monthlyRecurringRevenue: number;
  topExpenseCategory: string;
  topRevenueCategory: string;
  cashFlowPositive: boolean;
  pendingTransactionsCount: number;
  mostFrequentMerchant: string;
  averageTransactionTime: string;
  internationalTransactionsPercentage: number;
  onlineTransactionsPercentage: number;
  largestSingleExpense: number;
  largestSingleIncome: number;
  transactionsPerDay: number;
  uniqueMerchantsCount: number;
  averageTransactionsByDayOfWeek: Record<string, number>;
  categoriesDistribution: Record<string, number>;
};

/**
 * A class that performs analytics on small business transactions.
 */
class SmallBusinessAnalytics {
  private transactions: PlaidAccountTransaction[];
  private cachedResults: Map<string, Partial<AnalyticsResult>> = new Map();

  /**
   * Creates an instance of SmallBusinessAnalytics.
   * @param transactions - An array of PlaidAccountTransaction objects.
   */
  constructor(transactions: PlaidAccountTransaction[]) {
    this.transactions = transactions;
    this.preProcessTransactions();
  }

  /**
   * Pre-processes transactions to improve efficiency of subsequent calculations.
   */
  private preProcessTransactions(): void {
    this.transactions.forEach((t) => {
      if (t.currentDate) {
        t.currentDate = new Date(t.currentDate);
      }
      if (t.time) {
        t.time = new Date(t.time);
      }
    });
  }

  /**
   * Calculates and returns all analytics results.
   * @param startDate - Optional start date for analysis period.
   * @param endDate - Optional end date for analysis period.
   * @returns An object containing all calculated analytics.
   */
  public getAnalytics(startDate?: Date, endDate?: Date): AnalyticsResult {
    const cacheKey = this.getCacheKey(startDate, endDate);
    if (!this.cachedResults.has(cacheKey)) {
      const filteredTransactions = this.getTransactionsInDateRange(
        startDate,
        endDate,
      );
      const results = this.calculateAnalytics(filteredTransactions);
      this.cachedResults.set(cacheKey, results);
    }
    return this.cachedResults.get(cacheKey) as AnalyticsResult;
  }

  private getCacheKey(startDate?: Date, endDate?: Date): string {
    return `${startDate?.toISOString() || "start"}_${endDate?.toISOString() || "end"}`;
  }

  private getTransactionsInDateRange(
    startDate?: Date,
    endDate?: Date,
  ): PlaidAccountTransaction[] {
    if (!startDate && !endDate) return this.transactions;
    return this.transactions.filter((t) => {
      const transactionDate = t.currentDate!;
      return (
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate)
      );
    });
  }

  private calculateAnalytics(
    transactions: PlaidAccountTransaction[],
  ): AnalyticsResult {
    return {
      totalRevenue: this.getTotalRevenue(transactions),
      totalExpenses: this.getTotalExpenses(transactions),
      netProfit: this.getNetProfit(transactions),
      profitMargin: this.getProfitMargin(transactions),
      averageTransactionValue: this.getAverageTransactionValue(transactions),
      monthlyRecurringRevenue: this.getMonthlyRecurringRevenue(transactions),
      topExpenseCategory: this.getTopCategory(transactions, "expense"),
      topRevenueCategory: this.getTopCategory(transactions, "revenue"),
      cashFlowPositive: this.isCashFlowPositive(transactions),
      pendingTransactionsCount: this.getPendingTransactionsCount(transactions),
      mostFrequentMerchant: this.getMostFrequentMerchant(transactions),
      averageTransactionTime: this.getAverageTransactionTime(transactions),
      internationalTransactionsPercentage:
        this.getInternationalTransactionsPercentage(transactions),
      onlineTransactionsPercentage:
        this.getOnlineTransactionsPercentage(transactions),
      largestSingleExpense: this.getLargestSingleTransaction(
        transactions,
        "expense",
      ),
      largestSingleIncome: this.getLargestSingleTransaction(
        transactions,
        "income",
      ),
      transactionsPerDay: this.getTransactionsPerDay(transactions),
      uniqueMerchantsCount: this.getUniqueMerchantsCount(transactions),
      averageTransactionsByDayOfWeek:
        this.getAverageTransactionsByDayOfWeek(transactions),
      categoriesDistribution: this.getCategoriesDistribution(transactions),
    };
  }

  private getTotalRevenue(transactions: PlaidAccountTransaction[]): number {
    return transactions
      .filter((t) => t.amount !== undefined && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount!), 0);
  }

  private getTotalExpenses(transactions: PlaidAccountTransaction[]): number {
    return transactions
      .filter((t) => t.amount !== undefined && t.amount > 0)
      .reduce((sum, t) => sum + t.amount!, 0);
  }

  private getNetProfit(transactions: PlaidAccountTransaction[]): number {
    return (
      this.getTotalRevenue(transactions) - this.getTotalExpenses(transactions)
    );
  }

  private getProfitMargin(transactions: PlaidAccountTransaction[]): number {
    const revenue = this.getTotalRevenue(transactions);
    return revenue ? (this.getNetProfit(transactions) / revenue) * 100 : 0;
  }

  private getAverageTransactionValue(
    transactions: PlaidAccountTransaction[],
  ): number {
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount ?? 0),
      0,
    );
    return transactions.length ? totalAmount / transactions.length : 0;
  }

  private getMonthlyRecurringRevenue(
    transactions: PlaidAccountTransaction[],
  ): number {
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(
        (t) =>
          t.amount !== undefined &&
          t.amount < 0 &&
          t.currentDate?.getMonth() === currentMonth,
      )
      .reduce((sum, t) => sum + Math.abs(t.amount!), 0);
  }

  private getTopCategory(
    transactions: PlaidAccountTransaction[],
    type: "expense" | "revenue",
  ): string {
    const categories = transactions
      .filter(
        (t) =>
          t.amount !== undefined &&
          (type === "expense" ? t.amount > 0 : t.amount < 0),
      )
      .reduce(
        (acc, t) => {
          const category = t.personalFinanceCategoryPrimary || "Uncategorized";
          acc[category] = (acc[category] || 0) + Math.abs(t.amount!);
          return acc;
        },
        {} as Record<string, number>,
      );
    return (
      Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None"
    );
  }

  private isCashFlowPositive(transactions: PlaidAccountTransaction[]): boolean {
    return this.getNetProfit(transactions) > 0;
  }

  private getPendingTransactionsCount(
    transactions: PlaidAccountTransaction[],
  ): number {
    return transactions.filter((t) => t.pending).length;
  }

  private getMostFrequentMerchant(
    transactions: PlaidAccountTransaction[],
  ): string {
    const merchantCounts = transactions.reduce(
      (acc, t) => {
        const merchant = t.merchantName || "Unknown";
        acc[merchant] = (acc[merchant] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return (
      Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "None"
    );
  }

  private getAverageTransactionTime(
    transactions: PlaidAccountTransaction[],
  ): string {
    const times = transactions
      .filter((t) => t.time)
      .map((t) => t.time!.getHours() * 60 + t.time!.getMinutes());
    const avgMinutes = times.length
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  private getInternationalTransactionsPercentage(
    transactions: PlaidAccountTransaction[],
  ): number {
    const internationalCount = transactions.filter(
      (t) => t.isoCurrencyCode && t.isoCurrencyCode !== "USD",
    ).length;
    return transactions.length
      ? (internationalCount / transactions.length) * 100
      : 0;
  }

  private getOnlineTransactionsPercentage(
    transactions: PlaidAccountTransaction[],
  ): number {
    const onlineCount = transactions.filter(
      (t) => t.paymentChannel === "online",
    ).length;
    return transactions.length ? (onlineCount / transactions.length) * 100 : 0;
  }

  private getLargestSingleTransaction(
    transactions: PlaidAccountTransaction[],
    type: "expense" | "income",
  ): number {
    return Math.max(
      ...transactions
        .filter(
          (t) =>
            t.amount !== undefined &&
            (type === "expense" ? t.amount > 0 : t.amount < 0),
        )
        .map((t) => Math.abs(t.amount!)),
      0,
    );
  }

  private getTransactionsPerDay(
    transactions: PlaidAccountTransaction[],
  ): number {
    const days = new Set(transactions.map((t) => t.currentDate?.toDateString()))
      .size;
    return days ? transactions.length / days : 0;
  }

  private getUniqueMerchantsCount(
    transactions: PlaidAccountTransaction[],
  ): number {
    return new Set(transactions.map((t) => t.merchantName)).size;
  }

  private getAverageTransactionsByDayOfWeek(
    transactions: PlaidAccountTransaction[],
  ): Record<string, number> {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayCounts = dayNames.reduce(
      (acc, day) => {
        acc[day] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    transactions.forEach((t) => {
      if (t.currentDate) {
        const day = dayNames[t.currentDate.getDay()] || "Sunday";
        dayCounts[day]!++;
      }
    });

    const weeks = Math.ceil(transactions.length / 7) || 1;
    return Object.fromEntries(
      dayNames.map((day) => [day, dayCounts[day]! / weeks]),
    );
  }

  private getCategoriesDistribution(
    transactions: PlaidAccountTransaction[],
  ): Record<string, number> {
    const categoryCounts = transactions.reduce(
      (acc, t) => {
        const category = t.personalFinanceCategoryPrimary || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const total = Object.values(categoryCounts).reduce(
      (sum, count) => sum + count,
      0,
    );
    return Object.fromEntries(
      Object.entries(categoryCounts).map(([category, count]) => [
        category,
        total ? (count / total) * 100 : 0,
      ]),
    );
  }

  public compareAnalytics(
    period1Start: Date,
    period1End: Date,
    period2Start: Date,
    period2End: Date,
  ): Record<
    keyof AnalyticsResult,
    {
      period1: number | string;
      period2: number | string;
      change: number | string;
    }
  > {
    const analytics1 = this.getAnalytics(period1Start, period1End);
    const analytics2 = this.getAnalytics(period2Start, period2End);

    const comparison: any = {};
    for (const key in analytics1) {
      const value1 = analytics1[key as keyof AnalyticsResult];
      const value2 = analytics2[key as keyof AnalyticsResult];

      if (typeof value1 === "number" && typeof value2 === "number") {
        comparison[key] = {
          period1: value1,
          period2: value2,
          change: value2 - value1,
        };
      } else {
        comparison[key] = {
          period1: value1,
          period2: value2,
          change: "N/A",
        };
      }
    }

    return comparison;
  }
}

export default SmallBusinessAnalytics;
