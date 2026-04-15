export interface CatalogAgent {
  templateId: string;
  name: string;
  slug: string;
  description: string;
  scheduleCron: string;
  code: string;
}

export const CATALOG_AGENTS: CatalogAgent[] = [
  {
    templateId: "month-end-close",
    name: "Month-End Close",
    slug: "month-end-close",
    description:
      "Runs a close-the-books checklist near month end: flags uncategorized transactions, unmatched inbox items, unsent draft invoices, and compares this month's P&L to last month with anomaly detection.",
    scheduleCron: "0 8 28-31 * *",
    code: `const { callTool, parseMcp, generateText, readMemory, writeMemory, notify } = SecureExec.bindings;

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];

const issues = [];
const errors = [];

// 1. Uncategorized transactions this month
let uncategorizedCount = 0;
try {
  const txnResult = await callTool("transactions_list", {
    categories: ["uncategorized"],
    start: monthStart,
    end: monthEnd,
    pageSize: 100,
  });
  const { data: txns } = parseMcp(txnResult);
  uncategorizedCount = txns.length;
  if (uncategorizedCount > 0) {
    const totalAmount = txns.reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    issues.push(uncategorizedCount + " uncategorized transactions (" + totalAmount.toFixed(2) + " total)");
  }
} catch (e) {
  errors.push("Failed to fetch uncategorized transactions: " + (e instanceof Error ? e.message : String(e)));
}

// 2. Pending inbox items
let pendingInboxCount = 0;
try {
  const inboxResult = await callTool("inbox_list", {
    status: "pending",
    pageSize: 100,
  });
  const { data: items } = parseMcp(inboxResult);
  pendingInboxCount = items.length;
  if (pendingInboxCount > 0) {
    issues.push(pendingInboxCount + " inbox items still pending (unmatched receipts/documents)");
  }
} catch (e) {
  errors.push("Failed to fetch inbox items: " + (e instanceof Error ? e.message : String(e)));
}

// 3. Draft invoices not yet sent
let draftInvoiceCount = 0;
try {
  const invResult = await callTool("invoices_list", {
    statuses: ["draft"],
    pageSize: 100,
  });
  const { data: invoices } = parseMcp(invResult);
  draftInvoiceCount = invoices.length;
  if (draftInvoiceCount > 0) {
    const totalDraft = invoices.reduce((s, i) => s + Math.abs(Number(i.amount || 0)), 0);
    issues.push(draftInvoiceCount + " draft invoices not sent (" + totalDraft.toFixed(2) + " total)");
  }
} catch (e) {
  errors.push("Failed to fetch draft invoices: " + (e instanceof Error ? e.message : String(e)));
}

// 4. This month's P&L
let currentPnl = null;
try {
  const pnlResult = await callTool("reports_profit", {
    from: monthStart,
    to: monthEnd,
  });
  currentPnl = parseMcp(pnlResult);
} catch (e) {
  errors.push("Failed to fetch P&L: " + (e instanceof Error ? e.message : String(e)));
}

// 5. Spending breakdown (bare array, no .data wrapper)
let spending = [];
try {
  const spendResult = await callTool("reports_spending", {
    from: monthStart,
    to: monthEnd,
  });
  const spendData = parseMcp(spendResult);
  spending = spendData?.data ?? spendData ?? [];
} catch (e) {
  errors.push("Failed to fetch spending: " + (e instanceof Error ? e.message : String(e)));
}

// 6. Load previous month summary from memory
const prevMemories = await readMemory({ key: "month_close_summary" });
let prevSummary = null;
try {
  if (prevMemories.length > 0) prevSummary = JSON.parse(prevMemories[0].content);
} catch (e) {}

if (errors.length > 0) {
  issues.push("\\u26a0 " + errors.length + " data source(s) failed to load: " + errors.join("; "));
}

// 7. AI analysis
const dataForAi = {
  month: monthStart + " to " + monthEnd,
  issues,
  errors,
  currentPnl: currentPnl?.summary ?? null,
  spending: spending.slice(0, 10),
  previousMonth: prevSummary,
};

const analysis = await generateText(
  "You are reviewing month-end financials for a business. Analyze this data and produce a concise close checklist.\\n\\n" +
  JSON.stringify(dataForAi, null, 2) +
  "\\n\\nProvide:\\n" +
  "1. A numbered checklist of open items that need attention before closing\\n" +
  "2. If previous month data exists, flag any category where spending changed by more than 25%\\n" +
  "3. A one-line overall health assessment\\n\\n" +
  "Keep it direct and actionable. No preamble.",
  { system: "You are a CFO assistant. Be specific, cite numbers, and keep it under 300 words." }
);

// 8. Save this month's summary for next month's comparison
const thisMonthData = {
  month: monthStart,
  pnl: currentPnl?.summary ?? null,
  spending: spending.slice(0, 10),
  uncategorized: uncategorizedCount,
  pendingInbox: pendingInboxCount,
  draftInvoices: draftInvoiceCount,
  closedAt: now.toISOString(),
};

await writeMemory(
  "month_close_summary",
  JSON.stringify(thisMonthData),
  "snapshot",
  { month: monthStart }
);

// 9. Notify team
const hasIssues = issues.length > 0;
await notify(
  (hasIssues ? "Month-end checklist (" + issues.length + " open items):\\n\\n" : "Month-end review — all clear:\\n\\n") +
  analysis
);

module.exports = {
  summary: hasIssues ? issues.length + " items need attention" : "Books are clean",
  uncategorized: uncategorizedCount,
  pendingInbox: pendingInboxCount,
  draftInvoices: draftInvoiceCount,
  errors,
  analysis,
};`,
  },
  {
    templateId: "invoice-chaser",
    name: "Invoice Chaser",
    slug: "invoice-chaser",
    description:
      "Intelligent weekly collections assistant: finds overdue and aging unpaid invoices, prioritizes by amount and age, tracks escalation history in memory, and proposes sending reminders for your approval.",
    scheduleCron: "0 9 * * 2",
    code: `const { callTool, parseMcp, generateText, readMemory, writeMemory, propose, notify } = SecureExec.bindings;

// 1. Fetch overdue and unpaid invoices
let overdue = [];
let unpaid = [];
const errors = [];

try {
  const overdueResult = await callTool("invoices_list", { statuses: ["overdue"], pageSize: 100 });
  overdue = parseMcp(overdueResult)?.data ?? [];
} catch (e) {
  errors.push("Failed to fetch overdue invoices: " + (e instanceof Error ? e.message : String(e)));
}

try {
  const unpaidResult = await callTool("invoices_list", { statuses: ["unpaid"], pageSize: 100 });
  unpaid = parseMcp(unpaidResult)?.data ?? [];
} catch (e) {
  errors.push("Failed to fetch unpaid invoices: " + (e instanceof Error ? e.message : String(e)));
}

if (errors.length > 0 && overdue.length === 0 && unpaid.length === 0) {
  await notify("Invoice Chaser encountered errors and could not fetch invoice data:\\n" + errors.join("\\n"), "urgent");
  module.exports = { summary: "Failed to fetch invoices", errors };
  return;
}

// Deduplicate: remove overdue invoices from unpaid set
const overdueIds = new Set(overdue.map(inv => inv.id));
unpaid = unpaid.filter(inv => !overdueIds.has(inv.id));
const allOutstanding = [...overdue, ...unpaid];

if (allOutstanding.length === 0) {
  await notify("No overdue or unpaid invoices this week. All clear!");
  module.exports = { summary: "No outstanding invoices", count: 0 };
  return;
}

// 2. Get customer context for unique customers
const customerIds = [...new Set(allOutstanding.map(inv => inv.customer?.id).filter(Boolean))];
const customerInfo = {};
for (const cid of customerIds.slice(0, 10)) {
  try {
    const cResult = await callTool("customers_get", { id: cid });
    const customer = parseMcp(cResult)?.data;
    if (customer) customerInfo[cid] = { name: customer.name, email: customer.email };
  } catch (e) {
    // Non-critical: customer enrichment failure doesn't block the workflow
  }
}

// 3. Load escalation history from memory
const memEntries = await readMemory({ key: "chaser_history" });
let history = {};
try {
  if (memEntries.length > 0) history = JSON.parse(memEntries[0].content);
} catch (e) {}

// 4. Build invoice summary for AI prioritization
const invoiceSummary = allOutstanding.map(inv => ({
  id: inv.id,
  number: inv.invoiceNumber,
  customer: inv.customer?.id ? (customerInfo[inv.customer.id]?.name ?? inv.customerName ?? "Unknown") : (inv.customerName ?? "Unknown"),
  amount: inv.amount,
  currency: inv.currency,
  status: inv.status,
  dueDate: inv.dueDate,
  daysPastDue: inv.dueDate ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000) : 0,
  previousReminders: history[inv.id]?.count ?? 0,
}));

// 5. AI prioritization
const prioritized = await generateText(
  "You are a collections specialist. Prioritize these outstanding invoices for follow-up.\\n\\n" +
  JSON.stringify(invoiceSummary, null, 2) +
  "\\n\\nRank them by urgency (oldest and largest first, repeat offenders higher). " +
  "For each, suggest whether to send a reminder or escalate. " +
  "Return a numbered list with invoice number, customer, amount, days overdue, and recommended action. " +
  "Keep it concise — max 5 words per recommendation.",
  { system: "You are a collections assistant. Be direct, prioritize by business impact." }
);

// 6. Propose sending reminders for overdue invoices
const remindActions = overdue
  .filter(inv => inv.dueDate)
  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  .slice(0, 10)
  .map(inv => {
    const custName = inv.customer?.id ? (customerInfo[inv.customer.id]?.name ?? inv.customerName ?? "Unknown") : (inv.customerName ?? "Unknown");
    const daysPastDue = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
    return {
      tool: "invoices_remind",
      args: { id: inv.id },
      description: "Send reminder for #" + (inv.invoiceNumber ?? inv.id.slice(0, 8)) +
        " (" + custName +
        ", " + (inv.currency ?? "") + " " + Math.abs(Number(inv.amount || 0)).toFixed(2) +
        ", " + daysPastDue + " days overdue)",
    };
  });

if (remindActions.length > 0) {
  const updatedHistory = { ...history };
  for (const inv of overdue) {
    updatedHistory[inv.id] = {
      count: (history[inv.id]?.count ?? 0) + 1,
      lastFlagged: new Date().toISOString(),
    };
  }
  await writeMemory("chaser_history", JSON.stringify(updatedHistory), "tracker");

  await notify(
    "Invoice Chaser found " + allOutstanding.length + " outstanding invoices (" +
    overdue.length + " overdue).\\n\\n" + prioritized +
    "\\n\\nReview proposed reminders with: midday computer proposals"
  );

  await propose(remindActions);
} else {
  await notify(
    "Invoice Chaser: " + allOutstanding.length + " unpaid invoices, none overdue yet.\\n\\n" + prioritized
  );
}

const totalOutstanding = allOutstanding.reduce((s, i) => s + Math.abs(Number(i.amount || 0)), 0);
module.exports = {
  summary: overdue.length + " overdue, " + unpaid.length + " unpaid (" + totalOutstanding.toFixed(2) + " total)",
  overdueCount: overdue.length,
  unpaidCount: unpaid.length,
  totalOutstanding,
  analysis: prioritized,
};`,
  },
  {
    templateId: "weekly-financial-briefing",
    name: "Weekly Financial Briefing",
    slug: "weekly-financial-briefing",
    description:
      "Monday morning executive summary: cash position, revenue vs expenses, week-over-week trends, outstanding invoices, and spending breakdown — with running trend analysis from memory.",
    scheduleCron: "0 8 * * 1",
    code: `const { callTool, parseMcp, generateText, readMemory, writeMemory, notify } = SecureExec.bindings;

const now = new Date();
const weekEnd = now.toISOString().split("T")[0];
const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

const errors = [];

// 1. Team currency
let currency = "USD";
try {
  const teamResult = await callTool("team_get", {});
  const team = parseMcp(teamResult)?.data;
  if (team?.baseCurrency) currency = team.baseCurrency;
} catch (e) {
  errors.push("Failed to fetch team info: " + (e instanceof Error ? e.message : String(e)));
}

// 2. Cash position
let balances = [];
try {
  const balResult = await callTool("bank_accounts_balances", {});
  balances = parseMcp(balResult)?.data ?? [];
} catch (e) {
  errors.push("Failed to fetch bank balances: " + (e instanceof Error ? e.message : String(e)));
}
const totalCash = balances.reduce((s, b) => s + Number(b.balance || 0), 0);

// 3. This week's P&L
let thisWeekPnl = null;
try {
  const pnlResult = await callTool("reports_profit", { from: weekStart, to: weekEnd, currency });
  thisWeekPnl = parseMcp(pnlResult);
} catch (e) {
  errors.push("Failed to fetch P&L: " + (e instanceof Error ? e.message : String(e)));
}

// 4. Revenue
let thisWeekRevenue = null;
try {
  const revResult = await callTool("reports_revenue", { from: weekStart, to: weekEnd, currency });
  thisWeekRevenue = parseMcp(revResult);
} catch (e) {
  errors.push("Failed to fetch revenue: " + (e instanceof Error ? e.message : String(e)));
}

// 5. Spending by category
let spending = [];
try {
  const spendResult = await callTool("reports_spending", { from: weekStart, to: weekEnd, currency });
  const spendData = parseMcp(spendResult);
  spending = spendData?.data ?? spendData ?? [];
} catch (e) {
  errors.push("Failed to fetch spending: " + (e instanceof Error ? e.message : String(e)));
}

// 6. Cash flow
let cashFlow = null;
try {
  const cfResult = await callTool("reports_cash_flow", { from: weekStart, to: weekEnd, currency });
  cashFlow = parseMcp(cfResult);
} catch (e) {
  errors.push("Failed to fetch cash flow: " + (e instanceof Error ? e.message : String(e)));
}

// 7. Invoice summary
let invoiceSummary = null;
try {
  const invResult = await callTool("invoices_summary", {});
  invoiceSummary = parseMcp(invResult);
} catch (e) {
  errors.push("Failed to fetch invoice summary: " + (e instanceof Error ? e.message : String(e)));
}

// 8. Load previous week's snapshot
const prevMemories = await readMemory({ key: "weekly_briefing" });
let prevSnapshot = null;
try {
  if (prevMemories.length > 0) prevSnapshot = JSON.parse(prevMemories[0].content);
} catch (e) {}

// 9. Load trend history (rolling 8 weeks)
const trendMemories = await readMemory({ key: "weekly_trends" });
let trends = [];
try {
  if (trendMemories.length > 0) trends = JSON.parse(trendMemories[0].content);
} catch (e) {}

// 10. AI briefing
const briefingData = {
  period: weekStart + " to " + weekEnd,
  currency,
  cashPosition: { totalCash, accounts: balances.length },
  profitLoss: thisWeekPnl?.summary ?? null,
  revenue: thisWeekRevenue?.summary ?? null,
  cashFlow: cashFlow?.summary ?? null,
  topSpending: spending.slice(0, 8),
  invoices: invoiceSummary,
  previousWeek: prevSnapshot,
  trendHistory: trends.slice(-4),
  dataErrors: errors.length > 0 ? errors : undefined,
};

const briefing = await generateText(
  "Create a weekly financial briefing from this data.\\n\\n" +
  JSON.stringify(briefingData, null, 2) +
  "\\n\\nStructure:\\n" +
  "1. **Cash Position** — total cash and change from last week\\n" +
  "2. **Revenue & Profit** — this week vs last week with % change\\n" +
  "3. **Top Spending** — largest categories and any notable changes\\n" +
  "4. **Invoices** — outstanding, overdue amounts, collection status\\n" +
  "5. **Trends** — if history exists, note multi-week patterns (growing/declining revenue, spending creep, etc.)\\n" +
  "6. **Key Actions** — 2-3 specific things to address this week\\n\\n" +
  "Keep it under 400 words. Use exact numbers. No generic advice.",
  { system: "You are a CFO producing a Monday morning briefing for the business owner. Be specific and concise." }
);

// 11. Save this week's snapshot
const thisWeekSnapshot = {
  week: weekStart,
  totalCash,
  profit: thisWeekPnl?.summary?.profit ?? null,
  revenue: thisWeekRevenue?.summary?.current ?? null,
  topSpending: spending.slice(0, 5).map(s => ({ category: s.name, amount: s.amount })),
  createdAt: now.toISOString(),
};

await writeMemory("weekly_briefing", JSON.stringify(thisWeekSnapshot), "snapshot", { week: weekStart });

// Save rolling trend (keep last 12 weeks)
const updatedTrends = [...trends, thisWeekSnapshot].slice(-12);
await writeMemory("weekly_trends", JSON.stringify(updatedTrends), "trends");

// 12. Notify
const errorNote = errors.length > 0 ? "\\n\\n\\u26a0 " + errors.length + " data source(s) unavailable — briefing may be incomplete." : "";
await notify("Weekly Financial Briefing — " + weekStart + "\\n\\n" + briefing + errorNote);

module.exports = {
  summary: "Briefing delivered for " + weekStart,
  totalCash,
  errors,
  briefing,
};`,
  },
  {
    templateId: "expense-anomaly-detector",
    name: "Expense Anomaly Detector",
    slug: "expense-anomaly-detector",
    description:
      "Daily scan for unusual expenses: flags transactions that are abnormally large for their category, new unknown vendors, spending spikes, and potential duplicates. Only notifies when something looks wrong.",
    scheduleCron: "0 10 * * *",
    code: `const { callTool, parseMcp, generateText, readMemory, writeMemory, notify } = SecureExec.bindings;

const now = new Date();
const today = now.toISOString().split("T")[0];
const yesterday = new Date(now.getTime() - 24 * 3600000).toISOString().split("T")[0];
const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0];

// 1. Get recent expenses (last 24h)
let recentExpenses = [];
try {
  const txnResult = await callTool("transactions_list", {
    start: yesterday,
    end: today,
    type: "expense",
    pageSize: 100,
  });
  recentExpenses = parseMcp(txnResult)?.data ?? [];
} catch (e) {
  await notify("Expense Anomaly Detector failed to fetch recent expenses: " + (e instanceof Error ? e.message : String(e)), "urgent");
  module.exports = { summary: "Failed to fetch expenses", error: e instanceof Error ? e.message : String(e) };
  return;
}

if (recentExpenses.length === 0) {
  module.exports = { summary: "No new expenses to analyze", anomalies: 0 };
  return;
}

// 2. Get 90-day spending baseline by category
let spendingBaseline = [];
try {
  const baseResult = await callTool("reports_spending", {
    from: threeMonthsAgo,
    to: today,
  });
  const baseData = parseMcp(baseResult);
  spendingBaseline = baseData?.data ?? baseData ?? [];
} catch (e) {
  // Non-critical: anomaly detection will run without baselines
}

// 3. Load previously flagged IDs and baselines from memory
const flagMemories = await readMemory({ key: "anomaly_flagged_ids" });
let flaggedIdList = [];
try {
  if (flagMemories.length > 0) flaggedIdList = JSON.parse(flagMemories[0].content);
} catch (e) {}
const flaggedIds = new Set(flaggedIdList);

const baselineMemories = await readMemory({ key: "anomaly_baselines" });
let storedBaselines = {};
try {
  if (baselineMemories.length > 0) storedBaselines = JSON.parse(baselineMemories[0].content);
} catch (e) {}

// 4. Build baseline map (daily average per category over 90 days)
const baselineMap = {};
for (const cat of spendingBaseline) {
  const catName = cat.name || "unknown";
  const dailyAvg = Math.abs(Number(cat.amount || 0)) / 90;
  baselineMap[catName] = {
    dailyAvg,
    totalAmount: Math.abs(Number(cat.amount || 0)),
    name: catName,
  };
}

// 5. Filter to only new (unflagged) expenses
const newExpenses = recentExpenses.filter(tx => !flaggedIds.has(tx.id));

if (newExpenses.length === 0) {
  module.exports = { summary: "No new unflagged expenses", anomalies: 0 };
  return;
}

// 6. AI anomaly detection
const analysisData = {
  newExpenses: newExpenses.map(tx => ({
    id: tx.id,
    name: tx.name,
    amount: Math.abs(Number(tx.amount || 0)),
    currency: tx.currency,
    category: tx.category?.name ?? tx.category?.slug ?? "uncategorized",
    date: tx.date,
  })),
  categoryBaselines: baselineMap,
  previousBaselines: storedBaselines,
};

const analysis = await generateText(
  "Analyze these recent expenses against the 90-day category baselines.\\n\\n" +
  JSON.stringify(analysisData, null, 2) +
  "\\n\\nFlag as anomalies:\\n" +
  "- Transactions >3x the daily category average\\n" +
  "- Categories with no baseline (new/unknown spending)\\n" +
  "- Potential duplicate charges (same amount + similar name within 24h)\\n" +
  "- Any single transaction over 2000 in the base currency\\n\\n" +
  "For each anomaly, state: transaction name, amount, why it's flagged, and severity (high/medium/low).\\n" +
  "If nothing looks unusual, start your response with 'ALL_CLEAR:' followed by a brief summary.\\n" +
  "Be conservative — only flag genuinely unusual items.",
  { system: "You are a financial controller reviewing daily expenses. Flag only real anomalies, not normal business costs." }
);

// 7. Update flagged IDs (add all reviewed, keep last 500)
const allFlaggedIds = [...flaggedIds, ...newExpenses.map(tx => tx.id)].slice(-500);
await writeMemory("anomaly_flagged_ids", JSON.stringify(allFlaggedIds), "tracker");

// Update baselines snapshot
await writeMemory("anomaly_baselines", JSON.stringify(baselineMap), "snapshot", { date: today });

// 8. Only notify if anomalies found
const hasAnomalies = !analysis.startsWith("ALL_CLEAR:");

if (hasAnomalies) {
  const expenseTotal = newExpenses.reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
  const isUrgent = newExpenses.some(t => Math.abs(Number(t.amount || 0)) > 5000);

  await notify(
    "Expense Alert — " + newExpenses.length + " new expenses reviewed (" + expenseTotal.toFixed(2) + " total)\\n\\n" +
    analysis,
    isUrgent ? "urgent" : "normal"
  );
}

module.exports = {
  summary: hasAnomalies
    ? "Anomalies detected in " + newExpenses.length + " expenses"
    : "All clear — " + newExpenses.length + " expenses reviewed",
  expensesReviewed: newExpenses.length,
  anomaliesDetected: hasAnomalies,
  analysis: hasAnomalies ? analysis : null,
};`,
  },
];
