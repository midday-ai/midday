import { describe, expect, it } from "bun:test";
import {
  buildBatchSummary,
  formatNotificationContextForPrompt,
} from "./activity-notifications";

describe("activity notifications", () => {
  it("builds a grouped transactions summary", () => {
    const summary = buildBatchSummary(
      "transaction",
      [
        {
          transactions: [
            {
              id: "tx_1",
              name: "Coffee",
              amount: 5,
              currency: "USD",
              date: "2026-03-31",
            },
          ],
        },
        {
          transactions: [
            {
              id: "tx_2",
              name: "Lunch",
              amount: 15,
              currency: "USD",
              date: "2026-03-31",
            },
          ],
        },
      ],
      {
        teamId: "team_1",
        userId: "user_1",
        provider: "slack",
      },
    );

    expect(summary).not.toBeNull();
    expect(summary?.text).toContain("2 new transactions");
    expect(summary?.context.entityIds).toEqual(["tx_1", "tx_2"]);
    expect(summary?.context.suggestedPrompts).toContain("Show me them");
  });

  it("formats notification context for the assistant prompt", () => {
    const prompt = formatNotificationContextForPrompt({
      eventType: "invoice_overdue",
      teamId: "team_1",
      userId: "user_1",
      entityType: "invoice",
      entityIds: ["inv_1"],
      summary: "1 invoice is overdue.",
      sourcePlatform: "telegram",
      suggestedPrompts: ["Show me them", "Draft a reminder"],
      sentAt: "2026-03-31T12:00:00.000Z",
    });

    expect(prompt).toContain("1 invoice is overdue.");
    expect(prompt).toContain("Show me them");
    expect(prompt).toContain("Draft a reminder");
  });
});
