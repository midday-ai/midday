import type {
  AgentDataParts,
  AgentUIMessage as BaseAgentUIMessage,
} from "@ai-sdk-tools/agents";

/**
 * Extended agent status type with application-specific agent names
 */
export type AgentStatus = {
  status: "routing" | "executing" | "completing";
  agent:
    | "triage"
    | "orchestrator"
    | "reports"
    | "transactions"
    | "invoices"
    | "timeTracking"
    | "customers"
    | "analytics"
    | "operations"
    | "research"
    | "general";
};
/**
 * Extended data parts interface with application-specific data
 *
 * This demonstrates how to extend the base AgentDataParts with
 * custom data parts for your application.
 */
export interface AppDataParts extends AgentDataParts {
  // Override the agent-status with our extended type
  "agent-status": AgentStatus;
}

export type AgentUIMessage = BaseAgentUIMessage<never, AppDataParts>;
