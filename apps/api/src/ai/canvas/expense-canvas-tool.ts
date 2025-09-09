import { getExpenses, getSpending, getTransactions } from "@db/queries";
import { formatAmount } from "@midday/utils/format";
import { format } from "date-fns";
import { type BaseCanvasData, BaseCanvasTool } from "./base-canvas";

// 1️⃣ Define loading states for expense analysis
interface ExpenseLoadingStates {
  transactions: boolean;
  metrics: boolean;
  topCategories: boolean;
}

// 2️⃣ Define expense data structure
interface ExpenseData {
  transactions: Array<{
    id: string;
    date: string;
    vendor: string;
    category: string;
    amount: number;
    share: number;
  }>;
  totalSpending: number;
  currency: string;
  period: string;
  metrics: Array<{
    title: string;
    value: number;
    subtitle: string;
    currency: string;
  }>;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

// 3️⃣ Export canvas data type
export type ExpenseCanvasData = BaseCanvasData<
  ExpenseData,
  ExpenseLoadingStates
>;

// 4️⃣ Implement expense canvas tool
export class ExpenseCanvasTool extends BaseCanvasTool<
  ExpenseData,
  ExpenseLoadingStates
> {
  readonly canvasType = "expense-analysis";
  readonly loadingStateKeys = [
    "transactions",
    "metrics",
    "topCategories",
  ] as const;

  getTitle(): string {
    return `Expense Analysis (${this.period})`;
  }

  getEmptyData(): Partial<ExpenseData> {
    return {
      transactions: null,
      totalSpending: null,
      currency: null,
      period: this.period,
      metrics: null,
      topCategories: null,
    };
  }

  // 5️⃣ Define AI prompt for dynamic summaries
  buildSummaryPrompt(data: ExpenseData): string {
    const topVendor = data.transactions[0];
    const secondVendor = data.transactions[1];
    const topCategoriesText = data.topCategories
      .slice(0, 3)
      .map(
        (cat, i) =>
          `${i + 1}. ${cat.name}: ${formatAmount({ amount: cat.amount, currency: data.currency })} (${cat.percentage}%)`,
      )
      .join("\n");

    return `Analyze this expense data and provide insights:

EXPENSE OVERVIEW:
- Total spending: ${formatAmount({ amount: data.totalSpending, currency: data.currency })}
- Period: ${data.period}
- Number of transactions: ${data.transactions.length}

TOP SPENDING CATEGORIES:
${topCategoriesText}

TOP TRANSACTIONS:
${data.transactions
  .slice(0, 6)
  .map(
    (tx, i) =>
      `${i + 1}. ${tx.vendor}: ${formatAmount({ amount: tx.amount, currency: data.currency })} (${tx.category})`,
  )
  .join("\n")}

METRICS:
${data.metrics
  .map(
    (metric) =>
      `- ${metric.title}: ${metric.value}${metric.currency === "percentage" ? "%" : ""}`,
  )
  .join("\n")}

Provide a concise analysis in exactly this JSON format:
{
  "overview": "2-3 sentences summarizing spending patterns, top categories, and key insights from the data",
  "recommendations": "2-3 sentences with specific, actionable recommendations for cost optimization based on the actual data"
}

Focus on the actual data provided. Be specific about amounts, percentages, and vendor names. Keep it professional and actionable.`;
  }

  // 6️⃣ Implement data fetching with progressive loading
  async *execute(
    db: any,
    user: any,
    from: string,
    to: string,
    showCanvas = true,
  ): AsyncGenerator<any, void, unknown> {
    if (!showCanvas) return;

    // Send initial loading state
    this.sendCanvasUpdate(this.createLoadingState());
    yield { content: "Analyzing your expenses..." };

    await new Promise((resolve) => setTimeout(resolve, 800));

    // 📊 Step 1: Fetch biggest transactions
    const biggestTransactions = await getTransactions(db, {
      teamId: user.teamId,
      from,
      to,
      limit: 100,
      order: "desc",
      orderBy: "amount",
      filter: {
        type: "expense",
      },
    });

    const transactionData =
      biggestTransactions.data?.map((tx: any) => ({
        id: tx.id,
        date: format(new Date(tx.date), "MMM dd"),
        vendor: tx.name,
        category: tx.category?.name || "Uncategorized",
        amount: Math.abs(tx.amount),
        share: 0, // Will be calculated after we get total
      })) || [];

    const totalSpending = Math.abs(
      transactionData.reduce((sum, tx) => sum + tx.amount, 0),
    );

    // Update shares
    for (const tx of transactionData) {
      tx.share =
        totalSpending > 0 ? Math.round((tx.amount / totalSpending) * 100) : 0;
    }

    // Send partial update - transactions loaded
    this.sendCanvasUpdate(
      this.createPartialUpdate(
        { transactions: false, metrics: true, topCategories: true },
        {
          transactions: transactionData.slice(0, 20), // Limit for display
          totalSpending,
          currency: this.teamCurrency,
        },
      ),
    );

    yield { content: "Calculating spending metrics..." };
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 📈 Step 2: Fetch spending data and calculate metrics
    const spendingData = await getSpending(db, {
      teamId: user.teamId,
      from,
      to,
      currency: this.teamCurrency,
    });

    const largestTransactions = transactionData.slice(0, 6);
    const avgTransactionAmount = totalSpending / transactionData.length || 0;
    const concentration = largestTransactions.reduce(
      (sum, tx) => sum + tx.share,
      0,
    );

    const metricsData = [
      {
        title: "Largest Transaction",
        value: largestTransactions[0]?.amount || 0,
        subtitle: largestTransactions[0]?.vendor || "No transactions",
        currency: this.teamCurrency,
      },
      {
        title: "Average Transaction",
        value: avgTransactionAmount,
        subtitle: "Per transaction",
        currency: this.teamCurrency,
      },
      {
        title: "Top 6 Concentration",
        value: concentration,
        subtitle: "% of total spending",
        currency: "percentage",
      },
      {
        title: "Total Transactions",
        value: transactionData.length,
        subtitle: "Expense transactions",
        currency: "count",
      },
    ];

    // Send partial update - metrics loaded
    this.sendCanvasUpdate(
      this.createPartialUpdate(
        { transactions: false, metrics: false, topCategories: true },
        {
          transactions: transactionData.slice(0, 20),
          totalSpending,
          currency: this.teamCurrency,
          metrics: metricsData,
        },
      ),
    );

    yield { content: "Analyzing spending categories..." };
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 📊 Step 3: Process top categories
    const topCategories = spendingData
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((cat: any) => ({
        name: cat.name || "Uncategorized",
        amount: Math.abs(cat.amount),
        percentage:
          totalSpending > 0
            ? Math.round((Math.abs(cat.amount) / totalSpending) * 100)
            : 0,
      }));

    // 🎯 Step 4: Create final data with AI summary
    const finalData: ExpenseData = {
      transactions: transactionData.slice(0, 20),
      totalSpending,
      currency: this.teamCurrency,
      period: this.period,
      metrics: metricsData,
      topCategories,
    };

    const finalCanvas = await this.createFinalData(finalData, {
      transactions: false,
      metrics: false,
      topCategories: false,
    });

    this.sendCanvasUpdate(finalCanvas);
  }
}
