import { ChartDataPoint, ScatterChartDataPoint } from "../../types/chart";
import {
  ExpenseMetrics,
  IncomeMetrics,
  Transaction,
} from "client-typescript-sdk";

type FinancialMetrics = IncomeMetrics | ExpenseMetrics;

export class FinancialExpenseAndIncomeMetricsConverter {
  /**
   * Converts an array of ExpenseMetrics or IncomeMetrics to an array of ChartDataPoint for a specific category.
   *
   * @param data - An array of ExpenseMetrics or IncomeMetrics objects to convert.
   * @param category - The personal finance category to filter by.
   * @param type - The type of data ('expense' or 'income').
   * @returns An array of ChartDataPoint objects, sorted by date.
   */
  public static convertToChartDataPoints<
    T extends ExpenseMetrics | IncomeMetrics,
  >(data: T[], category: string, type: "expense" | "income"): ChartDataPoint[] {
    const valueKey = type === "expense" ? "totalExpenses" : "totalIncome";

    return data
      .filter((item) => item.personalFinanceCategoryPrimary === category)
      .map((item) => {
        if (item.month !== undefined && (item as any)[valueKey] !== undefined) {
          const year = Math.floor(item.month / 100);
          const month = item.month % 100;
          const date = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor

          return {
            date: date.toISOString().slice(0, 7), // Format as YYYY-MM
            value: (item as any)[valueKey] as number,
          };
        }
        return null;
      })
      .filter((item): item is ChartDataPoint => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }

  /**
   * Converts an array of ExpenseMetrics or IncomeMetrics to an array of ChartDataPoint.
   *
   * @template T - The type of financial metrics (ExpenseMetrics or IncomeMetrics)
   * @param {T[]} data - An array of ExpenseMetrics or IncomeMetrics objects to convert
   * @param {"expense" | "income"} type - The type of data ('expense' or 'income')
   * @returns {ChartDataPoint[]} An array of ChartDataPoint objects, sorted by date
   *
   * @example
   * const incomeData: IncomeMetrics[] = [...];
   * const chartData = convertToChartDataPoints(incomeData, "income");
   */
  public static convertDataToChartDataPoints<
    T extends ExpenseMetrics | IncomeMetrics,
  >(data: T[], type: "expense" | "income"): ChartDataPoint[] {
    const valueKey = type === "expense" ? "totalExpenses" : "totalIncome";

    return data
      .map((item) => {
        if (item.month !== undefined && (item as any)[valueKey] !== undefined) {
          const year = Math.floor(item.month / 100);
          const month = item.month % 100;
          const date = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor

          return {
            date: date.toISOString().slice(0, 7), // Format as YYYY-MM
            value: (item as any)[valueKey] as number,
          };
        }
        return null;
      })
      .filter((item): item is ChartDataPoint => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }

  /**
   * Retrieves a unique set of all personal finance categories from the given data.
   *
   * @param data - An array of ExpenseMetrics or IncomeMetrics objects to analyze.
   * @returns An array of unique category names, sorted alphabetically.
   */
  public static getUniqueCategories<T extends ExpenseMetrics | IncomeMetrics>(
    data: T[]
  ): string[] {
    return Array.from(
      new Set(
        data
          .map((item) => item.personalFinanceCategoryPrimary)
          .filter((category): category is string => category !== undefined)
      )
    ).sort();
  }

  /**
   * Computes statistics (highest, lowest, and average) for a given category in financial data.
   *
   * @param data - An array of financial data objects (either ExpenseMetrics or IncomeMetrics).
   * @param category - The personal finance category to filter by.
   * @param type - The type of data ('expense' or 'income').
   * @returns An object containing the highest, lowest, and average value information.
   */
  public static computeFinancialStatistics<
    T extends ExpenseMetrics | IncomeMetrics,
  >(
    data: T[],
    category: string,
    type: "expense" | "income"
  ): {
    highest: { month: string; value: number };
    lowest: { month: string; value: number };
    average: number;
  } {
    const filteredData = data.filter(
      (item) => item.personalFinanceCategoryPrimary === category
    );
    const valueKey = type === "expense" ? "totalExpenses" : "totalIncome";

    if (filteredData.length === 0) {
      throw new Error(`No data found for category: ${category}`);
    }

    let highest = { month: "", value: -Infinity };
    let lowest = { month: "", value: Infinity };
    let sum = 0;

    filteredData.forEach((item) => {
      if (item.month !== undefined && (item as any)[valueKey] !== undefined) {
        const monthStr = this.formatMonth(item.month);
        const value = (item as any)[valueKey] as number;
        sum += value;

        if (value > highest.value) {
          highest = { month: monthStr, value };
        }

        if (value < lowest.value) {
          lowest = { month: monthStr, value };
        }
      }
    });

    const average = sum / filteredData.length;

    return { highest, lowest, average };
  }

  /**
   * Calculates the total sum per month across all categories.
   *
   * @param data - An array of financial data objects (either ExpenseMetrics or IncomeMetrics).
   * @param type - The type of data ('expense' or 'income').
   * @returns An array of objects containing the month and total sum.
   */
  public static calculateMonthlyTotals<
    T extends ExpenseMetrics | IncomeMetrics,
  >(data: T[], type: "expense" | "income"): { month: string; total: number }[] {
    const monthlyTotals: { [key: string]: number } = {};
    const valueKey = type === "expense" ? "totalExpenses" : "totalIncome";

    data.forEach((item) => {
      if (item.month !== undefined && (item as any)[valueKey] !== undefined) {
        const monthStr = this.formatMonth(item.month);
        const value = (item as any)[valueKey] as number;

        if (monthlyTotals[monthStr]) {
          monthlyTotals[monthStr] += value;
        } else {
          monthlyTotals[monthStr] = value;
        }
      }
    });

    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculates the total sum for each category across all months.
   *
   * @param data - An array of financial data objects (either ExpenseMetrics or IncomeMetrics).
   * @param type - The type of data ('expense' or 'income').
   * @returns An object where keys are categories and values are the total sum across all months.
   */
  public static calculateCategoryTotals<
    T extends ExpenseMetrics | IncomeMetrics,
  >(data: T[], type: "expense" | "income"): { [category: string]: number } {
    const categoryTotals: { [category: string]: number } = {};
    const valueKey = type === "expense" ? "totalExpenses" : "totalIncome";

    data.forEach((item) => {
      if (
        item.personalFinanceCategoryPrimary &&
        (item as any)[valueKey] !== undefined
      ) {
        const value = (item as any)[valueKey] as number;
        const category = item.personalFinanceCategoryPrimary;

        if (categoryTotals[category]) {
          categoryTotals[category] += value;
        } else {
          categoryTotals[category] = value;
        }
      }
    });

    return categoryTotals;
  }

  /**
   * Computes the total income for each year from the given income metrics.
   * @param data Array of IncomeMetrics
   * @returns An object with years as keys and total income as values
   */
  public static computeTotalIncomeByYear(data: IncomeMetrics[]): {
    [year: number]: number;
  } {
    const yearlyTotals: { [year: number]: number } = {};

    data.forEach((item) => {
      if (item.month && item.totalIncome) {
        const year = Math.floor(item.month / 100);
        yearlyTotals[year] = (yearlyTotals[year] || 0) + item.totalIncome;
      }
    });

    return yearlyTotals;
  }

  /**
   * Computes the total expenses for each year from the given expense metrics.
   * @param data Array of ExpenseMetrics
   * @returns An object with years as keys and total expenses as values
   */
  public static computeTotalExpenseByYear(data: ExpenseMetrics[]): {
    [year: number]: number;
  } {
    const yearlyTotals: { [year: number]: number } = {};

    data.forEach((item) => {
      if (item.month && item.totalExpenses) {
        const year = Math.floor(item.month / 100);
        yearlyTotals[year] = (yearlyTotals[year] || 0) + item.totalExpenses;
      }
    });

    return yearlyTotals;
  }

  /**
   * Computes the average monthly income for each year from the given income metrics.
   * @param data Array of IncomeMetrics
   * @returns An object with years as keys and average monthly income as values
   */
  public static computeAverageMonthlyIncomeByYear(data: IncomeMetrics[]): {
    [year: number]: number;
  } {
    const yearlyTotals = this.computeTotalIncomeByYear(data);
    const monthCounts: { [year: number]: number } = {};

    data.forEach((item) => {
      if (item.month) {
        const year = Math.floor(item.month / 100);
        monthCounts[year] = (monthCounts[year] || 0) + 1;
      }
    });

    const averages: { [year: number]: number } = {};
    for (const year in yearlyTotals) {
      averages[year] =
        (yearlyTotals[year] as number) / (monthCounts[year] || 12); // Use 12 if no month count (full year)
    }

    return averages;
  }

  /**
   * Computes the average monthly expenses for each year from the given expense metrics.
   * @param data Array of ExpenseMetrics
   * @returns An object with years as keys and average monthly expenses as values
   */
  public static computeAverageMonthlyExpenseByYear(data: ExpenseMetrics[]): {
    [year: number]: number;
  } {
    const yearlyTotals = this.computeTotalExpenseByYear(data);
    const monthCounts: { [year: number]: number } = {};

    data.forEach((item) => {
      if (item.month) {
        const year = Math.floor(item.month / 100);
        monthCounts[year] = (monthCounts[year] || 0) + 1;
      }
    });

    const averages: { [year: number]: number } = {};
    for (const year in yearlyTotals) {
      averages[year] =
        (yearlyTotals[year] as number) / (monthCounts[year] || 12); // Use 12 if no month count (full year)
    }

    return averages;
  }

  /**
   * Computes the total income for each month from the given income metrics.
   * @param data Array of IncomeMetrics
   * @returns An array of objects containing month, year, and total income, sorted by date
   */
  public static computeMonthlyIncome(
    data: IncomeMetrics[]
  ): { month: string; year: number; totalIncome: number }[] {
    const monthlyIncome: {
      [key: string]: { year: number; totalIncome: number };
    } = {};

    data.forEach((item) => {
      if (item.month && item.totalIncome) {
        const year = Math.floor(item.month / 100);
        const month = item.month % 100;
        const key = `${year}-${month.toString().padStart(2, "0")}`;

        if (!monthlyIncome[key]) {
          monthlyIncome[key] = { year, totalIncome: 0 };
        }
        monthlyIncome[key].totalIncome += item.totalIncome;
      }
    });

    return Object.entries(monthlyIncome)
      .map(([key, value]) => ({
        month: new Date(
          value.year,
          parseInt(key.split("-")[1] ?? "0") - 1
        ).toLocaleString("default", { month: "long" }),
        year: value.year,
        totalIncome: value.totalIncome,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          new Date(0, new Date(a.month + " 1").getMonth()).getTime() -
          new Date(0, new Date(b.month + " 1").getMonth()).getTime()
        );
      });
  }

  /**
   * Computes the total expenses for each month from the given expense metrics.
   * @param data Array of ExpenseMetrics
   * @returns An array of objects containing month, year, and total expenses, sorted by date
   */
  public static computeMonthlyExpense(
    data: ExpenseMetrics[]
  ): { month: string; year: number; totalExpense: number }[] {
    const monthlyExpense: {
      [key: string]: { year: number; totalExpense: number };
    } = {};
    data.forEach((item) => {
      if (item.month && item.totalExpenses) {
        const year = Math.floor(item.month / 100);
        const month = item.month % 100;
        const key = `${year}-${month.toString().padStart(2, "0")}`;

        if (!monthlyExpense[key]) {
          monthlyExpense[key] = { year, totalExpense: 0 };
        }
        monthlyExpense[key].totalExpense += item.totalExpenses;
      }
    });

    return Object.entries(monthlyExpense)
      .map(([key, value]) => ({
        month: new Date(
          value.year,
          parseInt(key.split("-")[1] ?? "0") - 1
        ).toLocaleString("default", { month: "long" }),
        year: value.year,
        totalExpense: value.totalExpense,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          new Date(0, new Date(a.month + " 1").getMonth()).getTime() -
          new Date(0, new Date(b.month + " 1").getMonth()).getTime()
        );
      });
  }

  /**
   * Computes the amount spent per category from the given expense metrics.
   * @param expenseMetrics Array of ExpenseMetrics
   * @returns An array of objects with category and spent properties, sorted by spent amount in descending order
   */
  public static computeExpenseByCategory(
    expenseMetrics: ExpenseMetrics[]
  ): Array<{ category: string; value: number }> {
    const categoryTotals: Record<string, number> = {};

    expenseMetrics.forEach((metric) => {
      if (metric.personalFinanceCategoryPrimary && metric.totalExpenses) {
        if (!categoryTotals[metric.personalFinanceCategoryPrimary]) {
          categoryTotals[metric.personalFinanceCategoryPrimary] = 0;
        }
        categoryTotals[metric.personalFinanceCategoryPrimary] =
          (categoryTotals[metric.personalFinanceCategoryPrimary] || 0) +
          metric.totalExpenses;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }

  /*
   * Computes income by category
   *
   * @private
   * @static
   * @param {number} month
   * @returns {string}
   *
   * @memberOf FinancialExpenseAndIncomeMetricsConverter
   * */
  public static computeIncomeByCategory(
    incomeMetrics: IncomeMetrics[]
  ): Array<{ category: string; value: number }> {
    const categoryTotals: Record<string, number> = {};

    incomeMetrics.forEach((metric) => {
      if (metric.personalFinanceCategoryPrimary && metric.totalIncome) {
        if (!categoryTotals[metric.personalFinanceCategoryPrimary]) {
          categoryTotals[metric.personalFinanceCategoryPrimary] = 0;
        }
        categoryTotals[metric.personalFinanceCategoryPrimary] =
          (categoryTotals[metric.personalFinanceCategoryPrimary] || 0) +
          metric.totalIncome;
      }
    });

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Formats a month number (YYYYMM) to a string (YYYY-MM).
   *
   * @param month - The month number in YYYYMM format.
   * @returns A string in YYYY-MM format.
   *
   * @private
   */
  private static formatMonth(month: number): string {
    const year = Math.floor(month / 100);
    const monthNum = month % 100;
    return `${year}-${monthNum.toString().padStart(2, "0")}`;
  }
}

export class FinancialMetricsScatterPlotConverter {
  /**
   * Converts FinancialMetrics data to scatter chart data points for transaction count vs month.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of ScatterChartDataPoint
   */
  public static txnCountVsMonth(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    return data
      .map((item) => {
        const monthValue = item.month || 0;
        const year = Math.floor(monthValue / 100);
        const month = monthValue % 100;
        const date = new Date(year, month - 1); // month is 0-indexed in Date constructor

        return {
          x: date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          y: parseInt(item.transactionCount || "0", 10),
          category: item.personalFinanceCategoryPrimary,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.x);
        const dateB = new Date(b.x);
        return dateA.getTime() - dateB.getTime();
      });
  }

  public static txnCountVsMonthChartDataPoint(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ChartDataPoint[] {
    return data
      .map((item) => {
        const monthValue = item.month || 0;
        const year = Math.floor(monthValue / 100);
        const month = monthValue % 100;
        const date = new Date(year, month - 1); // month is 0-indexed in Date constructor

        return {
          date: date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          value: parseInt(item.transactionCount || "0", 10),
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  /**
   * Converts FinancialMetrics data to scatter chart data points for transaction count vs total amount.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of ScatterChartDataPoint
   */
  public static txnCountVsTotalAmount(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    const amountKey = type === "income" ? "totalIncome" : "totalExpenses";
    return data
      .map((item) => ({
        x: (item as any)[amountKey] || 0,
        y: parseInt(item.transactionCount || "0", 10),
        category: item.personalFinanceCategoryPrimary,
      }))
      .sort((a, b) => (a.x as number) - (b.x as number));
  }

  /**
   * Converts FinancialMetrics data to scatter chart data points for total amount vs month.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of ScatterChartDataPoint
   */
  public static totalAmountVsMonth(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    const amountKey = type === "income" ? "totalIncome" : "totalExpenses";
    return data
      .map((item) => {
        const monthValue = item.month || 0;
        const year = Math.floor(monthValue / 100);
        const month = monthValue % 100;
        const date = new Date(year, month - 1); // month is 0-indexed in Date constructor

        return {
          x: date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          y: (item as any)[amountKey] || 0,
          category: item.personalFinanceCategoryPrimary,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.x);
        const dateB = new Date(b.x);
        return dateA.getTime() - dateB.getTime();
      });
  }

  public static totalAmountVsMonthChartDataPoint(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ChartDataPoint[] {
    const amountKey = type === "income" ? "totalIncome" : "totalExpenses";
    return data
      .map((item) => {
        const monthValue = item.month || 0;
        const year = Math.floor(monthValue / 100);
        const month = monthValue % 100;
        const date = new Date(year, month - 1); // month is 0-indexed in Date constructor

        return {
          date: date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          value: (item as any)[amountKey] || 0,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }

  /**
   * Converts FinancialMetrics data to scatter chart data points for total amount vs category.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of ScatterChartDataPoint
   */
  public static totalAmountVsCategory(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    const amountKey = type === "income" ? "totalIncome" : "totalExpenses";
    return data.map((item) => ({
      x: item.personalFinanceCategoryPrimary || "Unknown",
      y: (item as any)[amountKey] || 0,
      category: item.personalFinanceCategoryPrimary,
    }));
  }

  /**
   * Converts FinancialMetrics data to scatter chart data points for transaction count vs category.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of ScatterChartDataPoint
   */
  public static txnCountVsCategory(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    return data.map((item) => ({
      x: item.personalFinanceCategoryPrimary || "Unknown",
      y: parseInt(item.transactionCount || "0", 10),
      category: item.personalFinanceCategoryPrimary,
    }));
  }

  /**
   * Aggregates data by category for category-based scatter plots.
   * @param data Array of ScatterChartDataPoint
   * @returns Array of aggregated ScatterChartDataPoint
   */
  private static aggregateByCategory(
    data: ScatterChartDataPoint[]
  ): ScatterChartDataPoint[] {
    const aggregatedData: { [key: string]: { total: number; count: number } } =
      {};

    data.forEach((item) => {
      if (!aggregatedData[item.x as string]) {
        aggregatedData[item.x as string] = { total: 0, count: 0 };
      }
      const categoryData = aggregatedData[item.x as string];
      if (categoryData) {
        categoryData.total += item.y;
        categoryData.count += 1;
      }
    });

    return Object.entries(aggregatedData).map(
      ([category, { total, count }]) => ({
        x: category,
        y: total / count, // average
        category: category,
      })
    );
  }

  /**
   * Converts FinancialMetrics data to aggregated scatter chart data points for total amount vs category.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of aggregated ScatterChartDataPoint
   */
  public static aggregatedTotalAmountVsCategory(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    const scatterData = this.totalAmountVsCategory(data, type);
    return this.aggregateByCategory(scatterData);
  }

  /**
   * Converts FinancialMetrics data to aggregated scatter chart data points for transaction count vs category.
   * @param data Array of FinancialMetrics
   * @param type 'income' or 'expense'
   * @returns Array of aggregated ScatterChartDataPoint
   */
  public static aggregatedTxnCountVsCategory(
    data: FinancialMetrics[],
    type: "income" | "expense"
  ): ScatterChartDataPoint[] {
    const scatterData = this.txnCountVsCategory(data, type);
    return this.aggregateByCategory(scatterData);
  }
}

export class FinancialMetricsTransactionConverter {
  /**
   * Breaks down transactions by month.
   * @param transactions Array of Transaction
   * @returns Object with month as key and array of transactions as value
   */
  public static breakTransactionsByMonth(transactions: Transaction[]): {
    [key: string]: Transaction[];
  } {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const groupedTransactions = transactions.reduce<{
      [key: string]: Transaction[];
    }>((acc, transaction) => {
      if (transaction.currentDate) {
        const date = new Date(transaction.currentDate);
        const monthName = monthNames[date.getMonth()];
        const year = date.getFullYear();
        const key = `${monthName} ${year}`;

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(transaction);
      }
      return acc;
    }, {});

    // Sort the keys (month-year combinations) in descending order
    const sortedKeys = Object.keys(groupedTransactions).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });

    // Create a new object with sorted keys
    const sortedGroupedTransactions: { [key: string]: Transaction[] } = {};
    sortedKeys.forEach((key) => {
      if (groupedTransactions[key]) {
        sortedGroupedTransactions[key] = groupedTransactions[key];
      }
    });

    return sortedGroupedTransactions;
  }
}
