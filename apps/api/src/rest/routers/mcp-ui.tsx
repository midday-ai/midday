/** @jsxImportSource hono/jsx */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { html } from "hono/html";
import type { FC } from "hono/jsx";

const app = new OpenAPIHono<Context>();

// Available charts
const CHARTS = [
  "spending-chart",
  "burn-rate-chart",
  "cash-flow-chart",
  "revenue-chart",
  "profit-chart",
  "runway-gauge",
  "forecast-chart",
  "growth-rate-chart",
  "profit-margin-chart",
  "invoice-status-chart",
] as const;

// Get the path to mcp-ui bundles
function getBundlePath(chartId: string): string | null {
  try {
    const mcpUiPath = require.resolve("@midday/mcp-ui/package.json");
    const bundlePath = resolve(
      dirname(mcpUiPath),
      `dist/bundles/src/apps/entries/${chartId}.html`,
    );
    if (existsSync(bundlePath)) return bundlePath;
  } catch {}

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const devPath = resolve(
    __dirname,
    `../../../../../packages/mcp-ui/dist/bundles/src/apps/entries/${chartId}.html`,
  );
  if (existsSync(devPath)) return devPath;

  return null;
}

// Sample data for charts
const SAMPLE_DATA: Record<string, unknown> = {
  "spending-chart": [
    {
      name: "Software & SaaS",
      slug: "software",
      amount: 4500,
      currency: "USD",
      percentage: 35,
    },
    {
      name: "Marketing",
      slug: "marketing",
      amount: 2800,
      currency: "USD",
      percentage: 22,
    },
    {
      name: "Office",
      slug: "office",
      amount: 1900,
      currency: "USD",
      percentage: 15,
    },
    {
      name: "Travel",
      slug: "travel",
      amount: 1500,
      currency: "USD",
      percentage: 12,
    },
    {
      name: "Other",
      slug: "other",
      amount: 900,
      currency: "USD",
      percentage: 7,
    },
  ],
  "burn-rate-chart": {
    data: [
      { date: "2024-01-01", value: 45000 },
      { date: "2024-02-01", value: 52000 },
      { date: "2024-03-01", value: 48000 },
      { date: "2024-04-01", value: 51000 },
      { date: "2024-05-01", value: 47000 },
      { date: "2024-06-01", value: 55000 },
    ],
    averageBurnRate: 49667,
    currency: "USD",
  },
  "cash-flow-chart": {
    data: [
      { month: "Jan", income: 85000, expenses: 45000, netCashFlow: 40000 },
      { month: "Feb", income: 92000, expenses: 52000, netCashFlow: 40000 },
      { month: "Mar", income: 78000, expenses: 48000, netCashFlow: 30000 },
      { month: "Apr", income: 95000, expenses: 51000, netCashFlow: 44000 },
      { month: "May", income: 88000, expenses: 47000, netCashFlow: 41000 },
      { month: "Jun", income: 102000, expenses: 55000, netCashFlow: 47000 },
    ],
    summary: {
      netCashFlow: 242000,
      totalIncome: 540000,
      totalExpenses: 298000,
      averageMonthlyCashFlow: 40333,
      currency: "USD",
    },
  },
  "revenue-chart": {
    result: [
      {
        date: "2024-01-01",
        current: { value: 85000 },
        previous: { value: 72000 },
      },
      {
        date: "2024-02-01",
        current: { value: 92000 },
        previous: { value: 78000 },
      },
      {
        date: "2024-03-01",
        current: { value: 78000 },
        previous: { value: 85000 },
      },
      {
        date: "2024-04-01",
        current: { value: 95000 },
        previous: { value: 82000 },
      },
      {
        date: "2024-05-01",
        current: { value: 88000 },
        previous: { value: 79000 },
      },
      {
        date: "2024-06-01",
        current: { value: 102000 },
        previous: { value: 88000 },
      },
    ],
    summary: { currentTotal: 540000, prevTotal: 484000, currency: "USD" },
  },
  "profit-chart": {
    result: [
      {
        date: "2024-01-01",
        current: { value: 40000 },
        previous: { value: 32000 },
      },
      {
        date: "2024-02-01",
        current: { value: 40000 },
        previous: { value: 28000 },
      },
      {
        date: "2024-03-01",
        current: { value: 30000 },
        previous: { value: 35000 },
      },
      {
        date: "2024-04-01",
        current: { value: 44000 },
        previous: { value: 32000 },
      },
      {
        date: "2024-05-01",
        current: { value: 41000 },
        previous: { value: 29000 },
      },
      {
        date: "2024-06-01",
        current: { value: 47000 },
        previous: { value: 38000 },
      },
    ],
    summary: { currentTotal: 242000, prevTotal: 194000, currency: "USD" },
  },
  "runway-gauge": {
    months: 14,
    totalBalance: 700000,
    averageBurnRate: 50000,
    currency: "USD",
  },
  "forecast-chart": {
    historical: [
      { date: "2024-01-01", value: 85000 },
      { date: "2024-02-01", value: 92000 },
      { date: "2024-03-01", value: 78000 },
      { date: "2024-04-01", value: 95000 },
      { date: "2024-05-01", value: 88000 },
      { date: "2024-06-01", value: 102000 },
    ],
    forecast: [
      {
        date: "2024-07-01",
        value: 108000,
        optimistic: 120000,
        pessimistic: 95000,
      },
      {
        date: "2024-08-01",
        value: 112000,
        optimistic: 128000,
        pessimistic: 98000,
      },
      {
        date: "2024-09-01",
        value: 118000,
        optimistic: 135000,
        pessimistic: 102000,
      },
    ],
    summary: {
      nextMonthProjection: 108000,
      avgMonthlyGrowthRate: 3.8,
      totalProjectedRevenue: 338000,
      currency: "USD",
    },
  },
  "growth-rate-chart": {
    summary: {
      currentTotal: 540000,
      previousTotal: 484000,
      growthRate: 11.6,
      periodGrowthRate: 11.6,
      trend: "positive",
      currency: "USD",
    },
    result: {
      current: {
        total: 540000,
        period: { from: "2024-01-01", to: "2024-06-30" },
        data: [
          { date: "2024-01-01", value: 85000 },
          { date: "2024-02-01", value: 92000 },
          { date: "2024-03-01", value: 78000 },
          { date: "2024-04-01", value: 95000 },
          { date: "2024-05-01", value: 88000 },
          { date: "2024-06-01", value: 102000 },
        ],
      },
      previous: {
        total: 484000,
        period: { from: "2023-01-01", to: "2023-06-30" },
        data: [
          { date: "2023-01-01", value: 72000 },
          { date: "2023-02-01", value: 78000 },
          { date: "2023-03-01", value: 85000 },
          { date: "2023-04-01", value: 82000 },
          { date: "2023-05-01", value: 79000 },
          { date: "2023-06-01", value: 88000 },
        ],
      },
    },
  },
  "profit-margin-chart": {
    data: [
      { date: "2024-01-01", profitMargin: 47.1, revenue: 85000, profit: 40000 },
      { date: "2024-02-01", profitMargin: 43.5, revenue: 92000, profit: 40000 },
      { date: "2024-03-01", profitMargin: 38.5, revenue: 78000, profit: 30000 },
      { date: "2024-04-01", profitMargin: 46.3, revenue: 95000, profit: 44000 },
      { date: "2024-05-01", profitMargin: 46.6, revenue: 88000, profit: 41000 },
      {
        date: "2024-06-01",
        profitMargin: 46.1,
        revenue: 102000,
        profit: 47000,
      },
    ],
    summary: {
      averageMargin: 44.7,
      trend: "up",
      highestMargin: { date: "2024-01-01", value: 47.1 },
      lowestMargin: { date: "2024-03-01", value: 38.5 },
    },
  },
  "invoice-status-chart": {
    totalCount: 45,
    totalAmount: 125000,
    statuses: [
      { status: "paid", count: 28, amount: 78000 },
      { status: "unpaid", count: 10, amount: 32000 },
      { status: "overdue", count: 4, amount: 12000 },
      { status: "draft", count: 3, amount: 3000 },
    ],
    currency: "USD",
  },
};

// Layout component
const Layout: FC<{ title: string; children: unknown }> = ({
  title,
  children,
}) => (
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title}</title>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0c0c0c;
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        h1 { margin-bottom: 20px; font-size: 24px; }
        .chart-frame {
          width: 100%;
          max-width: 800px;
          height: 500px;
          border: 1px solid #333;
          border-radius: 8px;
          background: #0c0c0c;
        }
        .controls {
          margin-top: 20px;
          display: flex;
          gap: 10px;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: #333;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover { background: #444; }
        textarea {
          width: 100%;
          max-width: 800px;
          height: 200px;
          margin-top: 20px;
          padding: 12px;
          border: 1px solid #333;
          border-radius: 8px;
          background: #1a1a1a;
          color: white;
          font-family: monospace;
          font-size: 12px;
        }
        .nav {
          margin-bottom: 20px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .nav a {
          padding: 8px 16px;
          border-radius: 6px;
          background: #222;
          color: #888;
          text-decoration: none;
          font-size: 14px;
        }
        .nav a:hover { background: #333; color: white; }
        .nav a.active { background: #0066cc; color: white; }
      `}</style>
    </head>
    <body>{children}</body>
  </html>
);

// Navigation component
const ChartNav: FC<{ currentChart: string }> = ({ currentChart }) => (
  <nav class="nav">
    {CHARTS.map((id) => (
      <a
        href={`/mcp-ui/viewer/${id}`}
        class={id === currentChart ? "active" : ""}
      >
        {id
          .replace("-chart", "")
          .replace("-", " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      </a>
    ))}
  </nav>
);

// Viewer page component
const ViewerPage: FC<{ chartId: string; sampleData: string }> = ({
  chartId,
  sampleData,
}) => (
  <Layout title={`MCP UI Viewer - ${chartId}`}>
    <h1>MCP UI Chart Viewer</h1>
    <ChartNav currentChart={chartId} />

    <iframe
      id="chartFrame"
      class="chart-frame"
      src={`/mcp-ui/charts/${chartId}`}
    />

    <div class="controls">
      <button onclick="sendData()">Send Sample Data</button>
      <button onclick="reloadChart()">Reload</button>
    </div>

    <textarea id="dataInput" placeholder="Paste JSON data here...">
      {sampleData}
    </textarea>

    {html`<script>
      const frame = document.getElementById('chartFrame');
      const dataInput = document.getElementById('dataInput');

      function sendData() {
        try {
          const data = JSON.parse(dataInput.value);
          frame.contentWindow.postMessage({
            jsonrpc: '2.0',
            method: 'ui/notifications/tool-result',
            params: {
              result: {
                content: [{ type: 'text', text: JSON.stringify(data) }]
              }
            }
          }, '*');
        } catch (e) {
          alert('Invalid JSON: ' + e.message);
        }
      }

      function reloadChart() {
        frame.src = frame.src;
      }

      frame.onload = () => {
        setTimeout(sendData, 200);
      };
    </script>`}
  </Layout>
);

// Routes

// Serve chart HTML bundles directly
app.get("/charts/:chartId", (c) => {
  const chartId = c.req.param("chartId");
  const bundlePath = getBundlePath(chartId);

  if (!bundlePath) {
    return c.json({ error: `Chart not found: ${chartId}` }, 404);
  }

  const chartHtml = readFileSync(bundlePath, "utf-8");
  return c.html(chartHtml);
});

// Viewer page
app.get("/viewer/:chartId", (c) => {
  const chartId = c.req.param("chartId");
  const bundlePath = getBundlePath(chartId);

  if (!bundlePath) {
    return c.json({ error: `Chart not found: ${chartId}` }, 404);
  }

  const sampleData = JSON.stringify(SAMPLE_DATA[chartId] || {}, null, 2);

  return c.html(<ViewerPage chartId={chartId} sampleData={sampleData} />);
});

// List available charts
app.get("/", (c) => {
  return c.json({
    message: "MCP UI Charts",
    endpoints: {
      viewer: "/mcp-ui/viewer/:chartId",
      chart: "/mcp-ui/charts/:chartId",
    },
    charts: CHARTS.map((id) => ({
      id,
      viewer: `/mcp-ui/viewer/${id}`,
      raw: `/mcp-ui/charts/${id}`,
    })),
  });
});

export const mcpUIRouter = app;
