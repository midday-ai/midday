import { useAssistant } from "@ai-sdk/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useVercelUseAssistantRuntime } from "@assistant-ui/react-ai-sdk";
import { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { JSX } from "react/jsx-runtime";

import { DonutChart, DonutChartProps } from "./donut-chart";

const AssistantProviderWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const assistant = useAssistant({
    api: "/api/assistant",
  });

  const runtime = useVercelUseAssistantRuntime(assistant);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};

export default {
  component: DonutChart,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    height: {
      control: { type: "range", min: 200, max: 600, step: 10 },
    },
    title: { control: "text" },
    description: { control: "text" },
    activeIndex: { control: "number" },
    trendPercentage: { control: "number" },
    trendPeriod: { control: "text" },
  },
  decorators: [
    (Story) => (
      <AssistantProviderWrapper>
        <Story />
      </AssistantProviderWrapper>
    ),
  ],
} as Meta;

const chartData = [
  { browser: "chrome", visitors: 275, fill: "hsl(var(--chart-1))" },
  { browser: "safari", visitors: 200, fill: "hsl(var(--chart-2))" },
  { browser: "firefox", visitors: 187, fill: "hsl(var(--chart-3))" },
  { browser: "edge", visitors: 173, fill: "hsl(var(--chart-4))" },
  { browser: "other", visitors: 90, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "hsl(var(--chart-1))" },
  safari: { label: "Safari", color: "hsl(var(--chart-2))" },
  firefox: { label: "Firefox", color: "hsl(var(--chart-3))" },
  edge: { label: "Edge", color: "hsl(var(--chart-4))" },
  other: { label: "Other", color: "hsl(var(--chart-5))" },
};

const Template: StoryFn<DonutChartProps> = (args) => (
  <div style={{ width: "500px", height: "500px" }}>
    <DonutChart {...args} />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  title: "Pie Chart - Donut Active",
  description: "January - June 2024",
  data: chartData,
  config: chartConfig,
  dataKey: "visitors",
  nameKey: "browser",
  activeIndex: 0,
  trendPercentage: 5.2,
  trendPeriod: "this month",
  footerDescription: "Showing total visitors for the last 6 months",
};

export const NegativeTrend = Template.bind({});
NegativeTrend.args = {
  ...Default.args,
  title: "Pie Chart - Negative Trend",
  trendPercentage: -3.7,
};

export const NoTrend = Template.bind({});
NoTrend.args = {
  ...Default.args,
  title: "Pie Chart - No Trend",
  trendPercentage: undefined,
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  ...Default.args,
  title: "Pie Chart - Custom Colors",
  data: chartData.map((item) => ({
    ...item,
    fill:
      item.browser === "chrome"
        ? "#4285F4"
        : item.browser === "safari"
          ? "#34A853"
          : item.browser === "firefox"
            ? "#FBBC05"
            : item.browser === "edge"
              ? "#EA4335"
              : "#767676",
  })),
  config: {
    ...chartConfig,
    chrome: { label: "Chrome", color: "#4285F4" },
    safari: { label: "Safari", color: "#34A853" },
    firefox: { label: "Firefox", color: "#FBBC05" },
    edge: { label: "Edge", color: "#EA4335" },
    other: { label: "Other", color: "#767676" },
  },
};

export const DifferentActiveIndex = Template.bind({});
DifferentActiveIndex.args = {
  ...Default.args,
  title: "Pie Chart - Different Active Slice",
  activeIndex: 2,
};

export const InteractiveFeatures: StoryFn<DonutChartProps> = (args) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const handleSliceClick = (index: number) => {
    setActiveIndex(index);
    alert(`Clicked on slice ${index}`);
  };

  return (
    <div style={{ width: "500px", height: "500px" }}>
      <DonutChart {...args} activeIndex={activeIndex} />
    </div>
  );
};
InteractiveFeatures.args = {
  ...Default.args,
  title: "Interactive Donut Chart",
  description: "Click on slices to interact",
};
