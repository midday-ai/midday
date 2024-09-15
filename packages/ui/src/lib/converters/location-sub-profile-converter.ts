import { ChartDataPoint } from "../../types/chart";
import { LocationFinancialSubProfile } from "client-typescript-sdk";

type SpendingPeriod =
  | "spentLastWeek"
  | "spentLastTwoWeeks"
  | "spentLastMonth"
  | "spentLastSixMonths"
  | "spentLastYear"
  | "spentLastTwoYears";

export class LocationFinancialMetricsConverter {
  /**
   * Converts an array of LocationFinancialSubProfile to an array of ChartDataPoint for a specific city.
   *
   * @param data - An array of LocationFinancialSubProfile objects to convert.
   * @param city - The city to filter by.
   * @param spendingPeriod - The spending period to use ('spentLastWeek', 'spentLastMonth', etc.).
   * @returns An array of ChartDataPoint objects, sorted by date.
   */
  public static convertToChartDataPoints(
    data: LocationFinancialSubProfile[],
    location: string,
    spendingPeriod: keyof Pick<
      LocationFinancialSubProfile,
      | "spentLastWeek"
      | "spentLastTwoWeeks"
      | "spentLastMonth"
      | "spentLastSixMonths"
      | "spentLastYear"
      | "spentLastTwoYears"
    >,
  ): ChartDataPoint[] {
    console.log(
      "hello",
      data.filter((item) => item.locationCity === location),
    );

    return data
      .filter((item) => item.locationCity === location)
      .map((item) => {
        if (item.month !== undefined && item[spendingPeriod] !== undefined) {
          const year = Math.floor(item.month / 100);
          const month = item.month % 100;
          const date = new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
          return {
            date: date.toISOString().slice(0, 7), // Format as YYYY-MM
            value: item[spendingPeriod] as number,
          };
        }
        return null;
      })
      .filter((item): item is ChartDataPoint => item !== null)
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }

  /**
   * Retrieves a unique set of all cities from the given data.
   *
   * @param data - An array of LocationFinancialSubProfile objects to analyze.
   * @returns An array of unique city names, sorted alphabetically.
   */
  public static getUniqueCities(data: LocationFinancialSubProfile[]): string[] {
    return Array.from(
      new Set(
        data
          .map((item) => item.locationCity)
          .filter(
            (location): location is string =>
              location !== undefined && location.trim() !== "",
          ),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }

  /**
   * Computes statistics (highest, lowest, and average) for a given city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param city - The city to filter by.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An object containing the highest, lowest, and average value information.
   */
  public static computeLocationStatistics(
    data: LocationFinancialSubProfile[],
    location: string,
    spendingPeriod: keyof Pick<
      LocationFinancialSubProfile,
      | "spentLastWeek"
      | "spentLastTwoWeeks"
      | "spentLastMonth"
      | "spentLastSixMonths"
      | "spentLastYear"
      | "spentLastTwoYears"
    >,
  ): {
    highest: { month: string; value: number };
    lowest: { month: string; value: number };
    average: number;
  } {
    const filteredData = data.filter((item) => item.locationCity === location);

    if (filteredData.length === 0) {
      throw new Error(`No data found for location: ${location}`);
    }

    let highest = { month: "", value: -Infinity };
    let lowest = { month: "", value: Infinity };
    let sum = 0;

    filteredData.forEach((item) => {
      if (item.month !== undefined && item[spendingPeriod] !== undefined) {
        const monthStr = this.formatMonth(item.month);
        const value = item[spendingPeriod] as number;
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
   * Calculates the total spending per month across all cities.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An array of objects containing the month and total spending.
   */
  public static calculateMonthlyTotals(
    data: LocationFinancialSubProfile[],
    spendingPeriod: keyof Pick<
      LocationFinancialSubProfile,
      | "spentLastWeek"
      | "spentLastTwoWeeks"
      | "spentLastMonth"
      | "spentLastSixMonths"
      | "spentLastYear"
      | "spentLastTwoYears"
    >,
  ): { month: string; total: number }[] {
    const monthlyTotals: { [key: string]: number } = {};

    data.forEach((item) => {
      if (item.month !== undefined && item[spendingPeriod] !== undefined) {
        const monthStr = this.formatMonth(item.month);
        const value = item[spendingPeriod] as number;

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
   * Computes comprehensive statistics for all cities and spending periods.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @returns An object containing statistics for transaction count and each spending period.
   */
  public static computeComprehensiveStatistics(
    data: LocationFinancialSubProfile[],
  ): {
    transactionCount: {
      [location: string]: { total: number; average: number };
    };
    spendingPeriods: {
      [K in SpendingPeriod]: {
        [location: string]: { total: number; average: number };
      };
    };
  } {
    const locations = this.getUniqueCities(data);
    const result: ReturnType<
      typeof LocationFinancialMetricsConverter.computeComprehensiveStatistics
    > = {
      transactionCount: {},
      spendingPeriods: {
        spentLastWeek: {},
        spentLastTwoWeeks: {},
        spentLastMonth: {},
        spentLastSixMonths: {},
        spentLastYear: {},
        spentLastTwoYears: {},
      },
    };

    locations.forEach((location) => {
      const locationData = data.filter(
        (item) => item.locationCity === location,
      );

      // Transaction Count Statistics
      result.transactionCount[location] = this.computeNumericFieldStats(
        locationData,
        "transactionCount",
      );

      // Spending Period Statistics
      (Object.keys(result.spendingPeriods) as SpendingPeriod[]).forEach(
        (period) => {
          result.spendingPeriods[period][location] =
            this.computeNumericFieldStats(locationData, period);
        },
      );
    });

    return result;
  }

  /**
   * Computes statistics for a numeric field in the given data.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param field - The field to compute statistics for.
   * @returns An object containing the total and average for the field.
   */
  private static computeNumericFieldStats(
    data: LocationFinancialSubProfile[],
    field: keyof LocationFinancialSubProfile,
  ): { total: number; average: number } {
    let total = 0;
    let count = 0;

    data.forEach((item) => {
      const value = item[field];
      if (typeof value === "number") {
        total += value;
        count++;
      } else if (typeof value === "string" && !isNaN(Number(value))) {
        total += Number(value);
        count++;
      }
    });

    return {
      total,
      average: count > 0 ? total / count : 0,
    };
  }

  /**
   * Generates a time series of spending for each city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An object where keys are cities and values are arrays of ChartDataPoint.
   */
  public static generateSpendingTimeSeries(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
  ): { [location: string]: ChartDataPoint[] } {
    const locations = this.getUniqueCities(data);
    const result: { [location: string]: ChartDataPoint[] } = {};

    locations.forEach((location) => {
      result[location] = this.convertToChartDataPoints(
        data,
        location,
        spendingPeriod,
      );
    });

    return result;
  }

  /**
   * Ranks cities based on total spending for a given period.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An array of objects containing city and total spending, sorted in descending order.
   */
  public static rankCitiesBySpending(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
  ): { city: string; totalSpending: number }[] {
    const locations = this.getUniqueCities(data);
    const locationTotals = locations.map((location) => {
      const locationData = data.filter(
        (item) => item.locationCity === location,
      );
      const totalSpending = locationData.reduce(
        (sum, item) => sum + ((item[spendingPeriod] as number) || 0),
        0,
      );
      return { city: location, totalSpending };
    });

    return locationTotals.sort((a, b) => b.totalSpending - a.totalSpending);
  }

  /**
   * Calculates month-over-month growth rate for each city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An object where keys are cities and values are arrays of growth rates.
   */
  public static calculateMonthlyGrowthRate(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
  ): { [location: string]: { month: string; growthRate: number }[] } {
    const locations = this.getUniqueCities(data);
    const result: {
      [location: string]: { month: string; growthRate: number }[];
    } = {};

    locations.forEach((location) => {
      const locationData = data
        .filter((item) => item.locationCity === location)
        .sort((a, b) => (a.month || 0) - (b.month || 0));

      const growthRates = locationData.map((item, index) => {
        if (index === 0)
          return { month: this.formatMonth(item.month || 0), growthRate: 0 };
        const currentSpending = item[spendingPeriod] as number;
        const previousItem = locationData[index - 1];
        const previousSpending = previousItem
          ? (previousItem[spendingPeriod] as number)
          : 0;
        const growthRate =
          previousSpending !== 0
            ? ((currentSpending - previousSpending) / previousSpending) * 100
            : 0;
        return { month: this.formatMonth(item.month || 0), growthRate };
      });

      result[location] = growthRates;
    });

    return result;
  }

  /**
   * Identifies the top performing cities based on recent growth and total spending.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @param topN - Number of top cities to return.
   * @returns An array of top performing cities with their growth rates and total spending.
   */
  public static identifyTopPerformingLocations(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
    topN: number = 5,
  ): { location: string; recentGrowthRate: number; totalSpending: number }[] {
    const growthRates = this.calculateMonthlyGrowthRate(data, spendingPeriod);
    const totalSpending = this.rankCitiesBySpending(data, spendingPeriod);

    const combinedMetrics = Object.keys(growthRates).map((location) => {
      const recentGrowthRate =
        growthRates[location]?.[growthRates[location]?.length - 1]
          ?.growthRate ?? 0;
      const spending =
        totalSpending.find((item) => item.city === location)?.totalSpending ||
        0;
      return { location, recentGrowthRate, totalSpending: spending };
    });

    return combinedMetrics
      .sort(
        (a, b) =>
          b.recentGrowthRate * b.totalSpending -
          a.recentGrowthRate * a.totalSpending,
      )
      .slice(0, topN);
  }

  /**
   * Calculates the customer retention rate for each city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @returns An object where keys are cities and values are retention rates.
   */
  public static calculateCustomerRetentionRate(
    data: LocationFinancialSubProfile[],
  ): { [city: string]: number } {
    const cities = this.getUniqueCities(data);
    const result: { [city: string]: number } = {};

    cities.forEach((city) => {
      const cityData = data
        .filter((item) => item.locationCity === city)
        .sort((a, b) => (a.month || 0) - (b.month || 0));

      if (cityData.length < 2) {
        result[city] = 0;
        return;
      }

      const initialCustomers = parseInt(cityData[0]?.transactionCount || "0");
      const finalCustomers = parseInt(
        cityData[cityData.length - 1]!.transactionCount || "0",
      );
      const retentionRate = (finalCustomers / initialCustomers) * 100;

      result[city] = retentionRate;
    });

    return result;
  }

  /**
   * Calculates the average transaction value for each city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An object where keys are cities and values are average transaction values.
   */
  public static calculateAverageTransactionValue(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
  ): { [city: string]: number } {
    const cities = this.getUniqueCities(data);
    const result: { [city: string]: number } = {};

    cities.forEach((city) => {
      const cityData = data.filter((item) => item.locationCity === city);
      const totalSpending = cityData.reduce(
        (sum, item) => sum + ((item[spendingPeriod] as number) || 0),
        0,
      );
      const totalTransactions = cityData.reduce(
        (sum, item) => sum + parseInt(item.transactionCount || "0"),
        0,
      );

      result[city] =
        totalTransactions > 0 ? totalSpending / totalTransactions : 0;
    });

    return result;
  }

  /**
   * Identifies seasonal trends in spending for each city.
   *
   * @param data - An array of LocationFinancialSubProfile objects.
   * @param spendingPeriod - The spending period to analyze.
   * @returns An object where keys are cities and values are objects representing seasonal trends.
   */
  public static identifySeasonalTrends(
    data: LocationFinancialSubProfile[],
    spendingPeriod: SpendingPeriod,
  ): { [location: string]: { [season: string]: number } } {
    const locations = this.getUniqueCities(data);
    const result: { [location: string]: { [season: string]: number } } = {};

    locations.forEach((location) => {
      const locationData = data.filter(
        (item) => item.locationCity === location,
      );
      const seasonalSpending: { [season: string]: number } = {
        Spring: 0,
        Summer: 0,
        Autumn: 0,
        Winter: 0,
      };

      locationData.forEach((item) => {
        const month = item.month !== undefined ? item.month % 100 : 0;
        const spending =
          typeof item[spendingPeriod] === "number" ? item[spendingPeriod] : 0;

        if (month >= 3 && month <= 5) seasonalSpending.Spring! += spending;
        else if (month >= 6 && month <= 8) seasonalSpending.Summer! += spending;
        else if (month >= 9 && month <= 11)
          seasonalSpending.Autumn! += spending;
        else seasonalSpending.Winter! += spending;
      });

      result[location] = seasonalSpending;
    });

    return result;
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
