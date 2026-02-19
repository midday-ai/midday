import { readFileSync } from "node:fs";
import { join } from "node:path";
import { openai } from "@ai-sdk/openai";
import { Agent, type AgentConfig } from "@ai-sdk-tools/agents";
import { RedisProvider } from "@ai-sdk-tools/memory/redis";
import { createRedisAdapter } from "@midday/cache/bun-redis-adapter";
import type { ChatUserContext } from "@midday/cache/chat-cache";

const memoryTemplate = readFileSync(
  join(process.cwd(), "src/ai/agents/config/memory-template.md"),
  "utf-8",
);

const suggestionsInstructions = readFileSync(
  join(process.cwd(), "src/ai/agents/config/suggestions-instructions.md"),
  "utf-8",
);

const titleInstructions = readFileSync(
  join(process.cwd(), "src/ai/agents/config/title-instructions.md"),
  "utf-8",
);

export function formatContextForLLM(context: AppContext): string {
  return `<company_info>
<current_date>${context.currentDateTime}</current_date>
<timezone>${context.timezone}</timezone>
<company_name>${context.companyName}</company_name>
<base_currency>${context.baseCurrency}</base_currency>
<locale>${context.locale}</locale>
</company_info>

Important: Use the current date/time above for time-sensitive operations. User-specific information is maintained in your working memory.`;
}

export const COMMON_AGENT_RULES = `<behavior_rules>
- Call tools immediately without explanatory text
- Use parallel tool calls when possible
- Provide specific numbers and actionable insights
- Explain your reasoning
- Lead with the most important information first
- When presenting repeated structured data (lists of items, multiple entries, time series), always use markdown tables
- Tables make data scannable and easier to compare - use them for any data with 2+ rows
</behavior_rules>`;

/**
 * Dashboard metrics filter state - source of truth for AI tool defaults.
 * When present, tools use these values unless explicitly overridden.
 */
export interface MetricsFilter {
  period: string; // "1-year", "6-months", etc.
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  currency?: string;
  revenueType: "gross" | "net";
}

/**
 * Forced tool call from widget click - bypasses AI parameter decisions.
 * When present for a matching tool, these params are used directly.
 */
export interface ForcedToolCall {
  toolName: string;
  toolParams: Record<string, unknown>;
}

export interface AppContext {
  userId: string;
  fullName: string;
  companyName: string;
  baseCurrency: string;
  locale: string;
  currentDateTime: string;
  country?: string;
  city?: string;
  region?: string;
  timezone: string;
  chatId: string;
  fiscalYearStartMonth?: number | null;
  hasBankAccounts?: boolean;

  /**
   * Dashboard metrics filter state (source of truth for defaults).
   * Tools use these values when no explicit params are provided.
   */
  metricsFilter?: MetricsFilter;

  /**
   * Forced tool params from widget click (bypasses AI decisions).
   * When a widget sends toolParams, they're stored here and used directly.
   */
  forcedToolCall?: ForcedToolCall;

  // Allow additional properties to satisfy Record<string, unknown> constraint
  [key: string]: unknown;
}

export function buildAppContext(
  context: ChatUserContext,
  chatId: string,
  options?: {
    metricsFilter?: MetricsFilter;
    forcedToolCall?: ForcedToolCall;
  },
): AppContext {
  // Combine userId and teamId to scope chats by both user and team
  const scopedUserId = `${context.userId}:${context.teamId}`;

  return {
    userId: scopedUserId,
    fullName: context.fullName ?? "",
    companyName: context.teamName ?? "",
    country: context.country ?? undefined,
    city: context.city ?? undefined,
    region: context.region ?? undefined,
    chatId,
    baseCurrency: context.baseCurrency ?? "USD",
    locale: context.locale ?? "en-US",
    currentDateTime: new Date().toISOString(),
    timezone:
      context.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    teamId: context.teamId,
    fiscalYearStartMonth: context.fiscalYearStartMonth ?? undefined,
    hasBankAccounts: context.hasBankAccounts ?? false,
    // Dashboard filter state and forced tool params
    metricsFilter: options?.metricsFilter,
    forcedToolCall: options?.forcedToolCall,
  };
}

export const memoryProvider = new RedisProvider(createRedisAdapter() as any);

export const createAgent = (config: AgentConfig<AppContext>) => {
  return new Agent({
    ...config,
    memory: {
      provider: memoryProvider,
      history: {
        enabled: true,
        limit: 10,
      },
      workingMemory: {
        enabled: true,
        template: memoryTemplate,
        scope: "user",
      },
      chats: {
        enabled: true,
        generateTitle: {
          model: openai("gpt-4.1-nano"),
          instructions: titleInstructions,
        },
        generateSuggestions: {
          enabled: true,
          model: openai("gpt-4.1-nano"),
          limit: 5,
          instructions: suggestionsInstructions,
        },
      },
    },
  });
};
