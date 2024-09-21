import { Meta, StoryFn } from "@storybook/react";
import { AnalyticsChart, FinancialData } from "./analytics-chart";

export default {
  component: AnalyticsChart,
  parameters: {
    layout: "centered",
  },
  decorators: [(Story) => <Story />],
} as Meta<typeof AnalyticsChart>;

const Template: StoryFn<typeof AnalyticsChart> = (args) => (
  <div className="w-[900px]">
    <AnalyticsChart {...args} />
  </div>
);

// Helper function to generate sample stock data
const generateSampleData = (days: number): FinancialData[] => {
  const data: FinancialData[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const basePrice = 100 + Math.random() * 50;
    data.push({
      date: date.toISOString().split("T")[0] || "",
      expense: basePrice,
      revenue: basePrice + Math.random() * 5,
      profit: basePrice - Math.random() * 5,
    });
  }
  return data;
};

export const Default = Template.bind({});
Default.args = {
  chartData: generateSampleData(90),
  title: "Stock Price Chart",
  description: "Interactive stock price chart for the last 3 months",
};

export const UpwardTrend = Template.bind({});
UpwardTrend.args = {
  chartData: generateSampleData(90).map((item, index) => ({
    ...item,
    revenue: item.revenue * (1 + index * 0.01),
  })),
  title: "Upward Trending Stock",
  description: "Stock with a clear upward trend",
};

export const DownwardTrend = Template.bind({});
DownwardTrend.args = {
  chartData: generateSampleData(90).map((item, index) => ({
    ...item,
    revenue: item.revenue * (1 - index * 0.01),
  })),
  title: "Downward Trending Stock",
  description: "Stock with a clear downward trend",
};
