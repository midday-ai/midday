import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import type { UIMessageStreamWriter } from "ai";

// Generic loading states - can be extended per canvas type
export interface BaseLoadingStates {
  [key: string]: boolean;
}

// Base canvas data structure
export interface BaseCanvasData<
  TData = any,
  TLoadingStates = BaseLoadingStates,
> {
  type: string;
  data: {
    title: string;
    isLoading: boolean;
    loadingStates: TLoadingStates;
    summary?: {
      overview: string;
      recommendations: string;
    };
  } & TData;
}

// Abstract base class for canvas tools
export abstract class BaseCanvasTool<
  TData,
  TLoadingStates extends BaseLoadingStates,
> {
  abstract readonly canvasType: string;
  abstract readonly loadingStateKeys: (keyof TLoadingStates)[];

  constructor(
    protected writer: UIMessageStreamWriter,
    protected teamCurrency: string,
    protected period: string,
  ) {}

  // Create initial loading state
  protected createLoadingState(): BaseCanvasData<TData, TLoadingStates> {
    const loadingStates = {} as TLoadingStates;
    for (const key of this.loadingStateKeys) {
      loadingStates[key] = true;
    }

    return {
      type: this.canvasType,
      data: {
        title: this.getTitle(),
        isLoading: true,
        loadingStates,
        ...this.getEmptyData(),
      } as any,
    };
  }

  // Create partial loading update
  protected createPartialUpdate(
    loadingStates: Partial<TLoadingStates>,
    partialData: Partial<TData> = {},
  ): BaseCanvasData<TData, TLoadingStates> {
    return {
      type: this.canvasType,
      data: {
        title: this.getTitle(),
        isLoading: Object.values(loadingStates).some(Boolean),
        loadingStates: loadingStates as TLoadingStates,
        ...partialData,
      } as any,
    };
  }

  // Create final canvas data with AI summary
  protected async createFinalData(
    data: TData,
    loadingStates: TLoadingStates,
  ): Promise<BaseCanvasData<TData, TLoadingStates>> {
    // Generate AI summary
    const summary = await this.generateAISummary(data);

    // Mark all loading states as false
    const finalLoadingStates = {} as TLoadingStates;
    for (const key of this.loadingStateKeys) {
      finalLoadingStates[key] = false;
    }

    return {
      type: this.canvasType,
      data: {
        title: this.getTitle(),
        isLoading: false,
        loadingStates: finalLoadingStates,
        summary,
        ...data,
      } as any,
    };
  }

  // Send canvas update to client
  protected sendCanvasUpdate(
    canvasData: BaseCanvasData<TData, TLoadingStates>,
  ) {
    this.writer.write({
      type: "data-canvas",
      data: canvasData,
    });
  }

  // Generate AI-powered summary
  protected async generateAISummary(
    data: TData,
  ): Promise<{ overview: string; recommendations: string }> {
    const prompt = this.buildSummaryPrompt(data);

    const summaryResult = await streamText({
      model: openai("gpt-4o-mini"),
      prompt,
    });

    let summaryText = "";
    for await (const delta of summaryResult.textStream) {
      summaryText += delta;
    }

    try {
      return JSON.parse(summaryText);
    } catch (error) {
      return {
        overview: `Analysis of your ${this.canvasType.replace("-", " ")} reveals key insights and patterns.`,
        recommendations:
          "Consider reviewing the data for optimization opportunities.",
      };
    }
  }

  // Abstract methods to be implemented by each canvas tool
  abstract getTitle(): string;
  abstract getEmptyData(): Partial<TData>;
  abstract buildSummaryPrompt(data: TData): string;

  // Main execution method
  abstract execute(...args: any[]): AsyncGenerator<any, void, unknown>;
}
