const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthSeries(count = 12) {
  return months.slice(0, count).map((m) => `${m} 2025`);
}

export const revenueData = {
  summary: {
    currentTotal: 124500,
    prevTotal: 98200,
    currency: "USD",
  },
  meta: { from: "2025-01-01", to: "2025-06-30" },
  result: monthSeries(6).map((date, i) => ({
    date,
    current: { value: 18000 + Math.round(Math.random() * 8000) },
    previous: { value: 14000 + Math.round(Math.random() * 6000) },
  })),
};

export const burnRateData = {
  data: monthSeries(6).map((date) => ({
    date,
    value: 12000 + Math.round(Math.random() * 5000),
    currency: "USD",
  })),
};

export const cashFlowData = {
  data: {
    currency: "USD",
    totalIncome: 124500,
    totalExpenses: -87300,
    netCashFlow: 37200,
    periods: monthSeries(6).map((period) => ({
      period,
      income: 18000 + Math.round(Math.random() * 8000),
      expenses: -(10000 + Math.round(Math.random() * 6000)),
      netCashFlow: 4000 + Math.round(Math.random() * 4000),
    })),
  },
};

export const growthRateData = {
  data: {
    growthPercentage: 26.8,
    trend: "increasing",
    currency: "USD",
    currentPeriodTotal: 124500,
    previousPeriodTotal: 98200,
    monthlyBreakdown: monthSeries(6).map((date) => ({
      date,
      value: 18000 + Math.round(Math.random() * 8000),
      growthPercentage: -5 + Math.round(Math.random() * 30),
    })),
  },
};

export const profitMarginData = {
  data: {
    overallMargin: 29.8,
    trend: "stable",
    currency: "USD",
    totalRevenue: 124500,
    totalProfit: 37100,
    monthlyBreakdown: monthSeries(6).map((date) => ({
      date,
      revenue: 18000 + Math.round(Math.random() * 8000),
      profit: 4000 + Math.round(Math.random() * 4000),
      margin: 20 + Math.round(Math.random() * 20),
    })),
  },
};

const historicalValues = [19200, 21400, 18800, 22600, 20100, 24300];
const forecastValues = [
  { value: 25800, upper: 29800, lower: 21800 },
  { value: 27200, upper: 32200, lower: 22200 },
  { value: 26500, upper: 31500, lower: 21500 },
  { value: 28900, upper: 34900, lower: 22900 },
];

export const forecastData = {
  summary: {
    projectedTotal: 260000,
    historicalAvg: 20750,
    confidence: 82,
    currency: "USD",
  },
  historical: monthSeries(6).map((date, i) => ({
    date,
    actual: historicalValues[i],
  })),
  forecast: ["Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025"].map((date, i) => ({
    date,
    forecast: forecastValues[i]?.value,
    upperBound: forecastValues[i]?.upper,
    lowerBound: forecastValues[i]?.lower,
  })),
  combined: [
    ...monthSeries(6).map((date, i) => ({
      date,
      actual: historicalValues[i],
      ...(i === 5 ? { forecast: historicalValues[i] } : {}),
    })),
    ...["Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025"].map((date, i) => ({
      date,
      forecast: forecastValues[i]?.value,
      upperBound: forecastValues[i]?.upper,
      lowerBound: forecastValues[i]?.lower,
    })),
  ],
  meta: { model: "linear_regression", periodMonths: 4 },
};

export const recurringExpensesData = {
  data: [
    {
      name: "AWS",
      amount: 3200,
      frequency: "monthly",
      currency: "USD",
    },
    {
      name: "Slack",
      amount: 850,
      frequency: "monthly",
      currency: "USD",
    },
    {
      name: "GitHub",
      amount: 440,
      frequency: "monthly",
      currency: "USD",
    },
    {
      name: "Vercel",
      amount: 200,
      frequency: "monthly",
      currency: "USD",
    },
    {
      name: "Linear",
      amount: 160,
      frequency: "monthly",
      currency: "USD",
    },
  ],
};

export const taxSummaryData = {
  data: [
    {
      category: "Sales Tax",
      taxType: "VAT",
      amount: 8450,
      currency: "USD",
    },
    {
      category: "Income Tax",
      taxType: "Federal",
      amount: 12300,
      currency: "USD",
    },
    {
      category: "Payroll Tax",
      taxType: "FICA",
      amount: 6200,
      currency: "USD",
    },
    {
      category: "State Tax",
      taxType: "Income",
      amount: 3800,
      currency: "USD",
    },
  ],
};

export const spendingData = {
  data: [
    {
      name: "Software",
      slug: "software",
      amount: 12400,
      currency: "USD",
      percentage: 32,
      color: "#3b82f6",
    },
    {
      name: "Salaries",
      slug: "salaries",
      amount: 9800,
      currency: "USD",
      percentage: 25,
      color: "#10b981",
    },
    {
      name: "Office",
      slug: "office",
      amount: 6200,
      currency: "USD",
      percentage: 16,
      color: "#f59e0b",
    },
    {
      name: "Marketing",
      slug: "marketing",
      amount: 5500,
      currency: "USD",
      percentage: 14,
      color: "#ef4444",
    },
    {
      name: "Travel",
      slug: "travel",
      amount: 4900,
      currency: "USD",
      percentage: 13,
      color: "#8b5cf6",
    },
  ],
};

export const balanceSheetData = {
  data: {
    asOf: "2025-03-26",
    currency: "USD",
    locale: "en-US",
    assets: {
      current: [
        { label: "Cash & Equivalents", amount: 245000 },
        { label: "Accounts Receivable", amount: 67000 },
        { label: "Inventory", amount: 23000 },
      ],
      nonCurrent: [
        { label: "Property & Equipment", amount: 150000 },
        { label: "Intangible Assets", amount: 45000 },
      ],
    },
    liabilities: {
      current: [
        { label: "Accounts Payable", amount: 34000 },
        { label: "Accrued Expenses", amount: 12000 },
        { label: "Short-term Debt", amount: 25000 },
      ],
      nonCurrent: [
        { label: "Long-term Debt", amount: 120000 },
        { label: "Deferred Revenue", amount: 18000 },
      ],
    },
    equity: {
      items: [
        { label: "Common Stock", amount: 100000 },
        { label: "Retained Earnings", amount: 221000 },
      ],
    },
    ratios: {
      currentRatio: 4.72,
      debtToEquity: 0.59,
      workingCapital: 264000,
    },
  },
};

export const invoiceData = {
  data: {
    id: "inv_abc123",
    invoiceNumber: "INV-0042",
    status: "draft",
    customerName: "Acme Corp",
    amount: 12500,
    currency: "USD",
    dueDate: "2025-04-15",
    issueDate: "2025-03-26",
    discount: 0,
    template: {
      title: "Invoice",
      logoUrl: "https://midday.ai/email/logo.png",
      customerLabel: "To",
      fromLabel: "From",
      invoiceNoLabel: "Invoice No",
      issueDateLabel: "Issue Date",
      dueDateLabel: "Due Date",
      descriptionLabel: "Description",
      priceLabel: "Price",
      quantityLabel: "Quantity",
      totalLabel: "Total",
      totalSummaryLabel: "Total",
      vatLabel: "VAT",
      subtotalLabel: "Subtotal",
      taxLabel: "Tax",
      discountLabel: "Discount",
      paymentLabel: "Payment Details",
      noteLabel: "Note",
      lineItemTaxLabel: "Tax",
      dateFormat: "dd/MM/yyyy",
      locale: "en-US",
      size: "a4",
      includeVat: true,
      vatRate: 25,
      includeTax: false,
      taxRate: 0,
      includeDiscount: false,
      includeLineItemTax: false,
      includeDecimals: false,
      includeUnits: false,
    },
    lineItems: [
      { name: "Website Design & Development", quantity: 1, price: 8500 },
      { name: "Brand Identity Package", quantity: 1, price: 2500 },
      { name: "SEO Audit & Optimization", quantity: 3, price: 500 },
    ],
    fromDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Midday Labs AB", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Storgatan 12" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "111 51 Stockholm, Sweden" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "hello@midday.ai",
              marks: [
                { type: "link", attrs: { href: "mailto:hello@midday.ai" } },
              ],
            },
          ],
        },
      ],
    },
    customerDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Acme Corp", marks: [{ type: "bold" }] },
          ],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "1234 Market Street" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "San Francisco, CA 94103" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "United States" }],
        },
      ],
    },
    paymentDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Bank: ", marks: [{ type: "bold" }] },
            { type: "text", text: "Swedbank" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "IBAN: ", marks: [{ type: "bold" }] },
            { type: "text", text: "SE45 5000 0000 0583 9825 7466" },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "BIC: ", marks: [{ type: "bold" }] },
            { type: "text", text: "SWEDSESS" },
          ],
        },
      ],
    },
    noteDetails: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Thank you for your business!" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Payment is due within 30 days of the invoice date.",
            },
          ],
        },
      ],
    },
    topBlock: null,
    bottomBlock: null,
  },
};
