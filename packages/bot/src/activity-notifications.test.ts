import { describe, expect, it } from "bun:test";
import {
  buildBatchSummary,
  formatNotificationContextForPrompt,
  isWithinWhatsAppSessionWindow,
} from "./activity-notifications";
import {
  buildBatchTemplateComponents,
  buildMatchTemplateComponents,
  WHATSAPP_TEMPLATE_NAMES,
} from "./whatsapp-notifications";

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

describe("isWithinWhatsAppSessionWindow", () => {
  it("returns false when lastSeenAt is undefined", () => {
    expect(isWithinWhatsAppSessionWindow(undefined)).toBe(false);
  });

  it("returns false when lastSeenAt is an invalid date", () => {
    expect(isWithinWhatsAppSessionWindow("not-a-date")).toBe(false);
  });

  it("returns true when lastSeenAt is within 24 hours", () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
    expect(isWithinWhatsAppSessionWindow(recentDate)).toBe(true);
  });

  it("returns false when lastSeenAt is older than 24 hours", () => {
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    expect(isWithinWhatsAppSessionWindow(oldDate)).toBe(false);
  });
});

describe("buildBatchTemplateComponents", () => {
  it("builds transaction template with correct count", () => {
    const result = buildBatchTemplateComponents("transaction", [
      {
        transactions: [
          {
            id: "tx_1",
            name: "Coffee",
            amount: 5,
            currency: "USD",
            date: "2026-03-31",
          },
          {
            id: "tx_2",
            name: "Lunch",
            amount: 12,
            currency: "USD",
            date: "2026-03-31",
          },
        ],
      },
    ]);

    expect(result).not.toBeNull();
    expect(result!.templateName).toBe(WHATSAPP_TEMPLATE_NAMES.transaction);
    expect(result!.components).toEqual([
      {
        type: "body",
        parameters: [{ type: "text", text: "2 new transactions" }],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "/transactions" }],
      },
    ]);
  });

  it("returns null for transaction with no entries", () => {
    expect(
      buildBatchTemplateComponents("transaction", [{ transactions: [] }]),
    ).toBeNull();
  });

  it("builds invoice_paid template with count and labels", () => {
    const result = buildBatchTemplateComponents("invoice_paid", [
      { invoiceId: "inv_1", invoiceNumber: "INV-001" },
      { invoiceId: "inv_2", invoiceNumber: "INV-002" },
    ]);

    expect(result).not.toBeNull();
    expect(result!.templateName).toBe(WHATSAPP_TEMPLATE_NAMES.invoice_paid);
    expect(result!.components).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", text: "2 invoices have" },
          { type: "text", text: "INV-001, INV-002" },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "/invoices?statuses=paid" }],
      },
    ]);
  });

  it("builds invoice_overdue template", () => {
    const result = buildBatchTemplateComponents("invoice_overdue", [
      { invoiceId: "inv_1", invoiceNumber: "INV-003", customerName: "Acme" },
    ]);

    expect(result).not.toBeNull();
    expect(result!.templateName).toBe(WHATSAPP_TEMPLATE_NAMES.invoice_overdue);
    expect(result!.components).toEqual([
      {
        type: "body",
        parameters: [{ type: "text", text: "1 invoice is" }],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "/invoices?statuses=overdue" }],
      },
    ]);
  });

  it("builds recurring_invoice_upcoming template", () => {
    const result = buildBatchTemplateComponents("recurring_invoice_upcoming", [
      {
        invoices: [
          { recurringId: "r_1", scheduledAt: "2026-04-10" },
          { recurringId: "r_2", scheduledAt: "2026-04-11" },
        ],
        count: 2,
      },
    ]);

    expect(result).not.toBeNull();
    expect(result!.templateName).toBe(
      WHATSAPP_TEMPLATE_NAMES.recurring_invoice_upcoming,
    );
    expect(result!.components).toEqual([
      {
        type: "body",
        parameters: [{ type: "text", text: "2 recurring invoices are" }],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "/invoices?recurring=true" }],
      },
    ]);
  });

  it("returns null for unknown event family", () => {
    expect(buildBatchTemplateComponents("unknown_type", [{}])).toBeNull();
  });
});

describe("buildMatchTemplateComponents", () => {
  it("builds match template with document and transaction names", () => {
    const result = buildMatchTemplateComponents("receipt.pdf", "Coffee Shop");

    expect(result.templateName).toBe(WHATSAPP_TEMPLATE_NAMES.match);
    expect(result.components).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", text: "receipt.pdf" },
          { type: "text", text: "Coffee Shop" },
        ],
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [{ type: "text", text: "/inbox" }],
      },
    ]);
  });
});
