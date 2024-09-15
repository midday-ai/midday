import {
  ApplicationTheme,
  BankAccountStatus,
  BankAccountType,
  FinancialUserProfileType,
  NotificationType,
  ProfileType,
  RiskToleranceSettings,
  type AccountBalanceHistory,
  type Address,
  type Apr,
  type BankAccount,
  type Budget,
  type Category1,
  type CategoryMetricsFinancialSubProfile,
  type CategoryMonthlyExpenditure,
  type CategoryMonthlyIncome,
  type CategoryMonthlyTransactionCount,
  type CreditAccount,
  type DebtToIncomeRatio,
  type ExpenseMetrics,
  type ExpenseMetricsFinancialSubProfileMetrics,
  type FinancialUserProfile,
  type Forecast,
  type IncomeExpenseRatio,
  type IncomeMetrics,
  type IncomeMetricsFinancialSubProfile,
  type InvesmentHolding,
  type InvestmentAccount,
  type InvestmentSecurity,
  type Link,
  type LocationFinancialSubProfile,
  type MelodyFinancialContext,
  type MerchantMetricsFinancialSubProfile,
  type MerchantMonthlyExpenditure,
  type Milestone,
  type MonthlyBalance,
  type MonthlyExpenditure,
  type MonthlyIncome,
  type MonthlySavings,
  type MonthlyTransactionCount,
  type PaymentChannelMetricsFinancialSubProfile,
  type PaymentChannelMonthlyExpenditure,
  type PlaidAccountRecurringTransaction,
  type PlaidAccountTransaction,
  type Pocket,
  type Settings,
  type SmartGoal,
  type SmartNote,
  type StudentLoanAccount,
  type Tags,
  type Transaction,
  type TransactionAggregatesByMonth,
  type TransactionSplit,
  type UserAccount,
} from "client-typescript-sdk";

const countries = ["US", "GB", "FR", "JP"];

export class FinancialDataGenerator {
  static generateTransactionAggregatesArray = (
    numEntries: number,
    category?: string,
    paymentChannel?: string,
  ): TransactionAggregatesByMonth[] => {
    const categories = [
      "Groceries",
      "Dining",
      "Transport",
      "Entertainment",
      "Utilities",
    ];
    const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"];
    const channels = ["Online", "In-Store", "Mobile"];
    const merchants = ["Amazon", "Walmart", "Starbucks", "McDonalds", "Apple"];
    const profileTypes = Object.values(FinancialUserProfileType);

    const transactions: TransactionAggregatesByMonth[] = [];

    for (let i = 0; i < numEntries; i++) {
      const month = 2024 * 100 + Math.floor(Math.random() * 12) + 1;
      const transactionCount = Math.floor(Math.random() * 100).toString();
      const totalAmount = Math.random() * 1000;

      const currentCategory = category
        ? category
        : categories[Math.floor(Math.random() * categories.length)];
      const currentPaymentChannel = paymentChannel
        ? paymentChannel
        : channels[Math.floor(Math.random() * channels.length)];

      transactions.push({
        month: month,
        personalFinanceCategoryPrimary: currentCategory,
        locationCity: cities[Math.floor(Math.random() * cities.length)],
        paymentChannel: currentPaymentChannel,
        merchantName: merchants[Math.floor(Math.random() * merchants.length)],
        transactionCount: transactionCount,
        totalAmount: totalAmount,
        userId: `user${i + 1}`,
        profileType:
          profileTypes[Math.floor(Math.random() * profileTypes.length)],
      });
    }

    return transactions;
  };

  /**
   * Returns a random transaction category from a predefined list of categories.
   *
   * @returns {string} A randomly selected transaction category.
   */
  static getRandomTransactionCategory(): string {
    const categories = [
      "Groceries",
      "Utilities",
      "Rent",
      "Entertainment",
      "Transportation",
      "Eating Out",
      "Shopping",
      "Healthcare",
      "Insurance",
      "Education",
      "Travel",
      "Personal Care",
      "Gifts",
      "Investments",
      "Savings",
      "Loans",
      "Taxes",
      "Charity",
      "Childcare",
      "Miscellaneous",
    ];

    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex]!;
  }

  /**
   * Generates a random integer within the provided range.
   *
   * @param min - The lower bound of the range.
   * @param max - The upper bound of the range.
   * @returns A random integer within the provided range.
   */
  static randomIntFromInterval = (min: number, max: number) => {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  /**
   * Generates a random number within the specified range.
   *
   * @param {number} min - The minimum value of the range (inclusive).
   * @param {number} max - The maximum value of the range (inclusive).
   * @returns {number} - The randomly generated number within the specified range.
   */
  static getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Generates a random string of the specified length using uppercase letters,
   * lowercase letters, and numbers.
   *
   * @param {number} length - The length of the random string to generate.
   * @returns {string} The randomly generated string.
   */
  static getRandomString(length: number): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  /**
   * Returns a random item from the given array.
   *
   * @param {T[]} arr - The array from which to select a random item.
   * @returns {T} The randomly selected item from the array.
   */
  static getRandomArrayItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)] as T;
  }

  /**
   * Generates a random date between the given start and end dates.
   *
   * @param {Date} start - The start date of the range.
   * @param {Date} end - The end date of the range.
   * @returns {string} The randomly generated date in ISO string format
   *   (YYYY-MM-DD).
   */
  static getRandomDate(start: Date, end: Date): string {
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
    return randomDate.toISOString().split("T")[0]!;
  }

  /**
   * Generates a random date object between the given start and end dates.
   *
   * @param {Date} start - The start date of the range.
   * @param {Date} end - The end date of the range.
   * @returns {Date} The randomly generated date object.
   */
  static getRandomDateObject(start: Date, end: Date): Date {
    const randomDate = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );

    return randomDate;
  }

  /**
   * Generates a random boolean value.
   *
   * @returns {boolean} A randomly generated boolean value.
   */
  static getRandomBoolean(): boolean {
    return Math.random() > 0.5;
  }

  /**
   * Generates an array of random subcategories.
   *
   * @returns {string[]} An array of random subcategories.
   */
  static getRandomSubcategories(): string[] {
    const count = FinancialDataGenerator.getRandomNumber(1, 5); // for instance, each category can have 1 to 5 subcategories
    const subcategories: string[] = [];
    for (let i = 0; i < count; i++) {
      subcategories.push(FinancialDataGenerator.getRandomString(5));
    }
    return subcategories;
  }

  /**
   * Generates a random amount up to 10000 with 2 decimal places.
   *
   * @returns {string} The randomly generated amount as a string.
   */
  static getRandomAmount(): string {
    return (Math.random() * 10000).toFixed(2);
  }

  /**
   * Generates a random balance value between 0 and 10000 with two decimal places.
   *
   * @returns {number} A randomly generated balance value.
   */
  static getRandomBalance(): number {
    return +(Math.random() * 10000).toFixed(2);
  }

  /**
   * Generates a random string of the specified length with an optional prefix.
   *
   * @param {number} length - The length of the random string.
   * @param {string} [prefix=''] - The optional prefix to be added to the random
   *   string. Default is `''`
   * @returns {string} - The randomly generated string with the prefix.
   */
  static getRandomStringWithPrefix(length: number, prefix = ""): string {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return prefix + result;
  }

  /**
   * Generates random settings for a user profile.
   *
   * @returns {Settings} The randomly generated user settings.
   */
  static generateRandomSettings(): Settings {
    return {
      id: FinancialDataGenerator.getRandomString(10),
      appTheme: ApplicationTheme.Dark,
      notificationSettings: {
        id: FinancialDataGenerator.getRandomString(10),
        notificationType: NotificationType.Email,
        alerts: FinancialDataGenerator.getRandomBoolean(),
      },
      preferredLanguage: FinancialDataGenerator.getRandomString(10),
      riskTolerance: RiskToleranceSettings.Low,
      likedDashboardPanels: [
        "LIKED_DASHBOARD_PANELS_TRANSACTIONS_OVERVIEW",
        "LIKED_DASHBOARD_PANELS_CREDIT_SCORE_MONITOR",
      ],
      digitalWorkerSettings: {
        id: FinancialDataGenerator.getRandomString(10),
        workerName: FinancialDataGenerator.getRandomString(10),
        workerVersion: FinancialDataGenerator.getRandomString(10),
        enableLogging: FinancialDataGenerator.getRandomBoolean(),
      },
      financialPreferences: {
        id: FinancialDataGenerator.getRandomString(10),
        currencyPreference: FinancialDataGenerator.getRandomString(10),
        financialYearStart: FinancialDataGenerator.getRandomString(10),
        taxPercentage: FinancialDataGenerator.getRandomNumber(0, 100),
        taxCode: FinancialDataGenerator.getRandomString(10),
      },
    };
  }

  /**
   * Generates a random address with random values for address, city, state,
   * zipcode, unit, latitude, and longitude.
   *
   * @returns {Address} The generated random address object.
   */
  static generateRandomAddress(): Address {
    return {
      address: FinancialDataGenerator.getRandomString(10),
      city: FinancialDataGenerator.getRandomString(10),
      state: FinancialDataGenerator.getRandomString(10),
      zipcode: FinancialDataGenerator.getRandomString(10),
      unit: FinancialDataGenerator.getRandomString(10),
      lattitude: FinancialDataGenerator.getRandomString(10),
      longitude: FinancialDataGenerator.getRandomString(10),
    };
  }

  /**
   * Generates an array of random tags.
   *
   * @returns {Tags[]} An array of random tags, each containing an id, tagName,
   *   tagDescription, and metadata.
   */
  static generateRandomTags(): Tags[] {
    const tags: Tags[] = [];
    for (let i = 0; i < 5; i++) {
      tags.push({
        id: FinancialDataGenerator.getRandomString(10),
        tagName: FinancialDataGenerator.getRandomString(10),
        tagDescription: FinancialDataGenerator.getRandomString(10),
        metadata: [
          FinancialDataGenerator.getRandomString(10),
          FinancialDataGenerator.getRandomString(10),
        ],
      });
    }
    return tags;
  }

  /**
   * Generates a random financial user profile object with random values for id,
   * userId, stripeCustomerId, stripeSubscriptions, email, profileType, and link.
   *
   * @returns {FinancialUserProfile} The generated random financial user profile
   *   object.
   */
  static generateFinancialProfile(): FinancialUserProfile {
    return {
      id: FinancialDataGenerator.getRandomString(10),
      userId: FinancialDataGenerator.getRandomString(10),
      stripeCustomerId: FinancialDataGenerator.getRandomString(10),
      stripeSubscriptions: {},
      email: FinancialDataGenerator.getRandomString(10),
      profileType: FinancialUserProfileType.User,
      link: FinancialDataGenerator.generateRandomLinks(3),
    };
  }

  /**
   * Generates a random financial context object with empty arrays for categories,
   * expenses, income, locations, merchants, paymentChannels, and
   * mortgageLoanAccounts. It also generates random investment, bank, credit, and
   * student loan accounts.
   *
   * @returns {MelodyFinancialContext} The generated random financial context
   *   object.
   */
  static generateFinancialContext(): MelodyFinancialContext {
    return {
      categories: [],
      expenses: [],
      income: [],
      locations: [],
      merchants: [],
      paymentChannels: [],
      investmentAccounts:
        FinancialDataGenerator.generateRandomInvestmentAccounts(2),
      bankAccounts: FinancialDataGenerator.generateRandomBankAccounts(1),
      creditAccounts: FinancialDataGenerator.generateRandomCreditAccounts(2),
      mortgageLoanAccounts: [],
      studentLoanAccounts:
        FinancialDataGenerator.generateRandomStudentLoanAccounts(5),
      financialUserProfileType: FinancialUserProfileType.User,
    };
  }

  /**
   * Generates a random user account object with random values for all properties.
   *
   * @returns {UserAccount} The generated random user account object.
   */
  static generateRandomUserAccount(): UserAccount {
    return {
      accountType: ProfileType.User,
      address: FinancialDataGenerator.generateRandomAddress(),
      authnAccountId: FinancialDataGenerator.getRandomString(10),
      bio: FinancialDataGenerator.getRandomString(10),
      createdAt: FinancialDataGenerator.getRandomDateObject(
        new Date(2020, 0, 1),
        new Date(),
      ),
      email: FinancialDataGenerator.getRandomString(10),
      firstname: FinancialDataGenerator.getRandomString(10),
      headline: FinancialDataGenerator.getRandomString(10),
      id: FinancialDataGenerator.getRandomString(10),
      isActive: true,
      isEmailVerified: true,
      isPrivate: true,
      lastname: FinancialDataGenerator.getRandomString(10),
      phoneNumber: FinancialDataGenerator.getRandomString(10),
      tags: FinancialDataGenerator.generateRandomTags(),
      username: FinancialDataGenerator.getRandomString(10),
      verifiedAt: FinancialDataGenerator.getRandomDateObject(
        new Date(2020, 0, 1),
        new Date(),
      ),
      settings: FinancialDataGenerator.generateRandomSettings(),
      supabaseAuth0UserId: FinancialDataGenerator.getRandomString(10),
      profileImageUrl: "https://github.com/shadcn.png",
      algoliaUserId: FinancialDataGenerator.getRandomString(10),
    };
  }

  /**
   * Generates a random account balance history object with random values for all
   * properties.
   *
   * @returns {AccountBalanceHistory} The generated random account balance history
   *   object.
   */
  static generateAccountBalanceHistory(): AccountBalanceHistory {
    return {
      id: FinancialDataGenerator.getRandomStringWithPrefix(5, "BAL-"),
      time: FinancialDataGenerator.getRandomDateInRange(2021, 2023),
      accountId: FinancialDataGenerator.getRandomStringWithPrefix(5, "ACC-"),
      isoCurrencyCode: ["USD", "EUR", "GBP", "JPY", "AUD"][
        FinancialDataGenerator.getRandomNumber(0, 4)
      ],
      balance: FinancialDataGenerator.getRandomBalance(),
      userId: FinancialDataGenerator.getRandomString(10),
      sign: [1, -1][FinancialDataGenerator.getRandomNumber(0, 1)],
    };
  }

  /**
   * Generates a list of random account balance history objects with random values
   * for all properties.
   *
   * @param {number} count - The number of account balance history objects to
   *   generate.
   * @returns {AccountBalanceHistory[]} The generated list of random account
   *   balance history objects.
   */
  static generateRandomAccountBalanceHistoryList(
    count: number,
  ): AccountBalanceHistory[] {
    const accountBalanceHistoryList: AccountBalanceHistory[] = [];
    for (let i = 0; i < count; i++) {
      accountBalanceHistoryList.push(
        FinancialDataGenerator.generateAccountBalanceHistory(),
      );
    }
    return accountBalanceHistoryList;
  }

  /**
   * Generates a random APR object with random values for id, percentage, type,
   * balanceSubjectToApr, and interestChargeAmount.
   *
   * @returns {Apr} The generated random APR object.
   */
  static generateAPR(): Apr {
    return {
      id: Math.floor(Math.random() * 100).toString(),
      percentage: Math.floor(Math.random() * 100),
      type: "random type",
      balanceSubjectToApr: Math.floor(Math.random() * 100),
      interestChargeAmount: Math.floor(Math.random() * 100),
    };
  }

  /**
   * Generates a random Category1 object with random values for all properties.
   *
   * @returns {Category1} The generated Category1 object.
   */
  static generateCategory(): Category1 {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      subcategories: FinancialDataGenerator.getRandomSubcategories(),
    };
  }

  /**
   * Generates a random Budget object with random values for all properties.
   *
   * @returns {Budget} The generated Budget object.
   */
  static generateBudget(): Budget {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      startDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      endDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      category: FinancialDataGenerator.generateCategory(),
    };
  }

  /**
   * Generates a random Milestone object with random values for all properties.
   *
   * @returns {Milestone} The generated Milestone object.
   */
  static generateMilestone(): Milestone {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      targetDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      targetAmount: `$${FinancialDataGenerator.getRandomNumber(100, 1000)}`,
      isCompleted: FinancialDataGenerator.getRandomBoolean(),
      budget:
        Math.random() > 0.5
          ? FinancialDataGenerator.generateBudget()
          : undefined,
    };
  }

  /**
   * Generates a random Forecast object with random values for all properties.
   *
   * @returns {Forecast} The generated Forecast object.
   */
  static generateForecast(): Forecast {
    return {
      forecastedAmount: FinancialDataGenerator.getRandomAmount(),
      forecastedCompletionDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      varianceAmount: FinancialDataGenerator.getRandomAmount(),
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
    };
  }

  /*
   * Generates a random SmartGoal object with random values for all properties.
   *
   * @export
   * @returns {SmartGoal}
   * */
  static generateSmartGoal(): SmartGoal {
    const numberOfMilestones = FinancialDataGenerator.getRandomNumber(5, 10); // Assuming a random number of milestones between 0 to 5 for each goal
    const milestones = Array.from({ length: numberOfMilestones }, () =>
      FinancialDataGenerator.generateMilestone(),
    );

    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      userId: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      isCompleted: FinancialDataGenerator.getRandomBoolean(),
      goalType: "GOAL_TYPE_INVESTMENT",
      duration: `${FinancialDataGenerator.getRandomNumber(1, 5)} weeks`,
      startDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      endDate: FinancialDataGenerator.getRandomDate(
        new Date(2022, 0, 1),
        new Date(2030, 0, 1),
      ),
      targetAmount: `$${FinancialDataGenerator.getRandomNumber(500, 10000)}`,
      currentAmount: `$${FinancialDataGenerator.getRandomNumber(0, 5000)}`,
      milestones: milestones,
      forecasts: FinancialDataGenerator.generateForecast(),
    };
  }

  /*
   * Generates a random Pocket object with random values for all properties.
   *
   * @export
   * @returns {Pocket}
   * */
  static generatePocket(): Pocket {
    const numberOfGoals = FinancialDataGenerator.getRandomNumber(0, 5); // Assuming a random number of goals between 0 to 5 for each pocket
    const goals = Array.from({ length: numberOfGoals }, () =>
      FinancialDataGenerator.generateSmartGoal(),
    );

    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      goals: goals,
      type: "POCKET_TYPE_LONG_TERM_SAVINGS",
    };
  }

  /*
   * Generates a random BankAccount object with random values for all properties.
   *
   * @export
   * @returns {BankAccount}
   * */
  static generateRandomBankAccount(): BankAccount {
    const numberOfPocketsToGenerate = FinancialDataGenerator.getRandomNumber(
      0,
      5,
    ); // Assuming a random number of goals between 0 to 5 for each pocket
    const pockets = Array.from({ length: numberOfPocketsToGenerate }, () =>
      FinancialDataGenerator.generatePocket(),
    );

    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      userId: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: `Account ${FinancialDataGenerator.getRandomString(5)}`,
      number: `xxxx-xxxx-xxxx-${FinancialDataGenerator.getRandomString(4)}`, // A sample account number format
      type: BankAccountType.Plaid,
      balance: FinancialDataGenerator.getRandomNumber(1000, 10000),
      currency: FinancialDataGenerator.getRandomArrayItem([
        "USD",
        "EUR",
        "GBP",
        "JPY",
      ]),
      currentFunds: FinancialDataGenerator.getRandomNumber(500, 5000),
      balanceLimit: FinancialDataGenerator.getRandomNumber(0, 1000).toString(),
      pockets: pockets,
      plaidAccountId: FinancialDataGenerator.getRandomString(10),
      subtype: `Subtype ${FinancialDataGenerator.getRandomString(3)}`,
      status: BankAccountStatus.Active,
      transactions: [],
      recurringTransactions: [],
    };
  }

  /**
   * Generates an array of BankAccount objects with random values for all
   * properties.
   *
   * @param {number} count
   * @returns {BankAccount[]}
   */
  static generateRandomBankAccounts = (count: number): BankAccount[] => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomBankAccount,
    );
  };

  // Helper function to generate a random date within the last year
  static getTrulyRandomDate = () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date();
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime()),
    );
  };

  static getTrulyRandomString = () =>
    Math.random().toString(36).substring(2, 15);

  // Mock data for currencies and countries for more realistic mock data
  static getRandomFromArray = (arr: any[]): any =>
    arr[Math.floor(Math.random() * arr.length)];

  static getRandomCountry = () =>
    FinancialDataGenerator.getRandomFromArray(countries);

  // Example helper function to generate a random Transaction object
  static generateRandomTransaction = (): Transaction => ({
    accountId: FinancialDataGenerator.getRandomString(10),
    amount: FinancialDataGenerator.getRandomNumber(1, 10000),
    isoCurrencyCode: "USD",
    currentDate: FinancialDataGenerator.getTrulyRandomDate().toISOString(),
    name: FinancialDataGenerator.getRandomString(10),
    merchantName: FinancialDataGenerator.generateMerchant(),
    paymentChannel: FinancialDataGenerator.generatePaymentChannels(),
    pending: FinancialDataGenerator.getRandomBoolean(),
    transactionId: FinancialDataGenerator.getTrulyRandomString(),
    time: FinancialDataGenerator.getTrulyRandomDate(),
    unofficialCurrencyCode: FinancialDataGenerator.getTrulyRandomString(),
    categoryId: FinancialDataGenerator.getTrulyRandomString(),
    checkNumber: FinancialDataGenerator.getTrulyRandomString(),
    currentDatetime: new Date().toISOString(),
    authorizedDate: new Date().toISOString(),
    authorizedDatetime: new Date().toISOString(),
    pendingTransactionId: FinancialDataGenerator.getTrulyRandomString(),
    accountOwner: FinancialDataGenerator.getTrulyRandomString(),
    transactionCode: FinancialDataGenerator.getTrulyRandomString(),
    id: FinancialDataGenerator.getTrulyRandomString(),
    userId: FinancialDataGenerator.getTrulyRandomString(),
    linkId: FinancialDataGenerator.getTrulyRandomString(),
    sign: FinancialDataGenerator.getRandomNumber(-1, 1),
    personalFinanceCategoryPrimary:
      FinancialDataGenerator.generatePrimaryCategory(),
    personalFinanceCategoryDetailed:
      FinancialDataGenerator.generatePrimaryCategory(),
    locationAddress: FinancialDataGenerator.getTrulyRandomString(),
    locationCity: FinancialDataGenerator.generateLocationCity(),
    locationRegion: FinancialDataGenerator.getTrulyRandomString(),
    locationPostalCode: FinancialDataGenerator.getTrulyRandomString(),
    locationCountry: FinancialDataGenerator.getRandomCountry(),
    locationLat: parseFloat((Math.random() * 180 - 90).toFixed(6)),
    locationLon: parseFloat((Math.random() * 360 - 180).toFixed(6)),
    locationStoreNumber: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaByOrderOf: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaPayee: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaPayer: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaPaymentMethod: "credit card",
    paymentMetaPaymentProcessor: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaPpdId: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaReason: FinancialDataGenerator.getTrulyRandomString(),
    paymentMetaReferenceNumber: FinancialDataGenerator.getTrulyRandomString(),
    additionalProperties: { someKey: "someValue" }, // Example of an Any1 object
    categories: [
      FinancialDataGenerator.getTrulyRandomString(),
      FinancialDataGenerator.getTrulyRandomString(),
    ],
    profileType: FinancialDataGenerator.getRandomBoolean()
      ? FinancialUserProfileType.User
      : FinancialUserProfileType.Business, // Example if FinancialUserProfileType is an enum or union type
  });

  /**
   * Generates a random TransactionSplit object.
   *
   * @returns {{
   *   linkId: string;
   *   description: string;
   *   amount: number;
   *   categories: {};
   *   personalFinanceCategoryPrimary: string;
   *   personalFinanceCategoryDetailed: string;
   *   tags: {};
   *   authorizedDate: any;
   *   authorizedDatetime: any;
   *   timeOfSplit: any;
   * }}
   */
  static generateRandomTransactionSplit: () => TransactionSplit = () => {
    return {
      linkId: FinancialDataGenerator.getRandomString(10),
      description: FinancialDataGenerator.getRandomString(40),
      amount: FinancialDataGenerator.getRandomNumber(1, 10000),
      categories: [
        FinancialDataGenerator.getRandomString(10),
        FinancialDataGenerator.getRandomString(10),
      ],
      personalFinanceCategoryPrimary:
        FinancialDataGenerator.getRandomString(10),
      personalFinanceCategoryDetailed:
        FinancialDataGenerator.getRandomString(10),
      tags: [
        FinancialDataGenerator.getRandomString(10),
        FinancialDataGenerator.getRandomString(10),
      ],
      authorizedDate: FinancialDataGenerator.getTrulyRandomDate(),
      authorizedDatetime: FinancialDataGenerator.getTrulyRandomDate(),
      timeOfSplit: FinancialDataGenerator.getTrulyRandomDate(),
    };
  };

  /**
   * Generates an array of random TransactionSplit objects.
   *
   * @param {number} count
   * @returns {TransactionSplit[]}
   */
  static generateRandomTransactionSplits = (
    count: number,
  ): TransactionSplit[] => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomTransactionSplit,
    );
  };

  /**
   * Generates an array of random categories.
   *
   * @param {number} count
   * @returns {string[]}
   */
  static generateRandomCategories = (count: number): string[] => {
    const categories: string[] = [
      "Groceries",
      "Utilities",
      "Rent",
      "Entertainment",
      "Transportation",
      "Eating Out",
      "Shopping",
      "Healthcare",
      "Insurance",
      "Education",
    ];

    return Array.from({ length: count }, () =>
      FinancialDataGenerator.getRandomFromArray(categories),
    );
  };

  // Function to generate an array of random Transaction objects
  static generateRandomTransactions = (count: number): Transaction[] => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomTransaction,
    );
  };

  /**
   * Generates a random primary category.
   *
   * @returns {string}
   */
  static generatePrimaryCategory = (): string => {
    const categories = [
      "dining",
      "transportation",
      "entertainment",
      "rent",
      "fun",
      "bills",
      "groceries",
      "health",
      "travel",
      "shopping",
      "education",
    ];

    // randomly select a category
    // Randomly select a category
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex]!;
  };

  /**
   * Generates a random payment channel.
   *
   * @returns {string}
   */
  static generatePaymentChannels = (): string => {
    const paymentChannels = ["online", "in-store", "mobile", "web", "phone"];

    // randomly select a category
    // Randomly select a category
    const randomIndex = Math.floor(Math.random() * paymentChannels.length);
    return paymentChannels[randomIndex]!;
  };

  /**
   * Generates a random merchant from a predefined list.
   *
   * @returns {string} The randomly selected merchant.
   */
  static generateMerchant = (): string => {
    const merchants = [
      "Amazon",
      "Walmart",
      "Starbucks",
      "McDonald's",
      "Apple",
      "Target",
      "Uber",
      "Home Depot",
      "Airbnb",
      "Subway",
      "Nike",
      "Adidas",
      "Costco",
      "Best Buy",
      "Netflix",
      "Spotify",
      "Taco Bell",
      "KFC",
      "Dell",
      "Samsung",
    ];

    // Randomly select a merchant
    const randomIndex = Math.floor(Math.random() * merchants.length);
    return merchants[randomIndex]!;
  };

  /**
   * Generates a random city from a predefined list of cities.
   *
   * @returns {string} The randomly selected city.
   */
  static generateLocationCity = (): string => {
    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "Fort Worth",
      "Columbus",
      "San Francisco",
      "Charlotte",
      "Indianapolis",
      "Seattle",
      "Denver",
      "Washington",
      "Boston",
      "El Paso",
      "Nashville",
      "Detroit",
      "Memphis",
      "Portland",
      "Oklahoma City",
      "Las Vegas",
      "Louisville",
      "Baltimore",
      "Milwaukee",
      "Albuquerque",
      "Tucson",
      "Fresno",
      "Mesa",
      "Sacramento",
      "Long Beach",
      "Kansas City",
    ];

    // Randomly select a city
    const randomIndex = Math.floor(Math.random() * cities.length);
    return cities[randomIndex]!;
  };

  /**
   * Generates a random Plaid account transaction with various properties such as
   * accountId, amount, isoCurrencyCode, currentDate, and more.
   *
   * @returns {PlaidAccountTransaction} The randomly generated Plaid account
   *   transaction object.
   */
  static generateRandomPlaidAccountTransaction =
    (): PlaidAccountTransaction => {
      return {
        accountId: FinancialDataGenerator.getRandomString(10),
        amount: FinancialDataGenerator.getRandomNumber(1, 10000),
        isoCurrencyCode: "USD",
        currentDate: FinancialDataGenerator.getTrulyRandomDate(),
        transactionName: FinancialDataGenerator.getRandomString(10),
        merchantName: FinancialDataGenerator.generateMerchant(),
        paymentChannel: FinancialDataGenerator.generatePaymentChannels(),
        pending: FinancialDataGenerator.getRandomBoolean(),
        transactionId: FinancialDataGenerator.getTrulyRandomString(),
        time: FinancialDataGenerator.getTrulyRandomDate(),
        unofficialCurrencyCode: FinancialDataGenerator.getTrulyRandomString(),
        categoryId: FinancialDataGenerator.getTrulyRandomString(),
        checkNumber: FinancialDataGenerator.getTrulyRandomString(),
        currentDatetime: new Date(),
        authorizedDate: new Date(),
        authorizedDatetime: new Date(),
        pendingTransactionId: FinancialDataGenerator.getTrulyRandomString(),
        accountOwner: FinancialDataGenerator.getTrulyRandomString(),
        transactionCode: FinancialDataGenerator.getTrulyRandomString(),
        id: FinancialDataGenerator.getTrulyRandomString(),
        userId: FinancialDataGenerator.getTrulyRandomString(),
        linkId: FinancialDataGenerator.getTrulyRandomString(),
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.generatePrimaryCategory(),
        personalFinanceCategoryDetailed:
          FinancialDataGenerator.generatePrimaryCategory(),
        locationAddress: FinancialDataGenerator.getTrulyRandomString(),
        locationCity: FinancialDataGenerator.getTrulyRandomString(),
        locationRegion: FinancialDataGenerator.getTrulyRandomString(),
        locationPostalCode: FinancialDataGenerator.getTrulyRandomString(),
        locationCountry: FinancialDataGenerator.getRandomCountry(),
        locationLat: parseFloat((Math.random() * 180 - 90).toFixed(6)),
        locationLon: parseFloat((Math.random() * 360 - 180).toFixed(6)),
        locationStoreNumber: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaByOrderOf: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaPayee: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaPayer: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaPaymentMethod: "credit card",
        paymentMetaPaymentProcessor:
          FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaPpdId: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaReason: FinancialDataGenerator.getTrulyRandomString(),
        paymentMetaReferenceNumber:
          FinancialDataGenerator.getTrulyRandomString(),
        additionalProperties: { someKey: "someValue" }, // Example of an Any1 object
        categories: FinancialDataGenerator.generateRandomCategories(5),
        tags: [
          FinancialDataGenerator.getTrulyRandomString(),
          FinancialDataGenerator.getTrulyRandomString(),
          FinancialDataGenerator.getTrulyRandomString(),
          FinancialDataGenerator.getTrulyRandomString(),
        ],
        splits: FinancialDataGenerator.generateRandomTransactionSplits(5),
        notes: FinancialDataGenerator.generateRandomSmartNotes(5),
      };
    };

  /**
   * Generates an array of random PlaidAccountTransactions.
   *
   * @param {number} count - The number of random PlaidAccountTransactions to
   *   generate.
   * @returns {Array} - An array of random PlaidAccountTransactions.
   */
  static generateRandomPlaidAccountTransactions = (count: number) => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomPlaidAccountTransaction,
    );
  };

  /**
   * Generates a random AccountBalanceHistory object with random values for id,
   * time, accountId, isoCurrencyCode, balance, userId, and sign.
   *
   * @returns {AccountBalanceHistory} An object representing a random account
   *   balance history.
   */
  static generateRandomAccountBalanceHistory = (): AccountBalanceHistory => {
    return {
      id: FinancialDataGenerator.getRandomStringWithPrefix(5, "BAL-"),
      time: FinancialDataGenerator.getRandomDateInRange(
        new Date(2020, 0, 1).getTime(),
        new Date(2023, 11, 31).getTime(),
      ),
      accountId: FinancialDataGenerator.getRandomStringWithPrefix(5, "ACC-"),
      isoCurrencyCode: ["USD", "EUR", "GBP", "JPY", "AUD"][
        FinancialDataGenerator.getRandomNumber(0, 4)
      ],
      balance: FinancialDataGenerator.getRandomBalance(),
      userId: FinancialDataGenerator.getRandomString(10),
      sign: [1, -1][FinancialDataGenerator.getRandomNumber(0, 1)],
    };
  };

  /**
   * Generates an array of random AccountBalanceHistory objects with the given
   * count.
   *
   * @param {number} count - The number of AccountBalanceHistory objects to
   *   generate.
   * @returns {AccountBalanceHistory[]} An array of random AccountBalanceHistory
   *   objects.
   */
  static generateRandomAccountBalanceHistories = (count: number) => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomAccountBalanceHistory,
    );
  };

  static generateRandomMonthlyBalances = (count: number) => {
    const balances: MonthlyBalance[] = [];
    for (let i = 0; i < count; i++) {
      balances.push({
        month: (i % 12) + 1, // Ensure month ranges from 1 to 12
        netBalance: Math.random() * 10000, // Example net balance generation
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return balances;
  };

  /**
   * Generates a random Student Loan Account object with various properties such
   * as ID, disbursement dates, interest rate, payment information, loan details,
   * and user-related details like user ID and name.
   *
   * @returns {StudentLoanAccount} A randomly generated Student Loan Account
   *   object.
   */
  static generateRandomStudentLoanAccount = (): StudentLoanAccount => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      plaidAccountId: FinancialDataGenerator.getRandomNumber(
        1,
        10000,
      ).toString(),
      disbursementDates: ["2028-01-01", "2028-02-01"],
      expectedPayoffDate: "2028-01-01",
      guarantor: "US Department of Education",
      interestRatePercentage:
        (FinancialDataGenerator.getRandomNumber(0, 1) * 1) /
        FinancialDataGenerator.getRandomNumber(1, 100),
      isOverdue: false,
      lastPaymentAmount: FinancialDataGenerator.getRandomNumber(1, 100),
      lastPaymentDate: "2028-01-01",
      lastStatementIssueDate: "2028-01-01",
      loanName: "Loan Name",
      loanEndDate: "2028-01-01",
      minimumPaymentAmount: FinancialDataGenerator.getRandomNumber(1, 100),
      nextPaymentDueDate: "2028-01-01",
      originationDate: "2028-01-01",
      originationPrincipalAmount: 100000,
      outstandingInterestAmount: 100,
      paymentReferenceNumber: "123456789",
      sequenceNumber: "123456789",
      ytdInterestPaid: 5000,
      ytdPrincipalPaid: 50000,
      loanType: "Loan Type",
      pslfStatusEstimatedEligibilityDate: "2028-01-01",
      pslfStatusPaymentsMade: FinancialDataGenerator.getRandomNumber(1, 100),
      pslfStatusPaymentsRemaining: FinancialDataGenerator.getRandomNumber(
        1,
        100,
      ),
      repaymentPlanType: "Repayment Plan Type",
      repaymentPlanDescription: "Repayment Plan Description",
      servicerAddressCity: "Servicer Address City",
      servicerAddressPostalCode: "Servicer Address Postal Code",
      servicerAddressState: "Servicer Address State",
      servicerAddressStreet: "Servicer Address Street",
      servicerAddressRegion: "Servicer Address Region",
      servicerAddressCountry: "Servicer Address Country",
      userId: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: `Account ${FinancialDataGenerator.getRandomNumber(1, 10000)}`,
    };
  };

  /**
   * Generates an array of random student loan accounts.
   *
   * @param {number} count - The number of student loan accounts to generate.
   * @returns {StudentLoanAccount[]} - An array of random student loan accounts.
   */
  static generateRandomStudentLoanAccounts = (count: number) => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomStudentLoanAccount,
    );
  };

  static generateRandomIncomeMetrics = (count: number, year: number) => {
    const incomeMetrics: IncomeMetrics[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      incomeMetrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        transactionCount: FinancialDataGenerator.getRandomNumber(1, 500) + "",
        totalIncome: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return incomeMetrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random expense metrics for a given number of months and
   * year.
   *
   * @param {number} count - The number of expense metrics to generate.
   * @param {number} year - The year for which the expense metrics are generated.
   * @returns {ExpenseMetrics[]} - An array of random expense metrics sorted by
   *   month.
   */
  static generateRandomExpenseMetrics = (count: number, year: number) => {
    const expenseMetrics: ExpenseMetrics[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      expenseMetrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        transactionCount: FinancialDataGenerator.getRandomNumber(1, 500) + "",
        totalExpenses: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return expenseMetrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates a random SmartNote object with random values for id, userId,
   * content, createdAt, and updatedAt.
   *
   * @returns {SmartNote} The generated SmartNote object.
   */
  static generateRandomSmartNote = (): SmartNote => {
    return {
      id: FinancialDataGenerator.getRandomString(10),
      userId: FinancialDataGenerator.getRandomString(10),
      content: `<p>Example Text to demonstrate adding a note and viewing it. Ideally this is for example purposes</p>`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  /**
   * Generates an array of random SmartNotes.
   *
   * @param {number} count - The number of SmartNotes to generate.
   * @returns {SmartNote[]} An array of randomly generated SmartNotes.
   */
  static generateRandomSmartNotes = (count: number): SmartNote[] => {
    return Array.from(
      { length: count },
      FinancialDataGenerator.generateRandomSmartNote,
    );
  };

  /**
   * Generates an array of random MerchantMonthlyExpenditure objects.
   *
   * @param {number} count - The number of MerchantMonthlyExpenditure objects to
   *   generate.
   * @param {number} year - The year for the MerchantMonthlyExpenditure objects.
   * @returns {MerchantMonthlyExpenditure[]} An array of randomly generated
   *   MerchantMonthlyExpenditure objects.
   */
  static generateRandomMerchantMonthlyExpenditures = (
    count: number,
    year: number,
  ): MerchantMonthlyExpenditure[] => {
    const metrics: MerchantMonthlyExpenditure[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        merchantName: FinancialDataGenerator.generateMerchant(),
        totalSpending: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random CategoryMonthlyExpenditure objects for a user
   * category.
   *
   * @param {number} count - The number of CategoryMonthlyExpenditure objects to
   *   generate.
   * @param {number} year - The year for the CategoryMonthlyExpenditure objects.
   * @returns {CategoryMonthlyExpenditure[]} An array of randomly generated
   *   CategoryMonthlyExpenditure objects.
   */
  static generateRandomUserCategoryMonthlyExpenditures = (
    count: number,
    year: number,
  ): CategoryMonthlyExpenditure[] => {
    const metrics: CategoryMonthlyExpenditure[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        totalSpending: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random MonthlyExpenditure objects for a given year.
   *
   * @param {number} count - The number of MonthlyExpenditure objects to generate.
   * @param {number} year - The year for the MonthlyExpenditure objects.
   * @returns {MonthlyExpenditure[]} An array of randomly generated
   *   MonthlyExpenditure objects.
   */
  static generateMonthlyExpenditures = (
    count: number,
    year: number,
  ): MonthlyExpenditure[] => {
    const metrics: MonthlyExpenditure[] = [];

    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        totalSpending: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of PaymentChannelMonthlyExpenditure objects for a given
   * year.
   *
   * @param {number} count - The number of PaymentChannelMonthlyExpenditure
   *   objects to generate.
   * @param {number} year - The year for the PaymentChannelMonthlyExpenditure
   *   objects.
   * @returns {PaymentChannelMonthlyExpenditure[]} An array of randomly generated
   *   PaymentChannelMonthlyExpenditure objects.
   */
  static generatePaymentChannelMonthlyExpenditures = (
    count: number,
    year: number,
  ): PaymentChannelMonthlyExpenditure[] => {
    const metrics: PaymentChannelMonthlyExpenditure[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        paymentChannel: FinancialDataGenerator.generatePaymentChannels(),
        totalSpending: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of IncomeMetrics objects for a given year.
   *
   * @param {number} count - The number of IncomeMetrics objects to generate.
   * @param {number} year - The year for the IncomeMetrics objects.
   * @returns {IncomeMetrics[]} An array of randomly generated IncomeMetrics
   *   objects.
   */
  static generateIncomeMetrics = (
    count: number,
    year: number,
  ): IncomeMetrics[] => {
    const metrics: IncomeMetrics[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        totalIncome: FinancialDataGenerator.getRandomNumber(1, 10000),
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        transactionCount: FinancialDataGenerator.getRandomNumber(
          1,
          10000,
        ).toString(),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates sample income metrics spanning multiple years.
   * @param startYear The starting year for the generated data
   * @param endYear The ending year for the generated data
   * @returns An array of IncomeMetrics
   */
  public static generateIncomeMetricsAcrossManyYears(
    startYear: number,
    endYear: number,
  ): IncomeMetrics[] {
    const sampleData: IncomeMetrics[] = [];
    const categories = [
      "Salary",
      "Investments",
      "Freelance",
      "Rental Income",
      "Other",
    ];

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        categories.forEach((category) => {
          const baseIncome = Math.random() * 10000 + 1000; // Random income between 1000 and 11000
          const variance = (Math.random() - 0.5) * 2000; // Random variance between -1000 and 1000

          sampleData.push({
            month: year * 100 + month,
            personalFinanceCategoryPrimary: category,
            totalIncome: Math.round(baseIncome + variance),
            transactionCount: (Math.floor(Math.random() * 10) + 1).toString(), // Random transaction count between 1 and 10
          });
        });
      }
    }

    return sampleData;
  }

  /**
   * Generates sample expense metrics spanning multiple years.
   * @param startYear The starting year for the generated data
   * @param endYear The ending year for the generated data
   * @returns An array of IncomeMetrics
   */
  public static generateExpenseMetricsAcrossManyYears(
    startYear: number,
    endYear: number,
  ): ExpenseMetrics[] {
    const sampleData: ExpenseMetrics[] = [];
    const categories = [
      "Salary",
      "Investments",
      "Freelance",
      "Rental Income",
      "Other",
    ];

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        categories.forEach((category) => {
          const baseIncome = Math.random() * 10000 + 1000; // Random income between 1000 and 11000
          const variance = (Math.random() - 0.5) * 2000; // Random variance between -1000 and 1000

          sampleData.push({
            month: year * 100 + month,
            personalFinanceCategoryPrimary: category,
            totalExpenses: Math.round(baseIncome + variance),
            transactionCount: (Math.floor(Math.random() * 10) + 1).toString(), // Random transaction count between 1 and 10
          });
        });
      }
    }

    return sampleData;
  }

  /**
   * Generates an array of MonthlyIncome objects for a given year.
   *
   * @param {number} count - The number of MonthlyIncome objects to generate.
   * @param {number} year - The year for the MonthlyIncome objects.
   * @returns {MonthlyIncome[]} An array of randomly generated MonthlyIncome
   *   objects.
   */
  static generateMonthlyIncome = (
    count: number,
    year: number,
  ): MonthlyIncome[] => {
    const metrics: MonthlyIncome[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        totalIncome: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of CategoryMonthlyIncome objects for a given year.
   *
   * @param {number} count - The number of CategoryMonthlyIncome objects to
   *   generate.
   * @param {number} year - The year for the CategoryMonthlyIncome objects.
   * @returns {CategoryMonthlyIncome[]} An array of randomly generated
   *   CategoryMonthlyIncome objects sorted by month.
   */
  static generateUserCategoryMonthlyIncome = (
    count: number,
    year: number,
  ): CategoryMonthlyIncome[] => {
    const metrics: CategoryMonthlyIncome[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        totalIncome: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    // sort the incomeMetrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates random financial data for user categories on a monthly basis.
   * This function can generate both income and expense data.
   *
   * @param count - The number of data points to generate.
   * @param year - The year for which to generate data.
   * @param type - The type of data to generate: 'income' or 'expense'.
   * @returns An array of CategoryMonthlyIncome or CategoryMonthlyExpenditure objects, sorted by month.
   */
  static generateUserCategoryMonthlyData = (
    count: number,
    year: number,
    type: "income" | "expense",
  ): (CategoryMonthlyIncome | CategoryMonthlyExpenditure)[] => {
    const metrics: (CategoryMonthlyIncome | CategoryMonthlyExpenditure)[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      const baseData = {
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      };

      if (type === "income") {
        metrics.push({
          ...baseData,
          totalIncome: FinancialDataGenerator.getRandomNumber(1, 10000),
        } as CategoryMonthlyIncome);
      } else {
        metrics.push({
          ...baseData,
          totalSpending: FinancialDataGenerator.getRandomNumber(1, 10000),
        } as CategoryMonthlyExpenditure);
      }
    }

    // sort the metrics by month
    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of PaymentChannelMetricsFinancialSubProfile objects for a
   * given count.
   *
   * @param {number} count - The number of
   *   PaymentChannelMetricsFinancialSubProfile objects to generate.
   * @returns {PaymentChannelMetricsFinancialSubProfile[]} An array of randomly
   *   generated PaymentChannelMetricsFinancialSubProfile objects sorted by
   *   month.
   */
  static generateRandomPaymentChannelMetricsFinancialSubProfile = (
    count: number,
  ): PaymentChannelMetricsFinancialSubProfile[] => {
    const metrics: PaymentChannelMetricsFinancialSubProfile[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: month, // e.g., for year 2023 and month 4, it becomes 202304
        paymentChannel: FinancialDataGenerator.generatePaymentChannels(),
        spentLastWeek: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoWeeks: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastYear: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoYears: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random Merchant Metrics Financial Sub Profiles based on
   * the count provided.
   *
   * @param {number} count - The number of profiles to generate.
   * @returns {MerchantMetricsFinancialSubProfile[]} The array of generated
   *   Merchant Metrics Financial Sub Profiles sorted by month.
   */
  static generateRandomMerchantMetricsFinancialSubProfile = (
    count: number,
    year: number,
  ): MerchantMetricsFinancialSubProfile[] => {
    const metrics: MerchantMetricsFinancialSubProfile[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        merchantName: FinancialDataGenerator.generateMerchant(),
        spentLastWeek: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoWeeks: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastYear: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoYears: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of LocationFinancialSubProfile objects with random metrics
   * for each location.
   *
   * @param {number} count - The number of LocationFinancialSubProfile objects to
   *   generate.
   * @returns {LocationFinancialSubProfile[]} The array of
   *   LocationFinancialSubProfile objects sorted by month.
   */
  static generateRandomLocationMetricsFinancialSubProfile = (
    count: number,
    year: number,
  ): LocationFinancialSubProfile[] => {
    const metrics: LocationFinancialSubProfile[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        locationCity: FinancialDataGenerator.generateLocationCity(),
        spentLastWeek: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoWeeks: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastYear: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoYears: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of IncomeMetricsFinancialSubProfile objects with random
   * values for all properties and sorts them by month.
   *
   * @param {number} count - The number of IncomeMetricsFinancialSubProfile
   *   objects to generate.
   * @returns {IncomeMetricsFinancialSubProfile[]} The array of
   *   IncomeMetricsFinancialSubProfile objects sorted by month.
   */
  static generateRandomIncomeMetricsFinancialSubProfile = (
    count: number,
  ): IncomeMetricsFinancialSubProfile[] => {
    const metrics: IncomeMetricsFinancialSubProfile[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: month, // e.g., for year 2023 and month 4, it becomes 202304
        incomeLastTwoWeeks: FinancialDataGenerator.getRandomNumber(1, 10000),
        incomeLastTwoMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        incomeLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        incomeLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        incomeLastYear: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random ExpenseMetricsFinancialSubProfileMetrics
   * objects.
   *
   * @param {number} count - The number of metrics objects to generate.
   * @returns {ExpenseMetricsFinancialSubProfileMetrics[]} - The array of
   *   generated metrics objects.
   */
  static generateRandomExpenseMetricsFinancialSubProfile = (
    count: number,
  ): ExpenseMetricsFinancialSubProfileMetrics[] => {
    const metrics: ExpenseMetricsFinancialSubProfileMetrics[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: month, // e.g., for year 2023 and month 4, it becomes 202304
        spentLastWeek: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        averageMonthlyDiscretionarySpending:
          FinancialDataGenerator.getRandomNumber(1, 10000),
        averageMonthlyRecurringSpending: FinancialDataGenerator.getRandomNumber(
          1,
          10000,
        ),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates an array of random CategoryMetricsFinancialSubProfile objects.
   *
   * @param {number} count - The number of CategoryMetricsFinancialSubProfile
   *   objects to generate.
   * @returns {CategoryMetricsFinancialSubProfile[]} An array of randomly
   *   generated CategoryMetricsFinancialSubProfile objects, sorted by month.
   */
  static generateRandomCategoryMetricsFinancialSubProfile = (
    count: number,
  ): CategoryMetricsFinancialSubProfile[] => {
    const metrics: CategoryMetricsFinancialSubProfile[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);
      metrics.push({
        month: month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        transactionCount: FinancialDataGenerator.getRandomNumber(
          1,
          10000,
        ).toString(),
        spentLastWeek: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoWeeks: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastMonth: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastSixMonths: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastYear: FinancialDataGenerator.getRandomNumber(1, 10000),
        spentLastTwoYears: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return metrics.sort((a, b) => a.month! - b.month!);
  };

  /**
   * Generates and returns a MelodyFinancialContext object with random values for
   * all properties.
   *
   * @returns {MelodyFinancialContext} The generated MelodyFinancialContext
   *   object.
   */
  static generateRandomFinancialContext = (): MelodyFinancialContext => {
    // Add your code here to generate and return a FinancialUserProfile
    return {
      // Add properties and values for the FinancialUserProfile
      categories:
        FinancialDataGenerator.generateRandomCategoryMetricsFinancialSubProfile(
          5,
        ),
      expenses:
        FinancialDataGenerator.generateRandomExpenseMetricsFinancialSubProfile(
          5,
        ),
      income:
        FinancialDataGenerator.generateRandomIncomeMetricsFinancialSubProfile(
          5,
        ),
      locations:
        FinancialDataGenerator.generateRandomLocationMetricsFinancialSubProfile(
          5,
          2023,
        ),
      merchants:
        FinancialDataGenerator.generateRandomMerchantMetricsFinancialSubProfile(
          5,
          2023,
        ),
      paymentChannels:
        FinancialDataGenerator.generateRandomPaymentChannelMetricsFinancialSubProfile(
          5,
        ),
      bankAccounts: FinancialDataGenerator.generateRandomBankAccounts(5),
      investmentAccounts:
        FinancialDataGenerator.generateRandomInvestmentAccounts(5),
      creditAccounts: FinancialDataGenerator.generateRandomCreditAccounts(5),
      mortgageLoanAccounts: [],
      studentLoanAccounts:
        FinancialDataGenerator.generateRandomStudentLoanAccounts(5),
      financialUserProfileType: FinancialUserProfileType.User,
    };
  };

  /**
   * Generates an array of DebtToIncomeRatio objects with random values for the
   * month, ratio, userId, and profileType properties.
   *
   * @param {number} count - The number of DebtToIncomeRatio objects to generate.
   * @param {number} year - The year to use in the month calculation.
   * @returns {DebtToIncomeRatio[]} - An array of DebtToIncomeRatio objects with
   *   random values for the properties.
   */
  static generateDebtToIncomeRatios = (
    count: number,
    year: number,
  ): DebtToIncomeRatio[] => {
    const debtToIncomeRatios: DebtToIncomeRatio[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);

      debtToIncomeRatios.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        ratio: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return debtToIncomeRatios;
  };

  /**
   * Generates an array of IncomeExpenseRatio objects with random values for the
   * month, ratio, userId, and profileType properties.
   *
   * @param {number} count - The number of IncomeExpenseRatio objects to generate.
   * @param {number} year - The year to use in the month calculation.
   * @returns {IncomeExpenseRatio[]} - An array of IncomeExpenseRatio objects with
   *   random values for the properties.
   */
  static generateIncomeExpenseRatios = (
    count: number,
    year: number,
  ): IncomeExpenseRatio[] => {
    const incomeExpenseRatios: IncomeExpenseRatio[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);

      incomeExpenseRatios.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        ratio: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return incomeExpenseRatios;
  };

  /**
   * Generates an array of CategoryMonthlyTransactionCount objects with random
   * values for the month, personalFinanceCategoryPrimary, transactionCount,
   * userId, and profileType properties.
   *
   * @param {number} count - The number of CategoryMonthlyTransactionCount objects
   *   to generate.
   * @param {number} year - The year to use in the month calculation.
   * @returns {CategoryMonthlyTransactionCount[]} - An array of
   *   CategoryMonthlyTransactionCount objects with random values for the
   *   properties.
   */
  static generateCategoryMonthlyTransactionCounts = (
    count: number,
    year: number,
  ): CategoryMonthlyTransactionCount[] => {
    const categoryMonthlyTransactionCounts: CategoryMonthlyTransactionCount[] =
      [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);

      categoryMonthlyTransactionCounts.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        personalFinanceCategoryPrimary:
          FinancialDataGenerator.getRandomTransactionCategory(),
        transactionCount: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return categoryMonthlyTransactionCounts;
  };

  /**
   * Generates an array of MonthlyTransactionCount objects with random data.
   *
   * @param {number} count - The number of MonthlyTransactionCount objects to
   *   generate.
   * @param {number} year - The year for the generated MonthlyTransactionCount
   *   objects.
   * @returns {MonthlyTransactionCount[]} An array of MonthlyTransactionCount
   *   objects with random data.
   */
  static generateMonthlyTransactionCounts = (
    count: number,
    year: number,
  ): MonthlyTransactionCount[] => {
    const monthlyTransactionCounts: MonthlyTransactionCount[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);

      monthlyTransactionCounts.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        transactionCount: FinancialDataGenerator.getRandomNumber(
          1,
          10000,
        ).toString(),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return monthlyTransactionCounts;
  };

  /**
   * Generates an array of MonthlySavings objects with random data.
   *
   * @param {number} count - The number of MonthlySavings objects to generate.
   * @param {number} year - The year for the generated MonthlySavings objects.
   * @returns {MonthlySavings[]} An array of MonthlySavings objects with random
   *   data.
   */
  static generateMonthlySavings = (
    count: number,
    year: number,
  ): MonthlySavings[] => {
    const monthlySavings: MonthlySavings[] = [];
    for (let i = 0; i < count; i++) {
      const month = FinancialDataGenerator.getRandomNumber(1, 12);

      monthlySavings.push({
        month: year * 100 + month, // e.g., for year 2023 and month 4, it becomes 202304
        netSavings: FinancialDataGenerator.getRandomNumber(1, 10000),
        userId: FinancialDataGenerator.getRandomString(10),
        profileType: FinancialUserProfileType.User,
      });
    }

    return monthlySavings;
  };

  /**
   * Generates a random investment holding object with random data.
   *
   * @returns {InvesmentHolding} The generated investment holding object.
   */
  static generateRandomInvestmentHolding: () => InvesmentHolding = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 100).toString(),
      name: FinancialDataGenerator.getRandomString(10),
      plaidAccountId: FinancialDataGenerator.getRandomString(10),
      costBasis: FinancialDataGenerator.getRandomBalance(),
      institutionPrice: FinancialDataGenerator.getRandomBalance(),
      institutionPriceAsOf: FinancialDataGenerator.getRandomString(10),
      institutionPriceDatetime: FinancialDataGenerator.getRandomString(10),
      institutionValue: FinancialDataGenerator.getRandomBalance(),
      isoCurrencyCode: FinancialDataGenerator.getRandomString(10),
      quantity: FinancialDataGenerator.getRandomNumber(1, 100),
      securityId: FinancialDataGenerator.getRandomString(10),
      unofficialCurrencyCode: FinancialDataGenerator.getRandomString(10),
    };
  };

  /**
   * Generates an array of random investment holdings.
   *
   * @param {number} count - The number of investment holdings to generate.
   * @returns {InvesmentHolding[]} An array of randomly generated investment
   *   holdings.
   */
  static generateRandomInvestmentHoldings: (
    count: number,
  ) => InvesmentHolding[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomInvestmentHolding(),
    );
  };

  /**
   * Generates a random InvestmentSecurity object with various random properties.
   *
   * @returns {InvestmentSecurity} The generated InvestmentSecurity object.
   */
  static generateRandomInvestmentSecurity: () => InvestmentSecurity = () => {
    return {
      id: Math.floor(Math.random() * 1000).toString(),
      closePrice: +(Math.random() * 1000).toFixed(2),
      closePriceAsOf: new Date().toISOString(),
      cusip: Math.random().toString(36).substring(2),
      institutionId: Math.random().toString(36).substring(2),
      institutionSecurityId: Math.random().toString(36).substring(2),
      isCashEquivalent: Math.random() < 0.5,
      isin: Math.random().toString(36).substring(2),
      isoCurrencyCode: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
      name: "Security " + Math.random().toString(36).substring(2),
      proxySecurityId: Math.random().toString(36).substring(2),
      securityId: Math.random().toString(36).substring(2),
      sedol: Math.random().toString(36).substring(2),
      tickerSymbol: Math.random().toString(36).substring(2).toUpperCase(),
      type: ["Stock", "Bond", "Mutual Fund"][Math.floor(Math.random() * 3)],
      unofficialCurrencyCode: Math.random().toString(36).substring(2),
      updateDatetime: new Date().toISOString(),
    };
  };

  /**
   * Generates an array of random investment securities.
   *
   * @param {number} count - The number of investment securities to generate.
   * @returns {InvestmentSecurity[]} An array of randomly generated investment
   *   securities.
   */
  static generateRandomInvestmentSecurities: (
    count: number,
  ) => InvestmentSecurity[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomInvestmentSecurity(),
    );
  };

  /**
   * Generates a random investment account object with randomly generated
   * properties.
   *
   * @returns {InvestmentAccount} The generated investment account object.
   */
  static generateRandomInvestmentAccount: () => InvestmentAccount = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 100).toString(),
      userId: FinancialDataGenerator.getRandomNumber(1, 100).toString(),
      name: FinancialDataGenerator.getRandomString(10),
      number: FinancialDataGenerator.getRandomString(10),
      type: FinancialDataGenerator.getRandomString(10),
      balance: FinancialDataGenerator.getRandomBalance(),
      currentFunds: FinancialDataGenerator.getRandomBalance(),
      balanceLimit: FinancialDataGenerator.getRandomBalance().toString(),
      plaidAccountId: FinancialDataGenerator.getRandomString(10),
      subtype: FinancialDataGenerator.getRandomString(10),
      holdings: FinancialDataGenerator.generateRandomInvestmentHoldings(20),
      securities: FinancialDataGenerator.generateRandomInvestmentSecurities(20),
    } as InvestmentAccount;
  };

  /**
   * Generates an array of random investment accounts.
   *
   * @param {number} count - The number of investment accounts to generate.
   * @returns {InvestmentAccount[]} An array of randomly generated investment
   *   accounts.
   */
  static generateRandomInvestmentAccounts: (
    count: number,
  ) => InvestmentAccount[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomInvestmentAccount(),
    );
  };

  /**
   * Generates a random category object with an ID, name, description, and
   * subcategories.
   *
   * @returns {Category1} A randomly generated category object with the following
   *   properties:
   *
   *   - Id: a string representing a randomly generated number between 1 and 10000
   *   - Name: a string of random alphanumeric characters with a length of 5
   *   - Description: a string of random alphanumeric characters with a length of 10
   *   - Subcategories: an array of randomly generated subcategory objects
   */
  static generateRandomCategory: () => Category1 = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      subcategories: FinancialDataGenerator.getRandomSubcategories(),
    };
  };

  /**
   * Generates a random budget object with an ID, name, description, start date,
   * end date, and category.
   *
   * @returns {Budget} A randomly generated budget object with the following
   *   properties:
   *
   *   - Id: a string representing a randomly generated number between 1 and 10000
   *   - Name: a string of random alphanumeric characters with a length of 5
   *   - Description: a string of random alphanumeric characters with a length of 10
   *   - StartDate: a random date between January 1, 2020 and January 1, 2025
   *   - EndDate: a random date between January 1, 2020 and January 1, 2025
   *   - Category: a randomly generated category object
   */
  static generateRandomBudget: () => Budget = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      startDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      endDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      category: FinancialDataGenerator.generateRandomCategory(),
    };
  };

  /**
   * Generates an array of random budget objects.
   *
   * @param {number} count - The number of budget objects to generate.
   * @returns {Budget[]} An array of randomly generated budget objects.
   */
  static generateRandomBudgets: (count: number) => Budget[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomBudget(),
    );
  };

  static generateRandomMilestone: () => Milestone = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      targetDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      targetAmount: `$${FinancialDataGenerator.getRandomNumber(100, 1000)}`,
      isCompleted: FinancialDataGenerator.getRandomBoolean(),
      budget: FinancialDataGenerator.generateRandomBudget(),
    };
  };

  /**
   * Generates an array of random Milestone objects.
   *
   * @param {number} count - The number of Milestone objects to generate.
   * @returns {Milestone[]} An array of randomly generated Milestone objects.
   */
  static generateRandomMilestones: (count: number) => Milestone[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomMilestone(),
    );
  };

  /**
   * Generates a random Forecast object.
   *
   * @returns {Forecast} A randomly generated Forecast object.
   */
  static generateRandomForecast: () => Forecast = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      forecastedAmount: FinancialDataGenerator.getRandomAmount(),
      forecastedCompletionDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      varianceAmount: FinancialDataGenerator.getRandomAmount(),
    };
  };

  /**
   * Generates a random SmartGoal object with random values for all its
   * properties.
   *
   * @returns {SmartGoal} A randomly generated SmartGoal object.
   */
  static generateRandomGoal: () => SmartGoal = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      userId: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: FinancialDataGenerator.getRandomString(5),
      description: FinancialDataGenerator.getRandomString(10),
      isCompleted: FinancialDataGenerator.getRandomBoolean(),
      goalType: "GOAL_TYPE_INVESTMENT",
      duration: `${FinancialDataGenerator.getRandomNumber(1, 5)} weeks`,
      startDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      endDate: FinancialDataGenerator.getRandomDate(
        new Date(2022, 0, 1),
        new Date(2030, 0, 1),
      ),
      targetAmount: `$${FinancialDataGenerator.getRandomNumber(500, 10000)}`,
      currentAmount: `$${FinancialDataGenerator.getRandomNumber(0, 5000)}`,
      milestones: FinancialDataGenerator.generateRandomMilestones(5),
      forecasts:
        Math.random() > 0.1
          ? FinancialDataGenerator.generateRandomForecast()
          : undefined,
    };
  };

  /**
   * Generates an array of random SmartGoals based on the count provided.
   *
   * @param {number} count - The number of SmartGoals to generate.
   * @returns {SmartGoal[]} An array of randomly generated SmartGoals.
   */
  static generateRandomGoals: (count: number) => SmartGoal[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomGoal(),
    );
  };

  /**
   * Generates a random Pocket object with random values for all its properties.
   *
   * @returns {Pocket} A randomly generated Pocket object.
   */
  static generateRandomPocket: () => Pocket = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      goals: FinancialDataGenerator.generateRandomGoals(5),
      type: "POCKET_TYPE_LONG_TERM_SAVINGS",
    };
  };

  /**
   * Generates an array of random Pocket objects based on the count provided.
   *
   * @param {number} count - The number of Pocket objects to generate.
   * @returns {Pocket[]} An array of randomly generated Pocket objects.
   */
  static generateRandomPockets: (count: number) => Pocket[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomPocket(),
    );
  };

  /**
   * Generates a random CreditAccount object with random values for all its
   * properties.
   *
   * @returns {CreditAccount} A randomly generated CreditAccount object.
   */
  static generateRandomCreditAccount: () => CreditAccount = () => {
    return {
      id: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      userId: FinancialDataGenerator.getRandomNumber(1, 10000).toString(),
      name: `Account ${FinancialDataGenerator.getRandomString(5)}`,
      number: `xxxx-xxxx-xxxx-${FinancialDataGenerator.getRandomString(4)}`, // A sample account number format
      type: BankAccountType.Plaid,
      balance: FinancialDataGenerator.getRandomNumber(1000, 10000),
      currency: FinancialDataGenerator.getRandomArrayItem([
        "USD",
        "EUR",
        "GBP",
        "JPY",
      ]),
      currentFunds: FinancialDataGenerator.getRandomNumber(500, 5000),
      balanceLimit: FinancialDataGenerator.getRandomNumber(0, 1000).toString(),
      pockets: FinancialDataGenerator.generateRandomPockets(5),
      plaidAccountId: FinancialDataGenerator.getRandomString(10),
      subtype: `Subtype ${FinancialDataGenerator.getRandomString(3)}`,
      isOverdue: FinancialDataGenerator.getRandomBoolean(),
      lastPaymentAmount: FinancialDataGenerator.getRandomNumber(100, 1000),
      lastPaymentDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      nextPaymentAmount: FinancialDataGenerator.getRandomNumber(100, 1000),
      nextPaymentDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      lastStatementIssueDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      minimumAmountDueDate: FinancialDataGenerator.getRandomNumber(100, 1000),
      lastStatementBalance: FinancialDataGenerator.getRandomNumber(100, 1000),
      minimumPaymentAmount: FinancialDataGenerator.getRandomNumber(100, 1000),
      nextPaymentDueDate: FinancialDataGenerator.getRandomDate(
        new Date(2020, 0, 1),
        new Date(2025, 0, 1),
      ),
      status: BankAccountStatus.Active,
    } as CreditAccount;
  };

  /**
   * Generates an array of random CreditAccount objects with the specified count.
   *
   * @param {number} count - The number of CreditAccount objects to generate.
   * @returns {CreditAccount[]} An array of randomly generated CreditAccount
   *   objects.
   */
  static generateRandomCreditAccounts: (count: number) => CreditAccount[] = (
    count,
  ) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomCreditAccount(),
    );
  };

  /**
   * Generates a random PlaidAccountRecurringTransaction object.
   *
   * @returns {PlaidAccountRecurringTransaction} A randomly generated
   *   PlaidAccountRecurringTransaction object.
   */
  static generateRandomPlaidAccountRecurringTransaction(): PlaidAccountRecurringTransaction {
    return {
      accountId: FinancialDataGenerator.getRandomString(10),
      streamId: FinancialDataGenerator.getRandomString(10),
      categoryId: FinancialDataGenerator.getRandomString(10),
      description: FinancialDataGenerator.getRandomString(10),
      merchantName: FinancialDataGenerator.getRandomString(10),
      personalFinanceCategoryPrimary:
        FinancialDataGenerator.getRandomString(10),
      personalFinanceCategoryDetailed:
        FinancialDataGenerator.getRandomString(10),
      firstDate: FinancialDataGenerator.getTrulyRandomDate(),
      lastDate: FinancialDataGenerator.getTrulyRandomDate(),
      frequency: FinancialDataGenerator.getRandomString(10),
      transactionIds: FinancialDataGenerator.getRandomString(10),
      averageAmount: FinancialDataGenerator.getRandomString(10),
      averageAmountIsoCurrencyCode: FinancialDataGenerator.getRandomString(10),
      lastAmount: FinancialDataGenerator.getRandomString(10),
      lastAmountIsoCurrencyCode: FinancialDataGenerator.getRandomString(10),
      isActive: true,
      status: FinancialDataGenerator.getRandomString(10),
      updatedTime: FinancialDataGenerator.getTrulyRandomDate(),
      userId: FinancialDataGenerator.getRandomString(10),
      linkId: FinancialDataGenerator.getRandomString(10),
      id: FinancialDataGenerator.getRandomString(10),
      flow: FinancialDataGenerator.getRandomString(10),
      time: FinancialDataGenerator.getTrulyRandomDate(),
      additionalProperties: {}, // You may adjust this if you have a specific structure for additional properties
      notes: [], // You may adjust this if you have a specific structure for notes
    };
  }

  /**
   * Generates an array of random Plaid Account Recurring Transactions based on
   * the count provided.
   *
   * @param {number} count - The number of Plaid Account Recurring Transactions to
   *   generate.
   * @returns {PlaidAccountRecurringTransaction[]} An array of randomly generated
   *   Plaid Account Recurring Transactions.
   */
  static generateRandomPlaidAccountRecurringTransactions: (
    count: number,
  ) => PlaidAccountRecurringTransaction[] = (count) => {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomPlaidAccountRecurringTransaction(),
    );
  };

  /**
   * Generates a random Link object with random values for all properties.
   *
   * @returns {Link} The generated Link object.
   */
  static generateRandomLink(): Link {
    return {
      shouldBeUpdated: false,
      newAccountsAvailable: false,
      updatedAt: new Date().toISOString(),
      linkType: "LINK_TYPE_PLAID",
      institutionName: FinancialDataGenerator.getRandomString(8),
      plaidInstitutionId: FinancialDataGenerator.getRandomString(10),
      studentLoanAccounts:
        FinancialDataGenerator.generateRandomStudentLoanAccounts(5),
      mortgageAccounts: [],
      creditAccounts: FinancialDataGenerator.generateRandomCreditAccounts(5),
      investmentAccounts:
        FinancialDataGenerator.generateRandomInvestmentAccounts(5),
      bankAccounts: FinancialDataGenerator.generateRandomBankAccounts(5),
    };
  }

  /**
   * Generates an array of random Link objects based on the count provided.
   *
   * @param {number} count - The number of Link objects to generate.
   * @returns {Link[]} An array of randomly generated Link objects.
   */
  static generateRandomLinks(count: number): Link[] {
    return Array.from({ length: count }, () =>
      FinancialDataGenerator.generateRandomLink(),
    );
  }

  /**
   * Generates a random date between two timestamps.
   *
   * @param {number} startTimestamp - The start timestamp in milliseconds.
   * @param {number} endTimestamp - The end timestamp in milliseconds.
   * @returns {Date | undefined} A random Date object within the given range, or
   *   undefined if the range is invalid.
   */
  static getRandomDateInRange(
    startTimestamp: number,
    endTimestamp: number,
  ): Date | undefined {
    // Check if the start timestamp is greater than the end timestamp
    if (startTimestamp > endTimestamp) {
      return undefined;
    }

    // Generate a random date within the range
    const randomTimestamp =
      startTimestamp + Math.random() * (endTimestamp - startTimestamp);

    return new Date(randomTimestamp);
  }

  static getNumberOfGoals = (account: BankAccount | CreditAccount) => {
    // iterate over all pockets and sum the number of goals
    return account.pockets?.reduce((acc, pocket) => {
      return acc + (pocket.goals?.length ?? 0);
    }, 0);
  };

  static getNumberMilestones = (account: BankAccount | CreditAccount) => {
    // iterate over all pockets and sum the number of milestones
    return account.pockets?.reduce((acc, pocket) => {
      return (
        acc +
        (pocket.goals?.reduce(
          (acc, goal) => acc + (goal.milestones?.length ?? 0),
          0,
        ) ?? 0)
      );
    }, 0);
  };
}
