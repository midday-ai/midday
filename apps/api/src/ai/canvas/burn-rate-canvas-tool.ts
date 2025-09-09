import { getBurnRate, getRunway } from "@db/queries"; // Your existing queries
import { formatAmount } from "@midday/utils/format";
import { format } from "date-fns";
import { type BaseCanvasData, BaseCanvasTool } from "./base-canvas";

// 1️⃣ Define loading states for your canvas
interface BurnRateLoadingStates {
  burnRate: boolean;
  runway: boolean;
  trends: boolean;
  projections: boolean;
}

// 2️⃣ Define your canvas data structure
interface BurnRateData {
  currentBurnRate: number;
  monthlyTrend: number;
  runwayMonths: number;
  currency: string;
  period: string;
  monthlyData: Array<{
    month: string;
    burnRate: number;
    revenue: number;
    expenses: number;
  }>;
  projections: Array<{
    month: string;
    projectedBurnRate: number;
    confidence: number;
  }>;
  recommendations: Array<{
    category: string;
    impact: string;
    savings: number;
  }>;
}

// 3️⃣ Export your canvas data type
export type BurnRateCanvasData = BaseCanvasData<
  BurnRateData,
  BurnRateLoadingStates
>;

// 4️⃣ Implement your canvas tool
export class BurnRateCanvasTool extends BaseCanvasTool<
  BurnRateData,
  BurnRateLoadingStates
> {
  readonly canvasType = "burn-rate-analysis";
  readonly loadingStateKeys = [
    "burnRate",
    "runway",
    "trends",
    "projections",
  ] as const;

  getTitle(): string {
    return `Burn Rate Analysis (${this.period})`;
  }

  getEmptyData(): Partial<BurnRateData> {
    return {
      currentBurnRate: null,
      monthlyTrend: null,
      runwayMonths: null,
      currency: null,
      period: this.period,
      monthlyData: null,
      projections: null,
      recommendations: null,
    };
  }

  // 5️⃣ Define AI prompt for dynamic summaries
  buildSummaryPrompt(data: BurnRateData): string {
    return `Analyze this burn rate data and provide strategic insights:

BURN RATE DATA:
- Current burn rate: ${formatAmount({ amount: data.currentBurnRate, currency: data.currency })}/month
- Monthly trend: ${data.monthlyTrend > 0 ? "increasing" : "decreasing"} by ${Math.abs(data.monthlyTrend)}%
- Runway: ${data.runwayMonths} months
- Period: ${data.period}

MONTHLY BREAKDOWN:
${data.monthlyData
  .slice(-6)
  .map(
    (month) =>
      `${month.month}: Burn ${formatAmount({ amount: month.burnRate, currency: data.currency })} (Revenue: ${formatAmount({ amount: month.revenue, currency: data.currency })}, Expenses: ${formatAmount({ amount: month.expenses, currency: data.currency })})`,
  )
  .join("\n")}

PROJECTIONS:
${data.projections
  .slice(0, 3)
  .map(
    (proj) =>
      `${proj.month}: ${formatAmount({ amount: proj.projectedBurnRate, currency: data.currency })} (${proj.confidence}% confidence)`,
  )
  .join("\n")}

Provide analysis in JSON format:
{
  "overview": "2-3 sentences on current burn rate health, trends, and runway status",
  "recommendations": "2-3 sentences with specific actionable steps to optimize burn rate and extend runway"
}

Focus on financial health, sustainability, and growth balance.`;
  }

  // 6️⃣ Implement your data fetching with progressive loading
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
    yield { content: "Calculating burn rate..." };

    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 📊 Step 1: Fetch current burn rate
    const burnRateData = await getBurnRate(db, {
      teamId: user.teamId,
      from,
      to,
      currency: this.teamCurrency,
    });

    // Process the burn rate data
    const monthlyData = burnRateData.map((item) => ({
      month: format(new Date(item.date), "MMM yyyy"),
      burnRate: item.value,
      revenue: 0, // We'll need to get this separately or calculate it
      expenses: item.value, // Burn rate is essentially expenses minus revenue
    }));

    const currentBurnRate = burnRateData[burnRateData.length - 1]?.value || 0;
    const previousBurnRate = burnRateData[burnRateData.length - 2]?.value || 0;
    const monthlyTrend =
      previousBurnRate > 0
        ? ((currentBurnRate - previousBurnRate) / previousBurnRate) * 100
        : 0;

    // Send partial update - burn rate loaded
    this.sendCanvasUpdate(
      this.createPartialUpdate(
        { burnRate: false, runway: true, trends: true, projections: true },
        {
          currentBurnRate,
          monthlyTrend,
          currency: this.teamCurrency,
          monthlyData,
        },
      ),
    );

    yield { content: "Analyzing runway and trends..." };
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 📈 Step 2: Fetch runway data using the database function
    const runwayMonths = await getRunway(db, {
      teamId: user.teamId,
      from,
      to,
      currency: this.teamCurrency,
    });

    // Send partial update - runway and trends loaded
    this.sendCanvasUpdate(
      this.createPartialUpdate(
        { burnRate: false, runway: false, trends: false, projections: true },
        {
          currentBurnRate,
          monthlyTrend,
          runwayMonths,
          currency: this.teamCurrency,
          monthlyData,
        },
      ),
    );

    yield { content: "Generating projections and recommendations..." };
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 🔮 Step 3: Generate projections
    const projections = this.generateProjections(monthlyData, monthlyTrend);
    const recommendations = this.generateRecommendations(
      { currentBurnRate, trend: monthlyTrend },
      { months: runwayMonths },
    );

    // 🎯 Step 4: Create final data with AI summary
    const finalData: BurnRateData = {
      currentBurnRate,
      monthlyTrend,
      runwayMonths,
      currency: this.teamCurrency,
      period: this.period,
      monthlyData,
      projections,
      recommendations,
    };

    const finalCanvas = await this.createFinalData(finalData, {
      burnRate: false,
      runway: false,
      trends: false,
      projections: false,
    });

    this.sendCanvasUpdate(finalCanvas);
  }

  // Helper methods
  private generateProjections(monthlyData: any[], trend: number) {
    // Generate 6-month projections based on trend
    const lastBurnRate = monthlyData[monthlyData.length - 1]?.burnRate || 0;
    return Array.from({ length: 6 }, (_, i) => ({
      month: new Date(
        Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      projectedBurnRate: lastBurnRate * (1 + trend / 100) ** (i + 1),
      confidence: Math.max(95 - i * 10, 60), // Decreasing confidence
    }));
  }

  private generateRecommendations(burnRateData: any, runwayData: any) {
    return [
      {
        category: "Cost Optimization",
        impact: "High",
        savings: burnRateData.currentBurnRate * 0.15,
      },
      {
        category: "Revenue Growth",
        impact: "Medium",
        savings: burnRateData.currentBurnRate * 0.25,
      },
    ];
  }
}
