"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class that performs analytics on small business transactions.
 */
class SmallBusinessAnalytics {
  transactions;
  cachedResults = new Map();
  /**
   * Creates an instance of SmallBusinessAnalytics.
   * @param transactions - An array of PlaidAccountTransaction objects.
   */
  constructor(transactions) {
    this.transactions = transactions;
    this.preProcessTransactions();
  }
  /**
   * Pre-processes transactions to improve efficiency of subsequent calculations.
   */
  preProcessTransactions() {
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
  getAnalytics(startDate, endDate) {
    const cacheKey = this.getCacheKey(startDate, endDate);
    if (!this.cachedResults.has(cacheKey)) {
      const filteredTransactions = this.getTransactionsInDateRange(
        startDate,
        endDate,
      );
      const results = this.calculateAnalytics(filteredTransactions);
      this.cachedResults.set(cacheKey, results);
    }
    return this.cachedResults.get(cacheKey);
  }
  getCacheKey(startDate, endDate) {
    return `${startDate?.toISOString() || "start"}_${endDate?.toISOString() || "end"}`;
  }
  getTransactionsInDateRange(startDate, endDate) {
    if (!startDate && !endDate) return this.transactions;
    return this.transactions.filter((t) => {
      const transactionDate = t.currentDate;
      return (
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate)
      );
    });
  }
  calculateAnalytics(transactions) {
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
  getTotalRevenue(transactions) {
    return transactions
      .filter((t) => t.amount !== undefined && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  getTotalExpenses(transactions) {
    return transactions
      .filter((t) => t.amount !== undefined && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  getNetProfit(transactions) {
    return (
      this.getTotalRevenue(transactions) - this.getTotalExpenses(transactions)
    );
  }
  getProfitMargin(transactions) {
    const revenue = this.getTotalRevenue(transactions);
    return revenue ? (this.getNetProfit(transactions) / revenue) * 100 : 0;
  }
  getAverageTransactionValue(transactions) {
    const totalAmount = transactions.reduce(
      (sum, t) => sum + Math.abs(t.amount ?? 0),
      0,
    );
    return transactions.length ? totalAmount / transactions.length : 0;
  }
  getMonthlyRecurringRevenue(transactions) {
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(
        (t) =>
          t.amount !== undefined &&
          t.amount < 0 &&
          t.currentDate?.getMonth() === currentMonth,
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  getTopCategory(transactions, type) {
    const categories = transactions
      .filter(
        (t) =>
          t.amount !== undefined &&
          (type === "expense" ? t.amount > 0 : t.amount < 0),
      )
      .reduce((acc, t) => {
        const category = t.personalFinanceCategoryPrimary || "Uncategorized";
        acc[category] = (acc[category] || 0) + Math.abs(t.amount);
        return acc;
      }, {});
    return (
      Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None"
    );
  }
  isCashFlowPositive(transactions) {
    return this.getNetProfit(transactions) > 0;
  }
  getPendingTransactionsCount(transactions) {
    return transactions.filter((t) => t.pending).length;
  }
  getMostFrequentMerchant(transactions) {
    const merchantCounts = transactions.reduce((acc, t) => {
      const merchant = t.merchantName || "Unknown";
      acc[merchant] = (acc[merchant] || 0) + 1;
      return acc;
    }, {});
    return (
      Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "None"
    );
  }
  getAverageTransactionTime(transactions) {
    const times = transactions
      .filter((t) => t.time)
      .map((t) => t.time.getHours() * 60 + t.time.getMinutes());
    const avgMinutes = times.length
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;
    const hours = Math.floor(avgMinutes / 60);
    const minutes = Math.round(avgMinutes % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  getInternationalTransactionsPercentage(transactions) {
    const internationalCount = transactions.filter(
      (t) => t.isoCurrencyCode && t.isoCurrencyCode !== "USD",
    ).length;
    return transactions.length
      ? (internationalCount / transactions.length) * 100
      : 0;
  }
  getOnlineTransactionsPercentage(transactions) {
    const onlineCount = transactions.filter(
      (t) => t.paymentChannel === "online",
    ).length;
    return transactions.length ? (onlineCount / transactions.length) * 100 : 0;
  }
  getLargestSingleTransaction(transactions, type) {
    return Math.max(
      ...transactions
        .filter(
          (t) =>
            t.amount !== undefined &&
            (type === "expense" ? t.amount > 0 : t.amount < 0),
        )
        .map((t) => Math.abs(t.amount)),
      0,
    );
  }
  getTransactionsPerDay(transactions) {
    const days = new Set(transactions.map((t) => t.currentDate?.toDateString()))
      .size;
    return days ? transactions.length / days : 0;
  }
  getUniqueMerchantsCount(transactions) {
    return new Set(transactions.map((t) => t.merchantName)).size;
  }
  getAverageTransactionsByDayOfWeek(transactions) {
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayCounts = dayNames.reduce((acc, day) => {
      acc[day] = 0;
      return acc;
    }, {});
    transactions.forEach((t) => {
      if (t.currentDate) {
        const day = dayNames[t.currentDate.getDay()] || "Sunday";
        dayCounts[day]++;
      }
    });
    const weeks = Math.ceil(transactions.length / 7) || 1;
    return Object.fromEntries(
      dayNames.map((day) => [day, dayCounts[day] / weeks]),
    );
  }
  getCategoriesDistribution(transactions) {
    const categoryCounts = transactions.reduce((acc, t) => {
      const category = t.personalFinanceCategoryPrimary || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
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
  compareAnalytics(period1Start, period1End, period2Start, period2End) {
    const analytics1 = this.getAnalytics(period1Start, period1End);
    const analytics2 = this.getAnalytics(period2Start, period2End);
    const comparison = {};
    for (const key in analytics1) {
      const value1 = analytics1[key];
      const value2 = analytics2[key];
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
exports.default = SmallBusinessAnalytics;
