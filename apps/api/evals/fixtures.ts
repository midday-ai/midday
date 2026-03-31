/**
 * Test fixtures for chat tool selection evals
 *
 * Each fixture simulates a real conversation scenario and specifies
 * which tools MUST be in the selected activeTools set.
 */
import type { ModelMessage } from "ai";

export interface ToolSelectionFixture {
  name: string;
  messages: ModelMessage[];
  expected: string[];
  alternatives?: string[];
  acceptablePrefixes?: string[];
  stepNumber?: number;
}

// ============================================================================
// Invoice multi-turn flows
// ============================================================================

export const invoiceCreateInitial: ToolSelectionFixture = {
  name: "invoice-create-initial",
  messages: [
    {
      role: "user",
      content:
        "Create an invoice for Acme, 5 hours of consulting at $150 per hour",
    },
  ],
  expected: ["invoices_create", "customers_list"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_"],
};

export const invoiceCreateConfirmCustomer: ToolSelectionFixture = {
  name: "invoice-create-confirm-customer",
  messages: [
    {
      role: "user",
      content:
        "Create an invoice for Acme, 5 hours of consulting at $150 per hour",
    },
    {
      role: "assistant",
      content:
        'Looking up customers.\n\nI found a customer named "Acme Corp AB". Did you mean [Acme Corp AB](#cust:abc-123)?',
    },
    { role: "user", content: "Yes" },
  ],
  expected: ["invoices_create"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_"],
};

export const invoiceCreateWithFullDetails: ToolSelectionFixture = {
  name: "invoice-create-with-details",
  messages: [
    {
      role: "user",
      content:
        "Invoice Acme Corp for 3 hours of design work at $200/hr, due in 30 days",
    },
  ],
  expected: ["invoices_create", "customers_list"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_"],
};

export const invoiceUpdateDraft: ToolSelectionFixture = {
  name: "invoice-update-draft",
  messages: [
    {
      role: "user",
      content: "Create an invoice for Beta Inc, 10 hours at $100/hr",
    },
    {
      role: "assistant",
      content: "Here's the draft invoice for Beta Inc.",
    },
    {
      role: "user",
      content: "Change the due date to next Friday",
    },
  ],
  expected: ["invoices_update_draft"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

export const invoiceSend: ToolSelectionFixture = {
  name: "invoice-send",
  messages: [
    {
      role: "user",
      content: "Create an invoice for Gamma Ltd, 2 hours at $250/hr",
    },
    {
      role: "assistant",
      content: "Here's the draft invoice for Gamma Ltd.",
    },
    {
      role: "user",
      content: "Looks good, send it",
    },
  ],
  expected: ["invoices_send"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

// ============================================================================
// Vague / short follow-ups (stress tests for query extraction)
// ============================================================================

export const vagueConfirm: ToolSelectionFixture = {
  name: "vague-confirm",
  messages: [
    {
      role: "user",
      content: "I need to bill Lost Island for last month's work",
    },
    {
      role: "assistant",
      content:
        "I found a customer matching that name: [Lost Island AB](#cust:li-456). Should I use this customer for the invoice?",
    },
    { role: "user", content: "Yes, that one" },
  ],
  expected: ["invoices_create"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_"],
};

export const vagueAmount: ToolSelectionFixture = {
  name: "vague-amount",
  messages: [
    {
      role: "user",
      content: "Create an invoice for Delta Corp, 5 hours at $100/hr",
    },
    {
      role: "assistant",
      content: "Here's the draft invoice for Delta Corp — 5 hours at $100/hr.",
    },
    { role: "user", content: "Make it $500 flat instead" },
  ],
  expected: ["invoices_update_draft"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

export const vagueSendIt: ToolSelectionFixture = {
  name: "vague-send-it",
  messages: [
    {
      role: "user",
      content:
        "Create an invoice for Foxtrot AB, 8 hours consulting at $175/hr",
    },
    {
      role: "assistant",
      content: "Here's the draft invoice for Foxtrot AB.",
    },
    {
      role: "user",
      content: "Go ahead",
    },
  ],
  expected: ["invoices_send"],
  alternatives: ["invoices_update_draft"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

// ============================================================================
// Other common single-turn and multi-turn flows
// ============================================================================

export const transactionSearch: ToolSelectionFixture = {
  name: "transaction-search",
  messages: [
    {
      role: "user",
      content: "Show me my transactions from last month",
    },
  ],
  expected: ["transactions_list"],
  acceptablePrefixes: ["transactions_"],
};

export const timeTrackingStart: ToolSelectionFixture = {
  name: "time-tracking-start",
  messages: [
    {
      role: "user",
      content: "Start a timer for Project Alpha",
    },
  ],
  expected: ["tracker_projects_list", "tracker_timer_start"],
  acceptablePrefixes: ["tracker_"],
};

export const reportBurnRate: ToolSelectionFixture = {
  name: "report-burn-rate",
  messages: [
    {
      role: "user",
      content: "What's my burn rate?",
    },
  ],
  expected: ["reports_burn_rate"],
  acceptablePrefixes: ["reports_"],
};

export const customerCreate: ToolSelectionFixture = {
  name: "customer-create",
  messages: [
    {
      role: "user",
      content: "Add a new customer called Acme Corp, based in Stockholm",
    },
  ],
  expected: ["customers_create"],
  alternatives: ["customers_list"],
  acceptablePrefixes: ["customers_"],
};

export const reportRevenue: ToolSelectionFixture = {
  name: "report-revenue",
  messages: [
    {
      role: "user",
      content: "How much revenue did we make this quarter?",
    },
  ],
  expected: ["reports_revenue"],
  acceptablePrefixes: ["reports_"],
};

export const invoiceListOverdue: ToolSelectionFixture = {
  name: "invoice-list-overdue",
  messages: [
    {
      role: "user",
      content: "Which invoices are overdue?",
    },
  ],
  expected: ["invoices_list"],
  alternatives: ["invoices_payment_status"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

// ============================================================================
// Untested domains — single-turn
// ============================================================================

export const bankAccountBalances: ToolSelectionFixture = {
  name: "bank-account-balances",
  messages: [
    {
      role: "user",
      content: "What's my current balance across all accounts?",
    },
  ],
  expected: ["bank_accounts_balances"],
  alternatives: ["bank_accounts_list"],
  acceptablePrefixes: ["bank_accounts_"],
};

export const bankAccountList: ToolSelectionFixture = {
  name: "bank-account-list",
  messages: [
    {
      role: "user",
      content: "Show me my connected bank accounts",
    },
  ],
  expected: ["bank_accounts_list"],
  acceptablePrefixes: ["bank_accounts_"],
};

export const categoriesList: ToolSelectionFixture = {
  name: "categories-list",
  messages: [
    {
      role: "user",
      content: "Show me all expense categories",
    },
  ],
  expected: ["categories_list"],
  acceptablePrefixes: ["categories_"],
};

export const documentsList: ToolSelectionFixture = {
  name: "documents-list",
  messages: [
    {
      role: "user",
      content: "Show me the documents in my vault",
    },
  ],
  expected: ["documents_list"],
  acceptablePrefixes: ["documents_"],
};

export const inboxList: ToolSelectionFixture = {
  name: "inbox-list",
  messages: [
    {
      role: "user",
      content: "Show me unprocessed receipts",
    },
  ],
  expected: ["inbox_list"],
  acceptablePrefixes: ["inbox_"],
};

export const invoiceProductsList: ToolSelectionFixture = {
  name: "invoice-products-list",
  messages: [
    {
      role: "user",
      content: "What products do I have in my catalog?",
    },
  ],
  expected: ["invoice_products_list"],
  acceptablePrefixes: ["invoice_products_"],
};

export const searchGlobal: ToolSelectionFixture = {
  name: "search-global",
  messages: [
    {
      role: "user",
      content: "Search for anything related to Acme",
    },
  ],
  expected: ["search_global"],
  acceptablePrefixes: ["search_"],
};

export const teamMembers: ToolSelectionFixture = {
  name: "team-members",
  messages: [
    {
      role: "user",
      content: "Who's on my team?",
    },
  ],
  expected: ["team_members"],
  acceptablePrefixes: ["team_"],
};

// ============================================================================
// Workflow-dependency scenarios (tests relatedTools)
// ============================================================================

export const recurringInvoiceCreate: ToolSelectionFixture = {
  name: "recurring-invoice-create",
  messages: [
    {
      role: "user",
      content: "Set up a monthly invoice for Acme Corp, $2000 retainer",
    },
  ],
  expected: ["invoice_recurring_create", "customers_list"],
  acceptablePrefixes: ["invoice_", "invoices_", "customers_"],
};

export const invoiceFromTracker: ToolSelectionFixture = {
  name: "invoice-from-tracker",
  messages: [
    {
      role: "user",
      content: "Invoice Beta Corp for the hours tracked in March",
    },
  ],
  expected: ["invoices_create_from_tracker", "customers_list"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_", "tracker_"],
};

export const logTimeManual: ToolSelectionFixture = {
  name: "log-time-manual",
  messages: [
    {
      role: "user",
      content: "Log 3 hours on Project Alpha for yesterday",
    },
  ],
  expected: ["tracker_entries_create", "tracker_projects_list"],
  acceptablePrefixes: ["tracker_"],
};

export const categorizeTransaction: ToolSelectionFixture = {
  name: "categorize-transaction",
  messages: [
    {
      role: "user",
      content: "Show me my transactions from last week",
    },
    {
      role: "assistant",
      content:
        "Here are your transactions from last week:\n\n| Date | Description | Amount |\n|---|---|---|\n| 2025-03-24 | Uber | -$32.50 |\n| 2025-03-25 | AWS | -$145.00 |",
    },
    {
      role: "user",
      content: "Categorize that Uber ride as travel expenses",
    },
  ],
  expected: ["transactions_update", "categories_list"],
  acceptablePrefixes: ["transactions_", "categories_"],
};

// ============================================================================
// Additional invoice/tracker operations
// ============================================================================

export const invoiceFindByNumber: ToolSelectionFixture = {
  name: "invoice-find-by-number",
  messages: [
    {
      role: "user",
      content: "Find invoice INV-042",
    },
  ],
  expected: ["invoices_search_number"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

export const invoiceMarkPaid: ToolSelectionFixture = {
  name: "invoice-mark-paid",
  messages: [
    {
      role: "user",
      content: "Mark the latest invoice as paid",
    },
  ],
  expected: ["invoices_mark_paid"],
  alternatives: ["invoices_list", "invoices_update"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

export const trackerTimerStop: ToolSelectionFixture = {
  name: "tracker-timer-stop",
  messages: [
    {
      role: "user",
      content: "Stop my timer",
    },
  ],
  expected: ["tracker_timer_stop"],
  acceptablePrefixes: ["tracker_"],
};

export const trackerTimerStatus: ToolSelectionFixture = {
  name: "tracker-timer-status",
  messages: [
    {
      role: "user",
      content: "Am I tracking time right now?",
    },
  ],
  expected: ["tracker_timer_status"],
  acceptablePrefixes: ["tracker_"],
};

export const transactionsExport: ToolSelectionFixture = {
  name: "transactions-export",
  messages: [
    {
      role: "user",
      content: "Export my transactions for Q1 as CSV",
    },
  ],
  expected: ["transactions_export"],
  acceptablePrefixes: ["transactions_"],
};

// ============================================================================
// Natural language paraphrasing (stress tests for semantic search)
// ============================================================================

export const paraphraseBurnRate: ToolSelectionFixture = {
  name: "paraphrase-burn-rate",
  messages: [
    {
      role: "user",
      content: "How fast am I burning through cash?",
    },
  ],
  expected: ["reports_burn_rate"],
  acceptablePrefixes: ["reports_"],
};

export const paraphraseRunway: ToolSelectionFixture = {
  name: "paraphrase-runway",
  messages: [
    {
      role: "user",
      content: "How long until we run out of money?",
    },
  ],
  expected: ["reports_runway"],
  acceptablePrefixes: ["reports_"],
};

export const paraphraseSpending: ToolSelectionFixture = {
  name: "paraphrase-spending",
  messages: [
    {
      role: "user",
      content: "Show me where my money is going",
    },
  ],
  expected: ["reports_spending"],
  acceptablePrefixes: ["reports_"],
};

// ============================================================================
// Multi-turn edge case
// ============================================================================

export const invoiceRemindAfterOverdue: ToolSelectionFixture = {
  name: "invoice-remind-after-overdue",
  messages: [
    {
      role: "user",
      content: "Which invoices are overdue?",
    },
    {
      role: "assistant",
      content:
        "You have 2 overdue invoices:\n\n| Invoice | Customer | Amount | Due |\n|---|---|---|---|\n| [INV-038](#inv:inv-038) | Acme Corp | $1,500 | 2025-03-01 |\n| [INV-041](#inv:inv-041) | Beta Inc | $3,200 | 2025-03-15 |",
    },
    {
      role: "user",
      content: "Send a reminder for the first one",
    },
  ],
  expected: ["invoices_remind"],
  acceptablePrefixes: ["invoices_", "invoice_"],
};

// ============================================================================
// Multi-step scenarios (stepNumber > 0 — tool results already in context)
// ============================================================================

export const multiStepInvoiceAfterCustomerLookup: ToolSelectionFixture = {
  name: "multi-step-invoice-after-customer-lookup",
  messages: [
    {
      role: "user",
      content:
        "Create an invoice for Acme, 5 hours of consulting at $150 per hour",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Looking up customers." },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "customers_list",
          input: { query: "Acme" },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call-1",
          toolName: "customers_list",
          output: {
            type: "json",
            value: {
              data: [{ id: "cust-123", name: "Acme Corp AB" }],
            },
          },
        },
      ],
    },
  ],
  expected: ["invoices_create"],
  acceptablePrefixes: ["invoices_", "invoice_", "customers_"],
  stepNumber: 1,
};

export const multiStepTimerAfterProjectLookup: ToolSelectionFixture = {
  name: "multi-step-timer-after-project-lookup",
  messages: [
    {
      role: "user",
      content: "Start a timer for Project Alpha",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Looking up projects." },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "tracker_projects_list",
          input: {},
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call-1",
          toolName: "tracker_projects_list",
          output: {
            type: "json",
            value: {
              data: [
                { id: "proj-1", name: "Project Alpha" },
                { id: "proj-2", name: "Project Beta" },
              ],
            },
          },
        },
      ],
    },
  ],
  expected: ["tracker_timer_start"],
  acceptablePrefixes: ["tracker_"],
  stepNumber: 1,
};

export const multiStepRemindAfterInvoiceList: ToolSelectionFixture = {
  name: "multi-step-remind-after-invoice-list",
  messages: [
    {
      role: "user",
      content: "Send a reminder for the overdue Acme invoice",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Checking overdue invoices." },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "invoices_list",
          input: { status: "overdue" },
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call-1",
          toolName: "invoices_list",
          output: {
            type: "json",
            value: {
              data: [
                {
                  id: "inv-038",
                  invoiceNumber: "INV-038",
                  customerName: "Acme Corp",
                  amount: 1500,
                  status: "overdue",
                },
              ],
            },
          },
        },
      ],
    },
  ],
  expected: ["invoices_remind"],
  acceptablePrefixes: ["invoices_", "invoice_"],
  stepNumber: 1,
};

export const multiStepCategorizeAfterLookup: ToolSelectionFixture = {
  name: "multi-step-categorize-after-lookup",
  messages: [
    {
      role: "user",
      content: "Categorize the Uber transaction as travel",
    },
    {
      role: "assistant",
      content: [
        { type: "text", text: "Looking up categories." },
        {
          type: "tool-call",
          toolCallId: "call-1",
          toolName: "categories_list",
          input: {},
        },
      ],
    },
    {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId: "call-1",
          toolName: "categories_list",
          output: {
            type: "json",
            value: {
              data: [
                { id: "cat-1", name: "Travel" },
                { id: "cat-2", name: "Software" },
                { id: "cat-3", name: "Office" },
              ],
            },
          },
        },
      ],
    },
  ],
  expected: ["transactions_update"],
  alternatives: ["transactions_list", "transactions_get"],
  acceptablePrefixes: ["transactions_", "categories_"],
  stepNumber: 1,
};

// ============================================================================
// All fixtures
// ============================================================================

export const allFixtures: ToolSelectionFixture[] = [
  // Invoice multi-turn
  invoiceCreateInitial,
  invoiceCreateConfirmCustomer,
  invoiceCreateWithFullDetails,
  invoiceUpdateDraft,
  invoiceSend,
  // Vague follow-ups
  vagueConfirm,
  vagueAmount,
  vagueSendIt,
  // Original other flows
  transactionSearch,
  timeTrackingStart,
  reportBurnRate,
  customerCreate,
  reportRevenue,
  invoiceListOverdue,
  // Untested domains
  bankAccountBalances,
  bankAccountList,
  categoriesList,
  documentsList,
  inboxList,
  invoiceProductsList,
  searchGlobal,
  teamMembers,
  // Workflow dependencies (relatedTools)
  recurringInvoiceCreate,
  invoiceFromTracker,
  logTimeManual,
  categorizeTransaction,
  // Additional operations
  invoiceFindByNumber,
  invoiceMarkPaid,
  trackerTimerStop,
  trackerTimerStatus,
  transactionsExport,
  // Paraphrasing
  paraphraseBurnRate,
  paraphraseRunway,
  paraphraseSpending,
  // Multi-turn edge case
  invoiceRemindAfterOverdue,
  // Multi-step (stepNumber > 0)
  multiStepInvoiceAfterCustomerLookup,
  multiStepTimerAfterProjectLookup,
  multiStepRemindAfterInvoiceList,
  multiStepCategorizeAfterLookup,
];
